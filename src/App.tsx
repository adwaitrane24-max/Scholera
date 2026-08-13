import { useEffect, useMemo, useState } from "react";
import conversationData from "../data/conversation.json";
import conversationEmptyData from "../data/conversation-empty.json";
import { getScenario } from "../data/mock-stream.mjs";
import Composer from "./components/Composer";
import EmptyStateTopics from "./components/EmptyStateTopics";
import MessageList from "./components/MessageList";
import SavedView from "./components/SavedView";
import SlideDetail from "./components/SlideDetail";
import { getAllTopics, resolveCitation } from "./lectureIndex";
import { getPinned, isPinned, pinMessage, unpinMessage } from "./pinnedStore";
import type { Citation, Conversation, Lecture, Message, ScenarioId, Slide } from "./types";
import { getScenarioList, matchScenario, useMockStream } from "./useMockStream";
import type { StreamStatus } from "./useMockStream";

interface ActiveSlide {
  lecture: Lecture;
  slide: Slide;
}

interface StreamMeta {
  scenarioId: ScenarioId;
}

export default function App() {
  const seedConversation = (conversationData as Conversation).messages.length
    ? (conversationData as Conversation)
    : (conversationEmptyData as Conversation);

  const [conversation, setConversation] = useState<Conversation>(seedConversation);
  const [draft, setDraft] = useState("");
  const [activeSlide, setActiveSlide] = useState<ActiveSlide | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [pinned, setPinned] = useState<Message[]>(() => getPinned());
  const [streamStates, setStreamStates] = useState<Record<string, StreamStatus>>({});
  const [streamErrors, setStreamErrors] = useState<Record<string, string | undefined>>({});
  const [streamMetaByMessageId, setStreamMetaByMessageId] = useState<Record<string, StreamMeta>>({});
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId | null>(null);

  const { state: streamState, run, cancel } = useMockStream();
  const topics = useMemo(() => getAllTopics(), []);
  const pinnedIds = useMemo(() => new Set(pinned.map((message) => message.id)), [pinned]);
  const isStreaming = streamState.status === "idle" || streamState.status === "slow-start" || streamState.status === "streaming";

  useEffect(() => {
    if (!activeAssistantId) {
      return;
    }

    setStreamStates((current) => ({
      ...current,
      [activeAssistantId]: streamState.status,
    }));

    setConversation((current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.id === activeAssistantId
          ? {
              ...message,
              content: streamState.text,
              citations: streamState.citations,
            }
          : message,
      ),
    }));

    if (streamState.status === "error") {
      setStreamErrors((current) => ({ ...current, [activeAssistantId]: streamState.errorMessage }));
      setActiveAssistantId(null);
      return;
    }

    if (streamState.status === "done" || streamState.status === "cancelled") {
      setStreamErrors((current) => ({ ...current, [activeAssistantId]: undefined }));
      setActiveAssistantId(null);
    }
  }, [activeAssistantId, streamState]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (activeSlide) {
        setActiveSlide(null);
      }
      if (savedOpen) {
        setSavedOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeSlide, savedOpen]);

  function openCitation(citation: Citation) {
    const resolved = resolveCitation(citation);
    if (!resolved) {
      return;
    }
    setActiveSlide(resolved);
  }

  function togglePin(message: Message) {
    const nextPinned = isPinned(message.id) ? unpinMessage(message.id) : pinMessage(message);
    setPinned(nextPinned);
  }

  function appendPrompt(prompt: string) {
    setDraft(prompt);
  }

  function beginAssistantStream(userContent: string, scenarioId: ScenarioId) {
    const now = Date.now();
    const userMessage: Message = {
      id: `user-${now}`,
      role: "user",
      created_at: new Date(now).toISOString(),
      content: userContent,
    };
    const assistantMessageId = `assistant-${now}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      created_at: new Date(now + 1).toISOString(),
      content: "",
      citations: [],
    };

    setConversation((current) => ({
      ...current,
      messages: [...current.messages, userMessage, assistantMessage],
    }));
    setStreamMetaByMessageId((current) => ({
      ...current,
      [assistantMessageId]: { scenarioId },
    }));
    setStreamErrors((current) => ({ ...current, [assistantMessageId]: undefined }));
    setActiveScenarioId(scenarioId);
    setActiveAssistantId(assistantMessageId);
    void run(scenarioId);
  }

  function send(text: string) {
    if (isStreaming) {
      return;
    }
    setDraft("");
    beginAssistantStream(text, matchScenario(text));
  }

  function triggerScenario(scenarioId: ScenarioId) {
    if (isStreaming) {
      return;
    }
    const prompt = getScenario(scenarioId).prompt;
    beginAssistantStream(prompt, scenarioId);
  }

  function retryMessage(messageId: string) {
    if (isStreaming) {
      return;
    }
    const streamMeta = streamMetaByMessageId[messageId];
    if (!streamMeta) {
      return;
    }
    const message = conversation.messages.find((entry) => entry.id === messageId);
    if (!message) {
      return;
    }

    setConversation((current) => ({
      ...current,
      messages: current.messages.map((entry) =>
        entry.id === messageId
          ? {
              ...entry,
              content: "",
              citations: [],
            }
          : entry,
      ),
    }));
    setStreamErrors((current) => ({ ...current, [messageId]: undefined }));
    setActiveScenarioId(streamMeta.scenarioId);
    setActiveAssistantId(messageId);
    void run(streamMeta.scenarioId);
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 px-3 py-3 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-neutral-500">{conversation.course.code}</p>
            <h1 className="text-sm font-medium">{conversation.course.title}</h1>
          </div>
          <button
            type="button"
            onClick={() => setSavedOpen(true)}
            className="min-h-11 rounded-xl border border-neutral-300 px-3 text-sm text-neutral-700 transition-colors duration-150 ease-out hover:border-neutral-400"
          >
            Saved ({pinned.length})
          </button>
        </div>
      </header>

      {import.meta.env.DEV && (
        <div className="border-b border-neutral-200 px-3 py-2 md:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2">
            {getScenarioList().map((scenario) => (
              <button
                type="button"
                key={scenario.id}
                onClick={() => triggerScenario(scenario.id)}
                disabled={isStreaming}
                className={`min-h-11 rounded-lg border px-3 text-xs transition-colors duration-150 ease-out ${
                  activeScenarioId === scenario.id
                    ? "border-sky-500 text-sky-700"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {scenario.id}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col">
        {conversation.messages.length === 0 ? (
          <EmptyStateTopics
            topics={topics}
            onSelectTopic={(topic) => appendPrompt(`Can you explain ${topic}?`)}
          />
        ) : (
          <MessageList
            messages={conversation.messages}
            streamStateById={streamStates}
            errorById={streamErrors}
            pinnedIds={pinnedIds}
            onOpenCitation={openCitation}
            onTogglePin={togglePin}
            onRetry={retryMessage}
          />
        )}
      </main>

      <Composer
        disabled={isStreaming}
        isStreaming={isStreaming}
        value={draft}
        onChange={setDraft}
        onSend={send}
        onCancel={cancel}
      />

      {savedOpen && (
        <SavedView
          messages={pinned}
          onClose={() => setSavedOpen(false)}
          onOpenCitation={openCitation}
          onUnpin={(message) => {
            const updated = unpinMessage(message.id);
            setPinned(updated);
          }}
        />
      )}

      {activeSlide && (
        <SlideDetail
          lecture={activeSlide.lecture}
          slide={activeSlide.slide}
          onClose={() => setActiveSlide(null)}
        />
      )}
    </div>
  );
}
