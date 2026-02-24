"use client";

import type { Config } from "@puckeditor/core";
import Image from "next/image";
import { CheckCircle, Euro, Info, ChevronRight, Users, Calendar } from "lucide-react";

export const puckConfig: Config = {
  categories: {
    hero: {
      title: "Hero & CTA",
      components: ["HeroBlock"],
      defaultExpanded: true,
    },
    content: {
      title: "Inhalte",
      components: ["PhilosophieCard", "TextSection"],
      defaultExpanded: true,
    },
    leistungen: {
      title: "Leistungen",
      components: ["LeistungenBlock"],
      defaultExpanded: true,
    },
    contact: {
      title: "Kontakt & Footer",
      components: ["ContactBlock", "TrauerfallCard"],
      defaultExpanded: true,
    },
    layout: {
      title: "Layout & Zusatz",
      components: ["ImageBlock", "QuoteBlock", "SpacerBlock", "CTACard", "FAQBlock", "TeamTeaser", "TermineTeaser"],
      defaultExpanded: true,
    },
  },
  components: {
    HeroBlock: {
      label: "Hero",
      fields: {
        title: { type: "text", label: "Titel" },
        subtitle: { type: "textarea", label: "Untertitel" },
        ctaPrimary: { type: "text", label: "Button 1 Text" },
        ctaSecondary: { type: "text", label: "Button 2 Text" },
      },
      defaultProps: {
        title: "liebevoll bestatten.",
        subtitle:
          "Wir begleiten Sie in schweren Zeiten mit Wärme, Empathie und einem Fokus auf das, was wirklich zählt: Ein würdevoller, liebevoller Abschied.",
        ctaPrimary: "Lassen Sie uns reden",
        ctaSecondary: "Vorsorge digital planen",
      },
      render: ({ title, subtitle, ctaPrimary, ctaSecondary }) => (
        <section className="relative min-h-[80vh] bg-stone-50 flex items-center justify-center py-24 sm:py-32 lg:pb-40 text-center px-4 overflow-hidden">
          <div className="absolute top-10 left-10 opacity-30 pointer-events-none">
            <Image src="/assets/sunflower.svg" alt="" width={128} height={128} className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-sm" />
          </div>
          <div className="absolute bottom-20 right-10 opacity-30 pointer-events-none">
            <Image src="/assets/lavender.svg" alt="" width={128} height={128} className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-sm" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-emerald-800 tracking-tight">
              {title}
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 max-w-xl mx-auto leading-relaxed">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#kontakt" className="px-8 py-4 bg-rose-200 text-stone-800 rounded-full font-medium hover:bg-rose-300 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                {ctaPrimary}
              </a>
              <a href="#vorsorge" className="px-8 py-4 bg-white text-emerald-800 rounded-full font-medium hover:bg-stone-100 border border-stone-200 transition flex items-center justify-center gap-2 shadow-sm">
                {ctaSecondary}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    PhilosophieCard: {
      label: "Philosophie-Karte",
      fields: {
        icon: {
          type: "radio",
          label: "Icon",
          options: [
            { label: "Herz", value: "heart" },
            { label: "Schild", value: "shield" },
            { label: "Menschen", value: "users" },
          ],
        },
        title: { type: "text", label: "Titel" },
        text: { type: "textarea", label: "Text" },
      },
      defaultProps: {
        icon: "heart",
        title: "Wir sind einfühlsam.",
        text: "Wir nehmen uns Zeit. Gemeinsam gestalten wir individuelle Abschiede.",
      },
      render: ({ icon, title, text }) => {
        const IconComp =
          icon === "shield"
            ? () => <span className="text-emerald-600 w-12 h-12 mb-6 block">🛡</span>
            : icon === "users"
              ? () => <span className="text-emerald-600 w-12 h-12 mb-6 block">👥</span>
              : () => <span className="text-emerald-600 w-12 h-12 mb-6 block">❤️</span>;
        return (
          <div className="bg-stone-50 p-10 rounded-4xl border border-stone-100 hover:border-rose-200 transition shadow-sm">
            <IconComp />
            <h4 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h4>
            <p className="text-stone-600 leading-relaxed">{text}</p>
          </div>
        );
      },
    },
    TextSection: {
      label: "Textabschnitt",
      fields: {
        title: { type: "text", label: "Titel" },
        body: { type: "textarea", label: "Inhalt" },
      },
      defaultProps: {
        title: "Abschnitt",
        body: "Inhalt hier eingeben.",
      },
      render: ({ title, body }) => (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h3>
            <p className="text-stone-600 whitespace-pre-wrap">{body}</p>
          </div>
        </section>
      ),
    },
    ContactBlock: {
      label: "Kontakt",
      fields: {
        heading: { type: "text", label: "Überschrift" },
        phone: { type: "text", label: "Telefon" },
        email: { type: "text", label: "E-Mail" },
      },
      defaultProps: {
        heading: "Wir sind für Sie da.",
        phone: "0228 620 58 15",
        email: "info@minten-walter.de",
      },
      render: ({ heading, phone, email }) => (
        <section
          id="kontakt"
          className="relative bg-stone-200/80 py-20 px-4 overflow-hidden"
        >
          <div className="relative z-10 max-w-7xl mx-auto">
            <h4 className="text-3xl font-serif mb-8 text-emerald-800">
              {heading}
            </h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-stone-700 bg-white/60 backdrop-blur-sm p-4 rounded-2xl">
                <span className="text-xl font-medium">{phone}</span>
              </div>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 text-stone-700 p-4 text-lg font-medium hover:text-emerald-700"
              >
                {email}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    LeistungenBlock: {
      label: "Leistungen / Vorsorge",
      fields: {
        title: { type: "text", label: "Titel" },
        subtitle: { type: "textarea", label: "Untertitel" },
        bulletPoints: {
          type: "textarea",
          label: "Aufzählungspunkte (ein Punkt pro Zeile)",
        },
        ctaText: { type: "text", label: "Button-Text (Konfigurator)" },
        trauerfallLinkText: { type: "text", label: "Trauerfall-Link Text" },
        beratungLinkText: { type: "text", label: "Beratung-Link Text" },
      },
      defaultProps: {
        title: "Selbstbestimmt bis zum Schluss. Unsere Vorsorge.",
        subtitle:
          "Nehmen Sie Ihren Liebsten die schwersten Entscheidungen ab. Mit einer Bestattungsvorsorge legen Sie zu Lebzeiten fest, wie Ihr Abschied gestaltet werden soll.",
        bulletPoints:
          "Sicherheit und Entlastung für Angehörige.\nGarantiert Ihre persönlichen Wünsche.\nVolle finanzielle Absicherung möglich.",
        ctaText: "Jetzt Wünsche konfigurieren",
        trauerfallLinkText: "Sofort anfragen",
        beratungLinkText: "Anfragen",
      },
      render: ({
        title,
        subtitle,
        bulletPoints,
        ctaText,
        trauerfallLinkText,
        beratungLinkText,
      }) => {
        const points = (bulletPoints ?? "")
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean);
        return (
          <section
            id="vorsorge"
            className="relative py-24 bg-stone-100 px-4 overflow-hidden"
          >
            <div className="absolute top-8 right-16 opacity-20 pointer-events-none hidden md:block">
              <Image
                src="/assets/eucalyptus.svg"
                alt=""
                width={56}
                height={56}
                className="w-14 h-14"
              />
            </div>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
              <div className="md:w-1/2">
                <h3 className="text-3xl sm:text-4xl font-serif text-emerald-800 mb-6 leading-tight">
                  {title}
                </h3>
                <p className="text-stone-600 mb-6 text-lg leading-relaxed">
                  {subtitle}
                </p>
                <ul className="space-y-4 mb-8">
                  {points.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle
                        className="text-emerald-600 mt-1 shrink-0"
                        size={20}
                      />
                      <span className="text-stone-700">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2 w-full bg-white p-8 sm:p-12 rounded-4xl shadow-xl border border-stone-100 text-center">
                <Euro
                  className="text-emerald-600 w-16 h-16 mx-auto mb-6 opacity-80"
                />
                <h4 className="text-2xl font-serif text-emerald-800 mb-4">
                  Transparente Kostenplanung
                </h4>
                <p className="text-stone-600 mb-8">
                  Nutzen Sie unseren digitalen Konfigurator, um in 3 einfachen
                  Schritten Ihre Wünsche zusammenzustellen und eine sofortige
                  Kostenschätzung zu erhalten.
                </p>
                <a
                  href="#vorsorge"
                  className="bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-emerald-800 transition w-full shadow-md block"
                >
                  {ctaText}
                </a>
                <p className="mt-6 text-sm text-stone-500">
                  Trauerfall?{" "}
                  <a
                    href="#trauerfall"
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    {trauerfallLinkText}
                  </a>{" "}
                  · Beratung gewünscht?{" "}
                  <a
                    href="#beratung"
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    {beratungLinkText}
                  </a>
                </p>
              </div>
            </div>
          </section>
        );
      },
    },
    TrauerfallCard: {
      label: "Im Trauerfall - Karte",
      fields: {
        title: { type: "text", label: "Titel" },
        body: { type: "textarea", label: "Inhalt" },
        ctaText: { type: "text", label: "Button-Text" },
      },
      defaultProps: {
        title: "Im Trauerfall - Was tun?",
        body:
          "Sie haben Zeit. Sie dürfen den verstorbenen Menschen bis zu 36h zu Hause behalten. Rufen Sie den Arzt (Totenschein) und im Anschluss uns an.",
        ctaText: "Jetzt anrufen",
      },
      render: ({ title, body, ctaText }) => (
        <section className="relative bg-stone-200/80 py-20 px-4 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto flex justify-center">
            <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-10 text-center shadow-lg border border-stone-200/80 flex flex-col justify-center max-w-md">
              <Info size={48} className="mx-auto mb-6 text-emerald-500" />
              <h5 className="text-2xl font-serif mb-4 text-emerald-800">
                {title}
              </h5>
              <p className="text-stone-600 mb-8 leading-relaxed">{body}</p>
              <a
                href="tel:02286205815"
                className="inline-block bg-rose-200 text-stone-800 px-8 py-3.5 rounded-full font-medium hover:bg-rose-300 transition mx-auto shadow-md"
              >
                {ctaText}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    ImageBlock: {
      label: "Bild",
      fields: {
        imageSrc: { type: "text", label: "Bild-URL (z.B. /assets/...) oder externe URL" },
        alt: { type: "text", label: "Alt-Text (für Barrierefreiheit)" },
        caption: { type: "text", label: "Bildunterschrift (optional)" },
      },
      defaultProps: {
        imageSrc: "/assets/MintenWalter_Bestattungen_Team_01-4ef7a073.jpg",
        alt: "Team",
        caption: "",
      },
      render: ({ imageSrc, alt, caption }) => (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-stone-200">
              <Image
                src={imageSrc || "/assets/MintenWalter_Bestattungen_Team_01-4ef7a073.jpg"}
                alt={alt || ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
            {caption && (
              <p className="mt-3 text-center text-sm text-stone-500">{caption}</p>
            )}
          </div>
        </section>
      ),
    },
    QuoteBlock: {
      label: "Zitat",
      fields: {
        quote: { type: "textarea", label: "Zitat" },
        author: { type: "text", label: "Autor (optional)" },
      },
      defaultProps: {
        quote: "Ein würdevoller Abschied ist das letzte Geschenk, das wir unseren Liebsten geben können.",
        author: "",
      },
      render: ({ quote, author }) => (
        <section className="py-16 px-4 bg-stone-100">
          <blockquote className="max-w-3xl mx-auto text-center">
            <p className="text-2xl sm:text-3xl font-serif text-emerald-800 italic leading-relaxed">
              „{quote}“
            </p>
            {author && (
              <footer className="mt-4 text-stone-600">— {author}</footer>
            )}
          </blockquote>
        </section>
      ),
    },
    SpacerBlock: {
      label: "Abstand",
      fields: {
        size: {
          type: "radio",
          label: "Höhe",
          options: [
            { label: "Klein (2rem)", value: "small" },
            { label: "Mittel (4rem)", value: "medium" },
            { label: "Groß (6rem)", value: "large" },
          ],
        },
      },
      defaultProps: { size: "medium" },
      render: ({ size }) => {
        const h = size === "small" ? "h-8" : size === "large" ? "h-24" : "h-16";
        return <div className={h} aria-hidden />;
      },
    },
    CTACard: {
      label: "CTA-Karte",
      fields: {
        title: { type: "text", label: "Titel" },
        text: { type: "textarea", label: "Text" },
        buttonText: { type: "text", label: "Button-Text" },
        linkUrl: { type: "text", label: "Link (z.B. #kontakt, /team, tel:02286205815)" },
      },
      defaultProps: {
        title: "Sprechen Sie mit uns",
        text: "Wir nehmen uns Zeit für Ihre Fragen und Wünsche.",
        buttonText: "Jetzt anrufen",
        linkUrl: "tel:02286205815",
      },
      render: ({ title, text, buttonText, linkUrl }) => (
        <section className="py-12 px-4">
          <div className="max-w-md mx-auto bg-white rounded-4xl p-8 shadow-lg border border-stone-200 text-center">
            <h4 className="text-xl font-serif text-emerald-800 mb-3">{title}</h4>
            <p className="text-stone-600 mb-6">{text}</p>
            <a
              href={linkUrl || "#"}
              className="inline-block bg-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-800 transition"
            >
              {buttonText}
            </a>
          </div>
        </section>
      ),
    },
    FAQBlock: {
      label: "FAQ",
      fields: {
        title: { type: "text", label: "Überschrift" },
        items: {
          type: "array",
          label: "Fragen & Antworten",
          arrayFields: {
            question: { type: "text", label: "Frage" },
            answer: { type: "textarea", label: "Antwort" },
          },
          getItemSummary: (item: { question?: string }) =>
            item?.question || "Neue Frage",
        },
      },
      defaultProps: {
        title: "Häufige Fragen",
        items: [
          { question: "Was kostet eine Bestattung?", answer: "Die Kosten variieren je nach Wünschen. Wir beraten Sie gerne unverbindlich." },
          { question: "Kann ich zu Hause Abschied nehmen?", answer: "Ja, Sie dürfen den Verstorbenen bis zu 36 Stunden zu Hause behalten." },
        ],
      },
      render: ({ title, items }) => (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-serif text-emerald-800 mb-8">{title}</h3>
            <div className="space-y-2">
              {(items ?? []).map((item: { question?: string; answer?: string }, i: number) => (
                <details
                  key={i}
                  className="group border border-stone-200 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none font-medium text-stone-800 hover:bg-stone-50 [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="w-4 h-4 shrink-0 group-open:rotate-90 transition" />
                    {item?.question || "Frage"}
                  </summary>
                  <div className="px-4 pb-4 pt-0 pl-10 text-stone-600 whitespace-pre-wrap">
                    {item?.answer || ""}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ),
    },
    TeamTeaser: {
      label: "Team-Teaser",
      fields: {
        title: { type: "text", label: "Titel" },
        intro: { type: "textarea", label: "Kurzer Text" },
        buttonText: { type: "text", label: "Button-Text" },
      },
      defaultProps: {
        title: "Unser Team",
        intro: "Lernen Sie die Menschen kennen, die Sie in schweren Zeiten begleiten.",
        buttonText: "Team ansehen",
      },
      render: ({ title, intro, buttonText }) => (
        <section className="py-12 px-4 bg-stone-50">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h3>
            <p className="text-stone-600 mb-6">{intro}</p>
            <a
              href="/team"
              className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-800 transition"
            >
              <Users size={18} />
              {buttonText}
            </a>
          </div>
        </section>
      ),
    },
    TermineTeaser: {
      label: "Termine-Teaser",
      fields: {
        title: { type: "text", label: "Titel" },
        intro: { type: "textarea", label: "Kurzer Text" },
        buttonText: { type: "text", label: "Button-Text" },
      },
      defaultProps: {
        title: "Termine & Veranstaltungen",
        intro: "Wir laden Sie herzlich zu unseren Veranstaltungen ein.",
        buttonText: "Termine ansehen",
      },
      render: ({ title, intro, buttonText }) => (
        <section className="py-12 px-4 bg-stone-50">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h3>
            <p className="text-stone-600 mb-6">{intro}</p>
            <a
              href="/termine"
              className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-800 transition"
            >
              <Calendar size={18} />
              {buttonText}
            </a>
          </div>
        </section>
      ),
    },
  },
  root: {
    fields: {
      title: { type: "text", label: "Seitentitel" },
    },
    defaultProps: {
      title: "Startseite",
    },
    render: ({ children }: { children?: React.ReactNode }) => (
      <div className="pt-20 bg-stone-50 min-h-screen">
        {children}
      </div>
    ),
  },
};

/** Termine-Seite: Header + wiederverwendbare Inhalts-Blöcke */
export const puckConfigTermine: Config = {
  categories: {
    header: {
      title: "Header",
      components: ["TermineHeaderBlock"],
      defaultExpanded: true,
    },
    blocks: {
      title: "Inhalte & Kontakt",
      components: ["PhilosophieCard", "TextSection", "ContactBlock", "TrauerfallCard"],
      defaultExpanded: true,
    },
    layout: {
      title: "Layout & Zusatz",
      components: ["ImageBlock", "QuoteBlock", "SpacerBlock", "CTACard", "FAQBlock", "TeamTeaser"],
      defaultExpanded: true,
    },
  },
  components: {
    TermineHeaderBlock: {
      label: "Termine-Header",
      fields: {
        title: { type: "text", label: "Titel" },
        intro: { type: "textarea", label: "Intro-Text" },
      },
      defaultProps: {
        title: "Termine & Veranstaltungen",
        intro:
          "Wir laden Sie herzlich zu unseren Veranstaltungen ein. Hier finden Sie die nächsten Termine.",
      },
      render: ({ title, intro }) => (
        <section className="px-4 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-serif text-emerald-800 mb-6">
              {title}
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed">{intro}</p>
          </div>
        </section>
      ),
    },
    PhilosophieCard: {
      label: "Philosophie-Karte",
      fields: {
        icon: {
          type: "radio",
          label: "Icon",
          options: [
            { label: "Herz", value: "heart" },
            { label: "Schild", value: "shield" },
            { label: "Menschen", value: "users" },
          ],
        },
        title: { type: "text", label: "Titel" },
        text: { type: "textarea", label: "Text" },
      },
      defaultProps: {
        icon: "heart",
        title: "Wir sind einfühlsam.",
        text: "Wir nehmen uns Zeit. Gemeinsam gestalten wir individuelle Abschiede.",
      },
      render: ({ icon, title, text }) => {
        const IconComp =
          icon === "shield"
            ? () => <span className="text-emerald-600 w-12 h-12 mb-6 block">🛡</span>
            : icon === "users"
              ? () => <span className="text-emerald-600 w-12 h-12 mb-6 block">👥</span>
              : () => <span className="text-emerald-600 w-12 h-12 mb-6 block">❤️</span>;
        return (
          <div className="bg-stone-50 p-10 rounded-4xl border border-stone-100 hover:border-rose-200 transition shadow-sm">
            <IconComp />
            <h4 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h4>
            <p className="text-stone-600 leading-relaxed">{text}</p>
          </div>
        );
      },
    },
    TextSection: {
      label: "Textabschnitt",
      fields: {
        title: { type: "text", label: "Titel" },
        body: { type: "textarea", label: "Inhalt" },
      },
      defaultProps: {
        title: "Abschnitt",
        body: "Inhalt hier eingeben.",
      },
      render: ({ title, body }) => (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h3>
            <p className="text-stone-600 whitespace-pre-wrap">{body}</p>
          </div>
        </section>
      ),
    },
    ContactBlock: {
      label: "Kontakt",
      fields: {
        heading: { type: "text", label: "Überschrift" },
        phone: { type: "text", label: "Telefon" },
        email: { type: "text", label: "E-Mail" },
      },
      defaultProps: {
        heading: "Wir sind für Sie da.",
        phone: "0228 620 58 15",
        email: "info@minten-walter.de",
      },
      render: ({ heading, phone, email }) => (
        <section
          id="kontakt"
          className="relative bg-stone-200/80 py-20 px-4 overflow-hidden"
        >
          <div className="relative z-10 max-w-7xl mx-auto">
            <h4 className="text-3xl font-serif mb-8 text-emerald-800">
              {heading}
            </h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-stone-700 bg-white/60 backdrop-blur-sm p-4 rounded-2xl">
                <span className="text-xl font-medium">{phone}</span>
              </div>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 text-stone-700 p-4 text-lg font-medium hover:text-emerald-700"
              >
                {email}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    TrauerfallCard: {
      label: "Im Trauerfall - Karte",
      fields: {
        title: { type: "text", label: "Titel" },
        body: { type: "textarea", label: "Inhalt" },
        ctaText: { type: "text", label: "Button-Text" },
      },
      defaultProps: {
        title: "Im Trauerfall - Was tun?",
        body:
          "Sie haben Zeit. Sie dürfen den verstorbenen Menschen bis zu 36h zu Hause behalten. Rufen Sie den Arzt (Totenschein) und im Anschluss uns an.",
        ctaText: "Jetzt anrufen",
      },
      render: ({ title, body, ctaText }) => (
        <section className="relative bg-stone-200/80 py-20 px-4 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto flex justify-center">
            <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-10 text-center shadow-lg border border-stone-200/80 flex flex-col justify-center max-w-md">
              <Info size={48} className="mx-auto mb-6 text-emerald-500" />
              <h5 className="text-2xl font-serif mb-4 text-emerald-800">
                {title}
              </h5>
              <p className="text-stone-600 mb-8 leading-relaxed">{body}</p>
              <a
                href="tel:02286205815"
                className="inline-block bg-rose-200 text-stone-800 px-8 py-3.5 rounded-full font-medium hover:bg-rose-300 transition mx-auto shadow-md"
              >
                {ctaText}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    ImageBlock: puckConfig.components.ImageBlock,
    QuoteBlock: puckConfig.components.QuoteBlock,
    SpacerBlock: puckConfig.components.SpacerBlock,
    CTACard: puckConfig.components.CTACard,
    FAQBlock: puckConfig.components.FAQBlock,
    TeamTeaser: puckConfig.components.TeamTeaser,
  },
  root: {
    fields: {
      title: { type: "text", label: "Seitentitel" },
    },
    defaultProps: {
      title: "Termine",
    },
    render: ({ children }: { children?: React.ReactNode }) => (
      <div className="pt-20 bg-stone-50 min-h-screen">
        {children}
      </div>
    ),
  },
};

/** Team-Seite: Header + Inhalts-Blöcke (Team-Mitglieder bleiben fest im Code) */
export const puckConfigTeam: Config = {
  categories: {
    header: {
      title: "Header",
      components: ["TeamHeaderBlock"],
      defaultExpanded: true,
    },
    blocks: {
      title: "Inhalte & Kontakt",
      components: ["TextSection", "PhilosophieCard", "ContactBlock", "TrauerfallCard"],
      defaultExpanded: true,
    },
    layout: {
      title: "Layout & Zusatz",
      components: ["ImageBlock", "QuoteBlock", "SpacerBlock", "CTACard", "FAQBlock", "TermineTeaser"],
      defaultExpanded: true,
    },
  },
  components: {
    TeamHeaderBlock: {
      label: "Team-Header",
      fields: {
        title: { type: "text", label: "Titel" },
        intro: { type: "textarea", label: "Intro-Text" },
      },
      defaultProps: {
        title: "Unser Team",
        intro:
          "Lernen Sie die Menschen kennen, die Sie bei minten & walter bestattungen in schweren Zeiten begleiten.",
      },
      render: ({ title, intro }) => (
        <section className="px-4 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-emerald-800 tracking-tight mb-6">
              {title}
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed">{intro}</p>
          </div>
        </section>
      ),
    },
    TextSection: {
      label: "Textabschnitt",
      fields: {
        title: { type: "text", label: "Titel" },
        body: { type: "textarea", label: "Inhalt" },
      },
      defaultProps: {
        title: "Abschnitt",
        body: "Inhalt hier eingeben.",
      },
      render: ({ title, body }) => (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h3>
            <p className="text-stone-600 whitespace-pre-wrap">{body}</p>
          </div>
        </section>
      ),
    },
    PhilosophieCard: {
      label: "Philosophie-Karte",
      fields: {
        icon: {
          type: "radio",
          label: "Icon",
          options: [
            { label: "Herz", value: "heart" },
            { label: "Schild", value: "shield" },
            { label: "Menschen", value: "users" },
          ],
        },
        title: { type: "text", label: "Titel" },
        text: { type: "textarea", label: "Text" },
      },
      defaultProps: {
        icon: "heart",
        title: "Wir sind einfühlsam.",
        text: "Wir nehmen uns Zeit. Gemeinsam gestalten wir individuelle Abschiede.",
      },
      render: ({ icon, title, text }) => {
        const IconComp =
          icon === "shield"
            ? () => <span className="text-emerald-600 w-12 h-12 mb-6 block">🛡</span>
            : icon === "users"
              ? () => <span className="text-emerald-600 w-12 h-12 mb-6 block">👥</span>
              : () => <span className="text-emerald-600 w-12 h-12 mb-6 block">❤️</span>;
        return (
          <div className="bg-stone-50 p-10 rounded-4xl border border-stone-100 hover:border-rose-200 transition shadow-sm">
            <IconComp />
            <h4 className="text-2xl font-serif text-emerald-800 mb-4">{title}</h4>
            <p className="text-stone-600 leading-relaxed">{text}</p>
          </div>
        );
      },
    },
    ContactBlock: {
      label: "Kontakt",
      fields: {
        heading: { type: "text", label: "Überschrift" },
        phone: { type: "text", label: "Telefon" },
        email: { type: "text", label: "E-Mail" },
      },
      defaultProps: {
        heading: "Wir sind für Sie da.",
        phone: "0228 620 58 15",
        email: "info@minten-walter.de",
      },
      render: ({ heading, phone, email }) => (
        <section
          id="kontakt"
          className="relative bg-stone-200/80 py-20 px-4 overflow-hidden"
        >
          <div className="relative z-10 max-w-7xl mx-auto">
            <h4 className="text-3xl font-serif mb-8 text-emerald-800">
              {heading}
            </h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-stone-700 bg-white/60 backdrop-blur-sm p-4 rounded-2xl">
                <span className="text-xl font-medium">{phone}</span>
              </div>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 text-stone-700 p-4 text-lg font-medium hover:text-emerald-700"
              >
                {email}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    TrauerfallCard: {
      label: "Im Trauerfall - Karte",
      fields: {
        title: { type: "text", label: "Titel" },
        body: { type: "textarea", label: "Inhalt" },
        ctaText: { type: "text", label: "Button-Text" },
      },
      defaultProps: {
        title: "Im Trauerfall - Was tun?",
        body:
          "Sie haben Zeit. Sie dürfen den verstorbenen Menschen bis zu 36h zu Hause behalten. Rufen Sie den Arzt (Totenschein) und im Anschluss uns an.",
        ctaText: "Jetzt anrufen",
      },
      render: ({ title, body, ctaText }) => (
        <section className="relative bg-stone-200/80 py-20 px-4 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto flex justify-center">
            <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-10 text-center shadow-lg border border-stone-200/80 flex flex-col justify-center max-w-md">
              <Info size={48} className="mx-auto mb-6 text-emerald-500" />
              <h5 className="text-2xl font-serif mb-4 text-emerald-800">
                {title}
              </h5>
              <p className="text-stone-600 mb-8 leading-relaxed">{body}</p>
              <a
                href="tel:02286205815"
                className="inline-block bg-rose-200 text-stone-800 px-8 py-3.5 rounded-full font-medium hover:bg-rose-300 transition mx-auto shadow-md"
              >
                {ctaText}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    ImageBlock: puckConfig.components.ImageBlock,
    QuoteBlock: puckConfig.components.QuoteBlock,
    SpacerBlock: puckConfig.components.SpacerBlock,
    CTACard: puckConfig.components.CTACard,
    FAQBlock: puckConfig.components.FAQBlock,
    TermineTeaser: puckConfig.components.TermineTeaser,
  },
  root: {
    fields: {
      title: { type: "text", label: "Seitentitel" },
    },
    defaultProps: {
      title: "Team",
    },
    render: ({ children }: { children?: React.ReactNode }) => (
      <div className="pt-20 bg-stone-50 min-h-screen">
        {children}
      </div>
    ),
  },
};
