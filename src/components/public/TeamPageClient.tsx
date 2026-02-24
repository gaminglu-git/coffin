"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { CompanySettings } from "@/app/actions/company-settings";
import type { PageContent } from "@/app/actions/company-settings";
import { TeamContentBlocks } from "@/components/admin/WebsiteEditor";

/** Stil für Mitarbeiternamen im Bio-Text (Farbe wie auf dem Lanyard) */
const NAME_STYLE = "font-bold text-[1.1rem] text-emerald-700";

const Lanyard3D = dynamic(
  () => import("@/components/public/Lanyard3D").then((m) => m.Lanyard3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-stone-100 rounded-2xl">
        <span className="text-stone-500">Lade 3D-Ansicht…</span>
      </div>
    ),
  }
);

interface TeamPageClientProps {
  companySettings: CompanySettings;
  /** Full page content from Website-Editor (page_content_team) */
  pageContent?: PageContent | null;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: React.ReactNode;
}

function TeamMemberCard({
  member,
  companySettings,
  index,
}: {
  member: TeamMember;
  companySettings: CompanySettings;
  index: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [triggerSwing, setTriggerSwing] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggeredRef.current) {
          triggeredRef.current = true;
          setTriggerSwing(true);
        }
      },
      { threshold: 0.2 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const lanyardLeft = index % 2 === 0;
  return (
    <article
      ref={sectionRef}
      className={`
        flex flex-col gap-8
        md:flex-row md:gap-12 md:items-center
        ${!lanyardLeft ? "md:flex-row-reverse" : ""}
      `}
    >
      <div className="relative w-full max-w-[380px] shrink-0">
        {/* Holzleiste als Aufhängung direkt über dem Canvas */}
        <div
          className="h-4 w-full rounded-t-xl"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 2px,
                rgba(139, 105, 20, 0.15) 2px,
                rgba(139, 105, 20, 0.15) 3px
              ),
              linear-gradient(180deg,
                #b8956a 0%,
                #8b6914 12%,
                #c4a574 25%,
                #9a7b4a 38%,
                #8b6914 50%,
                #c4a574 62%,
                #9a7b4a 75%,
                #8b6914 88%,
                #b8956a 100%
              )
            `,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.12)",
          }}
        />
        <Lanyard3D
          className="relative w-full h-[520px] rounded-b-2xl overflow-hidden -mt-px"
          companyName={companySettings.displayName}
          cardData={{
            logoUrl: companySettings.logoUrl,
            companyName: companySettings.displayName,
            employeeName: member.name,
            employeeRole: member.role,
            employeeImage: member.image,
          }}
          position={[0, 0, 6.5]}
          fov={29}
          transparent
          triggerSwing={triggerSwing}
        />
      </div>
      <div className="flex-1 min-w-0 md:flex md:items-center md:justify-center pt-8 md:pt-12">
        <p className="text-stone-600 leading-relaxed text-base w-full max-w-lg">{member.bio}</p>
      </div>
    </article>
  );
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Ralph Walter",
    role: "Geschäftsführer & Bestatter",
    image: "/assets/minten_walter_bestattungen_ralph_walter-0a17b218.jpg",
    bio: (
      <>
        <span className={NAME_STYLE}>Ralph Walter</span> ist <strong>Bestatter von ganzem Herzen</strong> und mit seiner herzlichen und empathischen Art Ihr Ansprechpartner und Begleiter bei allen Schritten des Abschieds. Als gelernter Kaufmann im Einzelhandel kam er Mitte der 90er Jahre erstmals mit dem Thema Bestattungen in Kontakt und merkte schnell: <em>Das ist es!</em> Im Bestattungshaus Begleitung e.G. in Köln hat er die Arbeit als Bestatter <em>von der Pike auf</em> gelernt und war dort bis 2001 tätig, zuletzt als Geschäftsführer. <strong>2003</strong> gründete er gemeinsam mit Beate Minten in Bonn minten & walter bestattungen. Er hat die Ausbildung zum <strong>Sterbe- und Trauerbegleiter</strong> gemacht und sich als erster Bonner Bestatter zum demenzfreundlichen Bestatter weitergebildet. <span className={NAME_STYLE}>Ralph Walter</span> ist außerdem Gründungsmitglied des BestatterInnen-Netzwerks.
      </>
    ),
  },
  {
    name: "Katrin Lankers",
    role: "Bestatterin & Trauerrednerin",
    image: "/assets/minten_walter_bestattungen_katrin_lankers-302f5fdc.jpg",
    bio: (
      <>
        <span className={NAME_STYLE}>Katrin Lankers</span> ist als Bestatterin bei minten & walter und außerdem auch als <strong>Trauerrednerin</strong> tätig. Sie hat sich schon immer für die <em>Lebensgeschichten von Menschen</em> begeistert und arbeitete viele Jahre als Journalistin und Autorin. Als ihr Vater starb, kam sie erstmals direkt mit dem Tod in Berührung und aus dieser Erfahrung entstand der Wunsch, Menschen in der Zeit des Abschieds eine <strong>gute Begleitung</strong> anzubieten. Dazu gehört für sie vor allem auch, über alle Möglichkeiten zu informieren, damit Familie und Freundeskreis des verstorbenen Menschen herausfinden können, wie der <em>passende Abschied</em> aussehen soll. Mit ihren Worten lässt sie die Lebensgeschichte des verstorbenen Menschen bei der Abschiedsfeier noch einmal aufleben.
      </>
    ),
  },
  {
    name: "Claudia Fricke",
    role: "Bestatterin",
    image: "/assets/minten_walter_bestattungen_claudia_fricke-dbae900b.jpg",
    bio: (
      <>
        <span className={NAME_STYLE}>Claudia Fricke</span> hat lange Zeit in Vertrieb und Marketing von internationalen Unternehmen gearbeitet, doch der Tod war <em>schon immer Teil ihres Lebens</em>. Sie engagierte sich mehrere Jahre ehrenamtlich in der Sterbebegleitung bei Bonn Lighthouse und war Mitgründerin von Bohana, dem Netzwerk und Online-Portal für Abschiedskultur. Inzwischen ist sie ehrenamtlich für die <strong>Notfallseelsorge Bonn/Rhein-Sieg</strong> tätig und hat beschlossen, endlich auch beruflich das zu tun, was ihr wirklich wichtig ist: <strong>Menschen in ihrer Trauer zugewandt begleiten</strong> und gemeinsam mit den Angehörigen Trauerfeiern gestalten, die der Persönlichkeit des verstorbenen Menschen entsprechen. Damit der Abschied unvergesslich und sogar schön werden kann.
      </>
    ),
  },
  {
    name: "Vivien Hellweg",
    role: "Bestatterin",
    image: "/assets/minten_walter_bestattungen_vivien_hellweg-287d0fa8.jpeg",
    bio: (
      <>
        <span className={NAME_STYLE}>Vivien Hellweg</span> ist ausgebildete Gymnasiallehrerin mit dem Schwerpunkt Sprachen und hat in verschiedenen Branchen wertvolle Erfahrungen gesammelt – unter anderem in der Medizin, im Marketing und als Texterin. Doch das Thema Tod und Abschied war stets ein <em>stiller Begleiter</em> in ihrem Leben. Geprägt durch persönliche Erfahrungen und mit dem tiefen Wunsch, Menschen in Zeiten der Trauer <strong>Halt zu geben</strong>, hat sie sich dazu entschlossen, einen neuen Weg einzuschlagen – als Bestatterin. Es ist ihr ein <strong>Herzensanliegen</strong>, Trauernde zu begleiten und Abschiede mitzugestalten, die respektvoll und liebevoll zugleich sind – im Einklang mit dem Leben der Verstorbenen.
      </>
    ),
  },
];

const DEFAULT_TEAM_HEADER = {
  title: "Unser Team",
  intro:
    "Lernen Sie die Menschen kennen, die Sie bei minten & walter bestattungen in schweren Zeiten begleiten.",
};

function extractHeaderAndBlocks(pageContent: PageContent | null): {
  title: string;
  intro: string;
  otherBlocks: Array<{ type: string; props: Record<string, unknown> }>;
} {
  const content = pageContent?.content ?? [];
  const headerBlock = content.find((b) => b.type === "TeamHeaderBlock");
  const { title, intro } =
    (headerBlock?.props as { title?: string; intro?: string }) ?? {};
  const otherBlocks = content.filter((b) => b.type !== "TeamHeaderBlock");
  return {
    title: typeof title === "string" ? title : DEFAULT_TEAM_HEADER.title,
    intro: typeof intro === "string" ? intro : DEFAULT_TEAM_HEADER.intro,
    otherBlocks,
  };
}

export function TeamPageClient({
  companySettings,
  pageContent = null,
}: TeamPageClientProps) {
  const { title, intro, otherBlocks } = extractHeaderAndBlocks(
    pageContent ?? null
  );

  return (
    <div className="pt-24 min-h-screen bg-stone-50">
      <section className="px-4 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Von der Gründung bis heute */}
          <section className="mb-20">
            <h1 className="text-4xl sm:text-5xl font-serif font-light text-emerald-800 tracking-tight mb-6">
              Unsere Geschichte
            </h1>
            <div className="flex flex-col md:flex-row md:items-center md:gap-10 gap-6">
              <div className="relative w-full aspect-4/3 max-w-[240px] shrink-0 rounded-2xl overflow-hidden border border-stone-200 shadow-lg mx-auto md:mx-0">
                <Image
                  src="/assets/MintenWalter_Bestattungen_Team_01-4ef7a073.jpg"
                  alt="Beate Minten und Ralph Walter, Gründer von minten & walter bestattungen"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 240px"
                  priority
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center space-y-4">
                <p className="text-stone-600 leading-relaxed">
                  Beate Minten und Ralph Walter lernten sich bei der gemeinsamen Arbeit für das <strong>Bestattungshaus Begleitung e.G.</strong> in Köln kennen. Durch ihre Erfahrungen in der Begleitung im Trauerfall wuchs in ihnen der Wunsch, ein <em>modernes und lebensnahes</em> Bestattungshaus in Bonn zu gründen. Im Jahr <strong>2003</strong> setzten sie diese Idee mit der Gründung von <strong>minten & walter bestattungen</strong> in die Tat um.
                </p>
                <p className="text-stone-600 leading-relaxed">
                  Das Ziel war von Anfang an, den Menschen, die wir begleiten, <strong>Zeit und Raum für die Trauer</strong> zu geben und einen passenden und wohltuenden Abschied zu ermöglichen. Leider musste Beate Minten im Jahr 2021 aus gesundheitlichen Gründen aus dem Unternehmen ausscheiden. Seitdem führt Ralph Walter das Bestattungshaus nun mit seinem <em>engagierten Team</em>.
                </p>
              </div>
            </div>
          </section>

          <h1 className="text-4xl sm:text-5xl font-serif font-light text-emerald-800 tracking-tight mb-6">
            {title}
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed mb-12">
            {intro}
          </p>

          {/* Team-Mitglieder mit Lanyard-Badges */}
          <section className="space-y-16">
            {TEAM_MEMBERS.map((member, index) => (
              <TeamMemberCard
                key={member.name}
                member={member}
                companySettings={companySettings}
                index={index}
              />
            ))}
          </section>

          {otherBlocks.length > 0 && (
            <div className="mt-16">
              <TeamContentBlocks blocks={otherBlocks} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
