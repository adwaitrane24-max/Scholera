import type { Citation } from "../types";

interface CitationChipProps {
  citation: Citation;
  onClick: (citation: Citation) => void;
}

export default function CitationChip({ citation, onClick }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      className="min-h-11 rounded-full border border-neutral-300 px-3 text-xs text-neutral-700 transition-colors duration-150 ease-out hover:border-sky-500 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 break-words"
    >
      {citation.lecture} · Slide {citation.slide}
    </button>
  );
}
