"use client";

import { useState } from "react";
import Image from "next/image";
import { Phone, FileSearch, Heart, ShieldCheck, Users, Euro, CheckCircle, Mail, Info } from "lucide-react";
import { Navbar } from "@/components/public/Navbar";
import { VorsorgeConfigurator } from "@/components/public/VorsorgeConfigurator";
import { TrauerfallForm } from "@/components/public/TrauerfallForm";
import { BeratungForm } from "@/components/public/BeratungForm";

export default function Home() {
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [isTrauerfallOpen, setIsTrauerfallOpen] = useState(false);
  const [isBeratungOpen, setIsBeratungOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <div className="pt-20 bg-stone-50 min-h-screen">
        <section id="hero" className="relative min-h-[80vh] bg-stone-50 flex items-center justify-center py-24 sm:py-32 lg:pb-40 text-center px-4 overflow-hidden">
          {/* Dekorative Blumen-SVGs im Hintergrund */}
          <div className="absolute top-10 left-10 opacity-50 pointer-events-none">
            <Image src="/assets/hand-drawn-flower-1.svg" alt="" width={128} height={128} className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-sm" />
          </div>
          <div className="absolute bottom-20 right-10 opacity-50 pointer-events-none">
            <Image src="/assets/hand-drawn-leaf.svg" alt="" width={160} height={160} className="w-28 h-28 sm:w-40 sm:h-40 drop-shadow-sm" />
          </div>
          <div className="absolute top-1/4 right-1/4 opacity-30 pointer-events-none hidden lg:block">
            <Image src="/assets/botanical-decoration.svg" alt="" width={96} height={96} className="w-24 h-24" />
          </div>
          <div className="absolute bottom-1/3 left-1/4 opacity-30 pointer-events-none hidden lg:block">
            <Image src="/assets/hand-drawn-flower-1.svg" alt="" width={80} height={80} className="w-20 h-20" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-emerald-800 tracking-tight">
              liebevoll bestatten.
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 max-w-xl mx-auto leading-relaxed">
              Wir begleiten Sie in schweren Zeiten mit Wärme, Empathie und einem Fokus auf das, was wirklich zählt: Ein würdevoller, liebevoller Abschied.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => scrollTo("kontakt")}
                className="px-8 py-4 bg-rose-200 text-stone-800 rounded-full font-medium hover:bg-rose-300 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <Phone size={20} /> Lassen Sie uns reden
              </button>
              <button
                onClick={() => setIsConfiguratorOpen(true)}
                className="px-8 py-4 bg-white text-emerald-800 rounded-full font-medium hover:bg-stone-100 border border-stone-200 transition flex items-center justify-center gap-2 shadow-sm"
              >
                <FileSearch size={20} /> Vorsorge digital planen
              </button>
            </div>
          </div>
        </section>

        <section id="philosophie" className="py-24 bg-white px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="bg-stone-50 p-10 rounded-4xl border border-stone-100 hover:border-rose-200 transition shadow-sm">
              <Heart className="text-emerald-600 w-12 h-12 mb-6" />
              <h4 className="text-2xl font-serif text-emerald-800 mb-4">Wir sind einfühlsam.</h4>
              <p className="text-stone-600 leading-relaxed">
                Wir nehmen uns Zeit. Gemeinsam gestalten wir individuelle Abschiede. Den Sarg bemalen, die Urne selbst tragen – all das kann helfen, den Verlust zu begreifen.
              </p>
            </div>
            <div className="bg-stone-50 p-10 rounded-4xl border border-stone-100 hover:border-rose-200 transition shadow-sm">
              <ShieldCheck className="text-emerald-600 w-12 h-12 mb-6" />
              <h4 className="text-2xl font-serif text-emerald-800 mb-4">Wir sind offen.</h4>
              <p className="text-stone-600 leading-relaxed">
                Offen für alle Menschen (LGBTQIA+ friendly) und Formen des Abschieds. Wir zeigen auf, was möglich ist und machen unsere Kosten absolut transparent.
              </p>
            </div>
            <div className="bg-stone-50 p-10 rounded-4xl border border-stone-100 hover:border-rose-200 transition shadow-sm">
              <Users className="text-emerald-600 w-12 h-12 mb-6" />
              <h4 className="text-2xl font-serif text-emerald-800 mb-4">Wir sind menschlich.</h4>
              <p className="text-stone-600 leading-relaxed">
                Nahbar und respektvoll. Wir waschen den verstorbenen Menschen, gerne in eigener Kleidung, wenn gewünscht auch gemeinsam mit Ihnen zu Hause.
              </p>
            </div>
          </div>
        </section>

        <section id="leistungen" className="relative py-24 bg-stone-100 px-4 overflow-hidden">
          <div className="absolute top-8 right-16 opacity-25 pointer-events-none hidden md:block">
            <Image src="/assets/hand-drawn-leaf.svg" alt="" width={64} height={64} className="w-16 h-16" />
          </div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
            <div className="md:w-1/2">
              <h3 className="text-3xl sm:text-4xl font-serif text-emerald-800 mb-6 leading-tight">
                Selbstbestimmt bis zum Schluss. <br />
                Unsere Vorsorge.
              </h3>
              <p className="text-stone-600 mb-6 text-lg leading-relaxed">
                Nehmen Sie Ihren Liebsten die schwersten Entscheidungen ab. Mit einer Bestattungsvorsorge legen Sie zu Lebzeiten fest, wie Ihr Abschied gestaltet werden soll.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-600 mt-1 shrink-0" size={20} />
                  <span className="text-stone-700">Sicherheit und Entlastung für Angehörige.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-600 mt-1 shrink-0" size={20} />
                  <span className="text-stone-700">Garantiert Ihre persönlichen Wünsche.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-600 mt-1 shrink-0" size={20} />
                  <span className="text-stone-700">Volle finanzielle Absicherung möglich.</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 w-full bg-white p-8 sm:p-12 rounded-4xl shadow-xl border border-stone-100 text-center" id="vorsorge">
              <Euro className="text-emerald-600 w-16 h-16 mx-auto mb-6 opacity-80" />
              <h4 className="text-2xl font-serif text-emerald-800 mb-4">Transparente Kostenplanung</h4>
              <p className="text-stone-600 mb-8">
                Nutzen Sie unseren digitalen Konfigurator, um in 3 einfachen Schritten Ihre Wünsche zusammenzustellen und eine sofortige Kostenschätzung zu erhalten.
              </p>
              <button
                onClick={() => setIsConfiguratorOpen(true)}
                className="bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-emerald-800 transition w-full shadow-md"
              >
                Jetzt Wünsche konfigurieren
              </button>
              <p className="mt-6 text-sm text-stone-500">
                Trauerfall?{" "}
                <button type="button" onClick={() => setIsTrauerfallOpen(true)} className="text-emerald-700 hover:underline font-medium">
                  Sofort anfragen
                </button>
                {" · "}
                Beratung gewünscht?{" "}
                <button type="button" onClick={() => setIsBeratungOpen(true)} className="text-emerald-700 hover:underline font-medium">
                  Anfragen
                </button>
              </p>
            </div>
          </div>
        </section>

        <footer id="kontakt" className="relative bg-stone-200/80 py-20 px-4 overflow-hidden">
          {/* Dezente florale Dekoration im Footer */}
          <div className="absolute top-4 right-8 opacity-40 pointer-events-none">
            <Image src="/assets/hand-drawn-flower-1.svg" alt="" width={80} height={80} className="w-20 h-20" />
          </div>
          <div className="absolute bottom-8 left-12 opacity-30 pointer-events-none">
            <Image src="/assets/hand-drawn-leaf.svg" alt="" width={96} height={96} className="w-24 h-24" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
            <div>
              <h4 className="text-3xl font-serif mb-8 text-emerald-800">Wir sind für Sie da.</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-stone-700 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                  <Phone size={24} className="text-emerald-600" />
                  <span className="text-xl font-medium">0228 620 58 15</span>
                </div>
                <div className="flex items-center gap-4 text-stone-700 p-4">
                  <Mail size={24} className="text-emerald-600" />
                  <a href="mailto:info@minten-walter.de" className="text-lg font-medium hover:text-emerald-700 transition">
                    info@minten-walter.de
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-10 text-center shadow-lg border border-stone-200/80 flex flex-col justify-center">
              <Info size={48} className="mx-auto mb-6 text-emerald-500" />
              <h5 className="text-2xl font-serif mb-4 text-emerald-800">Im Trauerfall - Was tun?</h5>
              <p className="text-stone-600 mb-8 leading-relaxed">
                Sie haben Zeit. Sie dürfen den verstorbenen Menschen bis zu 36h zu Hause behalten. Rufen Sie den Arzt (Totenschein) und im Anschluss uns an.
              </p>
              <a href="tel:02286205815" className="inline-block bg-rose-200 text-stone-800 px-8 py-3.5 rounded-full font-medium hover:bg-rose-300 transition mx-auto shadow-md">
                Jetzt anrufen
              </a>
            </div>
          </div>
        </footer>
      </div>

      <VorsorgeConfigurator open={isConfiguratorOpen} onOpenChange={setIsConfiguratorOpen} />
      <TrauerfallForm open={isTrauerfallOpen} onOpenChange={setIsTrauerfallOpen} />
      <BeratungForm open={isBeratungOpen} onOpenChange={setIsBeratungOpen} />
    </>
  );
}
