import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docs } from "@/lib/legal";

const bySlug = Object.fromEntries(docs.map((doc) => [doc.slug, doc]));

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = bySlug[slug];
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.sections[0]?.paragraphs[0]?.slice(0, 160) ?? doc.title,
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = bySlug[slug];
  if (!doc) notFound();

  return (
    <article className="legal-doc">
      <h1 className="serif">{doc.title}</h1>
      <p className="legal-updated">Обновлено {doc.updated}</p>
      {doc.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="serif">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
