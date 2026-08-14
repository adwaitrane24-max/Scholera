"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveCitation } from "@/lib/scholera/lectureIndex"
import SlidePreview from "./SlidePreview"
import type { Citation } from "@/lib/scholera/types"

interface CitationModalProps {
  citation: Citation | null
  onClose: () => void
}

export default function CitationModal({ citation, onClose }: CitationModalProps) {
  const resolved = citation ? resolveCitation(citation) : null
  const lecture = resolved?.lecture ?? null
  const slides = lecture?.slides ?? []

  const [slideNumber, setSlideNumber] = useState<number | null>(null)

  // Jump to the cited slide every time a citation chip is (re)opened
  useEffect(() => {
    if (citation) {
      setSlideNumber(resolveCitation(citation)?.slide.slide_number ?? null)
    }
  }, [citation])

  const currentIndex = slideNumber !== null ? slides.findIndex((s) => s.slide_number === slideNumber) : -1
  const currentSlide = currentIndex >= 0 ? slides[currentIndex] : null

  const goPrev = () => {
    if (currentIndex > 0) setSlideNumber(slides[currentIndex - 1].slide_number)
  }
  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < slides.length - 1) setSlideNumber(slides[currentIndex + 1].slide_number)
  }

  // Close on ESC key
  useEffect(() => {
    if (!citation) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [citation, onClose])

  if (!citation) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Slide preview"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:p-8"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col items-center gap-4 animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {currentSlide && lecture ? (
          <>
            {/* Slide box with prev/next navigation */}
            <div className="relative w-full">
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goPrev}
                  aria-label="Previous slide"
                  className="btn-3d absolute! left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              <SlidePreview lecture={lecture} slide={currentSlide} />

              {currentIndex >= 0 && currentIndex < slides.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goNext}
                  aria-label="Next slide"
                  className="btn-3d absolute! right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Speaker notes — outside the slide box, clearly not part of the slide itself */}
            {currentSlide.notes && (
              <div className="w-full rounded-xl border border-border/50 bg-secondary/60 px-4 py-3 backdrop-blur-xl sm:px-5">
                <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Speaker notes</p>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{currentSlide.notes}</p>
              </div>
            )}
          </>
        ) : (
          <div className="input-3d rounded-2xl border border-border/50 bg-secondary/70 p-5 text-sm text-muted-foreground">
            Slide content not available for this citation.
          </div>
        )}
      </div>

      {/* Close — last child so it always paints above the content above, no z-index gymnastics needed */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Close"
        className="btn-3d fixed! right-4 top-4 h-9 w-9 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white sm:right-6 sm:top-6"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
