import lecture01 from "../data/lectures/lecture-01-linear-models.json";
import lecture02 from "../data/lectures/lecture-02-gradient-descent.json";
import lecture03 from "../data/lectures/lecture-03-regularization.json";
import type { Citation, Lecture, Slide } from "./types";

const lectures: Lecture[] = [lecture01, lecture02, lecture03];

function toDisplayName(lecture: Lecture): string {
  return `Week ${lecture.week} — ${lecture.title}`;
}

const lectureLookup = new Map<string, Lecture>(lectures.map((lecture) => [toDisplayName(lecture), lecture]));

export function resolveCitation(citation: Citation): { lecture: Lecture; slide: Slide } | null {
  const lecture = lectureLookup.get(citation.lecture);
  if (!lecture) {
    return null;
  }

  const slide = lecture.slides.find((entry) => entry.slide_number === citation.slide);
  if (!slide) {
    return null;
  }

  return { lecture, slide };
}

export function getAllTopics(): string[] {
  return lectures.flatMap((lecture) =>
    lecture.slides
      .filter((slide) => slide.slide_number !== 1)
      .map((slide) => slide.title),
  );
}
