import type { Citation, Lecture, Slide } from "./types";

import lecture01 from "../data/lectures/lecture-01-linear-models.json";
import lecture02 from "../data/lectures/lecture-02-gradient-descent.json";
import lecture03 from "../data/lectures/lecture-03-regularization.json";

const LECTURES = [lecture01, lecture02, lecture03] as unknown as Lecture[];

/**
 * IMPORTANT: citations in conversation.json / responses.json reference lectures
 * by a display string — "Week {n} — {title}" — NOT by lecture_id ("lec_02").
 * Example citation.lecture: "Week 2 — Gradient Descent and Backpropagation"
 * Example lecture file:     { week: 2, title: "Gradient Descent and Backpropagation" }
 *
 * This builds that exact display string from each lecture file so we can match
 * citations against it reliably, instead of string-matching lecture_id.
 */
function displayName(lecture: Lecture): string {
  return `Week ${lecture.week} — ${lecture.title}`;
}

// displayName -> Lecture, for O(1) citation resolution
const lectureByDisplayName = new Map<string, Lecture>(
  LECTURES.map((lec) => [displayName(lec), lec])
);

export function getAllLectures(): Lecture[] {
  return LECTURES;
}

/** Resolve a citation to its actual slide. Returns null if not found (shouldn't happen with real data, but don't crash if it does). */
export function resolveCitation(citation: Citation): { lecture: Lecture; slide: Slide } | null {
  const lecture = lectureByDisplayName.get(citation.lecture);
  if (!lecture) return null;
  const slide = lecture.slides.find((s) => s.slide_number === citation.slide);
  if (!slide) return null;
  return { lecture, slide };
}

/** All slide titles across all lectures, for the empty-state topic browser. */
export function getAllTopics(): { lectureDisplayName: string; slideTitle: string; slideNumber: number }[] {
  return LECTURES.flatMap((lec) =>
    lec.slides
      // skip pure title-card slides (no bullets, no formulas, no figure — just week/name)
      .filter((s) => s.bullets?.length || s.formulas?.length || s.figure)
      .map((s) => ({
        lectureDisplayName: displayName(lec),
        slideTitle: s.title,
        slideNumber: s.slide_number,
      }))
  );
}
