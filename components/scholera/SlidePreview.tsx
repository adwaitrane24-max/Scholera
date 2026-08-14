"use client"

import { ImageIcon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"
import { toDisplayName } from "@/lib/scholera/lectureIndex"
import type { Lecture, Slide } from "@/lib/scholera/types"

interface SlidePreviewProps {
  lecture: Lecture
  slide: Slide
}

export default function SlidePreview({ lecture, slide }: SlidePreviewProps) {
  const totalSlides = lecture.slides.length

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-black/10 bg-[#fbfaf7] text-[#1c1c1c] shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
      <div className="flex h-full flex-col p-5 sm:p-8 md:p-10">
        {/* Slide branding — deck label + slide number */}
        <div className="mb-3 flex items-start justify-between gap-4 text-[9px] uppercase tracking-[0.14em] text-black/40 sm:text-[11px]">
          <span className="truncate">{toDisplayName(lecture)}</span>
          <span className="shrink-0">
            Slide {slide.slide_number} / {totalSlides}
          </span>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-lg font-bold leading-tight text-black font-[var(--font-heading)] sm:mb-4 sm:text-2xl md:text-3xl">
          {slide.title}
        </h2>

        {/* Body — scrolls internally if a slide is content-heavy, so the 16:9 shape never stretches */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto custom-scrollbar sm:space-y-5">
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-2 sm:space-y-3">
              {slide.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-black/80 sm:gap-3 sm:text-base">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black/50 sm:mt-2" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {slide.formulas && slide.formulas.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              {slide.formulas.map((formula, i) => (
                <div
                  key={i}
                  className="overflow-x-auto rounded-md bg-black/[0.04] px-3 py-2.5 text-center sm:px-4 sm:py-3"
                >
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`$$\n${formula}\n$$`}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          )}

          {slide.figure && (
            <div className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-black/15 bg-black/[0.03] px-5 py-6 text-center sm:min-h-[140px] sm:px-6 sm:py-8">
              <ImageIcon className="h-5 w-5 text-black/30 sm:h-6 sm:w-6" />
              <p className="max-w-md text-[11px] italic leading-relaxed text-black/50 sm:text-sm">
                {slide.figure.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
