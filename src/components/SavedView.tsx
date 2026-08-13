import CitationChip from "./CitationChip";
import type { Citation, Message } from "../types";

interface SavedViewProps {
  messages: Message[];
  onClose: () => void;
  onOpenCitation: (citation: Citation) => void;
  onUnpin: (message: Message) => void;
}

export default function SavedView({ messages, onClose, onOpenCitation, onUnpin }: SavedViewProps) {
  return (
    <div className="fixed inset-0 z-30">
      <button
        type="button"
        className="absolute inset-0 bg-black/20 md:bg-black/10"
        onClick={onClose}
        aria-label="Close saved view"
      />
      <section className="absolute inset-x-0 bottom-0 flex h-[92vh] flex-col rounded-t-2xl border border-neutral-300 bg-neutral-50 transition-transform duration-200 ease-out md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[420px] md:rounded-none md:border-l">
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-medium text-neutral-900">Saved answers</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-lg border border-neutral-300 text-neutral-700 transition-colors duration-150 ease-out hover:border-neutral-400"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && <p className="text-sm text-neutral-600">No pinned answers yet.</p>}
          {messages.map((message) => (
            <article key={message.id} className="rounded-xl border border-neutral-200 bg-white p-3">
              <p className="mb-2 whitespace-pre-wrap text-sm leading-7 text-neutral-900">{message.content}</p>
              {message.citations && message.citations.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {message.citations.map((citation, index) => (
                    <CitationChip
                      key={`${message.id}-saved-${citation.lecture}-${citation.slide}-${index}`}
                      citation={citation}
                      onClick={onOpenCitation}
                    />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => onUnpin(message)}
                className="min-h-11 rounded-lg border border-neutral-300 px-3 text-xs text-neutral-700 transition-colors duration-150 ease-out hover:border-neutral-400"
              >
                Unpin
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
