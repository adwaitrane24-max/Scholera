import type { Lecture, Slide } from "../types";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface SlideDetailProps {
  lecture: Lecture;
  slide: Slide;
  onClose: () => void;
}

export default function SlideDetail({ lecture, slide, onClose }: SlideDetailProps) {
  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close slide detail"
        className="absolute inset-0 bg-black/20 md:bg-black/10"
        onClick={onClose}
      />
      <aside className="absolute inset-x-0 bottom-0 flex h-[92vh] flex-col rounded-t-2xl border border-neutral-300 bg-neutral-50 transition-transform duration-200 ease-out md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[420px] md:rounded-none md:border-l">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div>
            <p className="text-xs text-neutral-500">Week {lecture.week}</p>
            <h2 className="text-sm font-medium text-neutral-900">{slide.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-lg border border-neutral-300 text-neutral-700 transition-colors duration-150 ease-out hover:border-neutral-400"
          >
            Close
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto px-4 py-4 text-sm leading-7">
          {slide.bullets && slide.bullets.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Bullets</h3>
              <ul className="list-disc space-y-1 pl-5">
                {slide.bullets.map((bullet, index) => (
                  <li key={`${slide.slide_number}-bullet-${index}`}>{bullet}</li>
                ))}
              </ul>
            </section>
          )}

          {slide.formulas && slide.formulas.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Formulas</h3>
              <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
                {slide.formulas.map((formula, index) => (
                  <ReactMarkdown key={`${slide.slide_number}-formula-${index}`} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`$$${formula}$$`}
                  </ReactMarkdown>
                ))}
              </div>
            </section>
          )}

          {slide.figure?.description && (
            <section>
              <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Figure</h3>
              <p className="rounded-xl border border-neutral-200 bg-white p-3">{slide.figure.description}</p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Notes</h3>
            <p className="rounded-xl border border-neutral-200 bg-white p-3">{slide.notes}</p>
          </section>
        </div>
      </aside>
    </div>
  );
}
