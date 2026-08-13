import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import CitationChip from "./CitationChip";
import type { Citation, Message } from "../types";
import type { StreamStatus } from "../useMockStream";

interface MessageListProps {
  messages: Message[];
  streamStateById: Record<string, StreamStatus>;
  errorById: Record<string, string | undefined>;
  pinnedIds: Set<string>;
  onOpenCitation: (citation: Citation) => void;
  onTogglePin: (message: Message) => void;
  onRetry: (messageId: string) => void;
}

function statusLabel(status: StreamStatus | undefined): string | null {
  if (!status) {
    return null;
  }
  if (status === "slow-start") {
    return "Thinking...";
  }
  if (status === "idle") {
    return "Queued...";
  }
  if (status === "streaming") {
    return "Streaming...";
  }
  if (status === "cancelled") {
    return "Stopped";
  }
  if (status === "error") {
    return "Interrupted";
  }
  return null;
}

export default function MessageList({
  messages,
  streamStateById,
  errorById,
  pinnedIds,
  onOpenCitation,
  onTogglePin,
  onRetry,
}: MessageListProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-4 md:px-6">
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        const hasCitations = Boolean(message.citations && message.citations.length > 0);
        const status = streamStateById[message.id];
        const label = statusLabel(status);
        const isPinned = pinnedIds.has(message.id);
        return (
          <article
            key={message.id}
            className={`rounded-2xl border p-3 ${isAssistant ? "border-neutral-200 bg-white" : "border-neutral-300 bg-neutral-100"}`}
          >
            <div className="mx-auto w-full max-w-[75ch] break-words">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                  {isAssistant ? "Tutor" : "You"}
                </span>
                {isAssistant && hasCitations && (
                  <button
                    type="button"
                    onClick={() => onTogglePin(message)}
                    aria-label={isPinned ? "Unpin message" : "Pin message"}
                    className={`min-h-11 min-w-11 rounded-xl border transition-colors duration-150 ease-out ${
                      isPinned
                        ? "border-sky-500 text-sky-600"
                        : "border-neutral-300 text-neutral-500 hover:border-neutral-400"
                    }`}
                  >
                    <span aria-hidden>📌</span>
                  </button>
                )}
              </div>

              {isAssistant ? (
                <ReactMarkdown
                  className="w-full max-w-[75ch] break-words whitespace-pre-wrap text-sm leading-7"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => <p className="my-2 break-words">{children}</p>,
                    pre: ({ children }) => (
                      <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-100 p-3">{children}</pre>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-neutral-100 px-1 py-0.5 text-[0.9em]">{children}</code>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-neutral-300 text-left text-xs">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => <th className="border border-neutral-300 px-2 py-1 font-medium">{children}</th>,
                    td: ({ children }) => <td className="border border-neutral-300 px-2 py-1">{children}</td>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-neutral-900">{message.content}</p>
              )}

              {label && <p className="mt-2 text-xs text-neutral-500">{label}</p>}
              {status === "error" && (
                <div className="mt-2 flex items-center gap-2 text-xs text-rose-700">
                  <span>{errorById[message.id] ?? "Response interrupted."}</span>
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-rose-300 px-3 text-rose-700 transition-colors duration-150 ease-out hover:border-rose-400"
                    onClick={() => onRetry(message.id)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {hasCitations && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.citations!.map((citation, index) => (
                    <CitationChip
                      key={`${message.id}-${citation.lecture}-${citation.slide}-${index}`}
                      citation={citation}
                      onClick={onOpenCitation}
                    />
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
