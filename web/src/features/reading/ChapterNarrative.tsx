import type { Chapter } from "@/types/reading";

export default function ChapterNarrative({
  chapter,
  headingLevel = 4,
}: {
  chapter: Chapter;
  headingLevel?: 3 | 4;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  if (!chapter.sections?.length) return <p>{chapter.body}</p>;
  return (
    <div className="chapter-narrative">
      {chapter.lead && <p className="narrative-lead">{chapter.lead}</p>}
      <div className="narrative-sections">
        {chapter.sections.map((section, index) => (
          <section
            className={`narrative-section narrative-${section.kind ?? "reading"}`}
            key={section.title}
          >
            <div className="narrative-section-heading">
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Heading>{section.title}</Heading>
            </div>
            {section.body.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
