interface EmptyStateTopicsProps {
  topics: string[];
  onSelectTopic: (topic: string) => void;
}

export default function EmptyStateTopics({ topics, onSelectTopic }: EmptyStateTopicsProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-6 pt-6 md:px-6">
      <p className="mb-4 text-sm text-neutral-600">Pick a topic to draft your first question.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {topics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => onSelectTopic(topic)}
            className="min-h-11 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-left text-sm text-neutral-800 transition-colors duration-150 ease-out hover:border-neutral-400"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
