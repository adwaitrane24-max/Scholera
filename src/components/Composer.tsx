interface ComposerProps {
  disabled?: boolean;
  isStreaming: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  onCancel: () => void;
}

export default function Composer({ disabled = false, isStreaming, value, onChange, onSend, onCancel }: ComposerProps) {
  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
  };

  return (
    <div className="border-t border-neutral-200 bg-neutral-50 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-neutral-300 bg-white p-2">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            rows={2}
            className="max-h-40 min-h-11 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 text-neutral-900 outline-none"
            placeholder="Ask about CS 4780 topics..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 min-w-11 rounded-xl border border-neutral-300 px-3 text-sm text-neutral-700 transition-colors duration-150 ease-out hover:border-neutral-400"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={handleSubmit}
              className="min-h-11 min-w-11 rounded-xl bg-sky-600 px-4 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
