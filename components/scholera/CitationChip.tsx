import type { Citation } from "@/lib/scholera/types"

interface CitationChipProps {
  citation: Citation
  onClick: (citation: Citation) => void
}

export default function CitationChip({ citation, onClick }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(citation)}
      className="btn-3d rounded-full border border-border/50 bg-secondary/70 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {citation.lecture} · Slide {citation.slide}
    </button>
  )
}
