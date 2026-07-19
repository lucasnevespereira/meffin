import Image from "next/image";
import Link from "next/link";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalShell({
  locale,
  title,
  updated,
  intro,
  sections,
  backLabel,
}: {
  locale: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  backLabel: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image src="/logo.png" alt="" width={28} height={28} />
          <span className="font-display text-base">Meffin</span>
        </Link>

        <h1 className="mt-8 font-display text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{updated}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-foreground/90">
          <p>{intro}</p>
          {sections.map((section, i) => (
            <section key={i} className="space-y-3">
              <h2 className="font-display text-xl text-foreground">{section.heading}</h2>
              {section.paragraphs?.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">
                  {section.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <Link
            href={`/${locale}`}
            className="text-sm text-primary transition-opacity hover:opacity-80"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
