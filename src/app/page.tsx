"use client";

import { useState } from "react";
import { Phone, FileSearch, Heart, ShieldCheck, Users, Euro, CheckCircle, Mail, Info } from "lucide-react";
import { Navbar } from "@/components/public/Navbar";
import { VorsorgeConfigurator } from "@/components/public/VorsorgeConfigurator";

export default function Home() {
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <div className="pt-20 bg-[var(--color-mw-offwhite)] min-h-screen">
        <section id="hero" className="relative bg-[var(--color-mw-sand)] py-24 sm:py-32 lg:pb-40 text-center px-4 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#e1ded5] opacity-50 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[var(--color-mw-green-dark)] mb-6 leading-tight">
              Wir begleiten Abschied. <br className="hidden sm:block" />
              Einfühlsam, offen und menschlich.
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Seit über 20 Jahren sind wir in Bonn jederzeit für Sie da. Im Trauerfall ebenso wie bei der Vorsorge. Wir geben Ihnen den Raum, den es braucht.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => scrollTo("kontakt")}
                className="bg-[var(--color-mw-green)] text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[var(--color-mw-green-dark)] transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Phone size={20} /> Im Trauerfall anrufen
              </button>
              <button
                onClick={() => setIsConfiguratorOpen(true)}
                className="bg-white text-[var(--color-mw-green)] px-8 py-3.5 rounded-full text-lg font-medium hover:bg-gray-50 border border-gray-200 transition flex items-center justify-center gap-2 shadow-sm"
              >
                <FileSearch size={20} /> Vorsorge digital planen
              </button>
            </div>
          </div>
        </section>

        <section id="philosophie" className="py-24 bg-white px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="bg-[var(--color-mw-offwhite)] p-10 rounded-3xl border border-gray-100 hover:border-[#d5d0c5] transition">
              <Heart className="text-[var(--color-mw-green-light)] w-12 h-12 mb-6" />
              <h4 className="text-2xl font-serif text-[var(--color-mw-green)] mb-4">Wir sind einfühlsam.</h4>
              <p className="text-gray-600 leading-relaxed">
                Wir nehmen uns Zeit. Gemeinsam gestalten wir individuelle Abschiede. Den Sarg bemalen, die Urne selbst tragen – all das kann helfen, den Verlust zu begreifen.
              </p>
            </div>
            <div className="bg-[var(--color-mw-offwhite)] p-10 rounded-3xl border border-gray-100 hover:border-[#d5d0c5] transition">
              <ShieldCheck className="text-[var(--color-mw-green-light)] w-12 h-12 mb-6" />
              <h4 className="text-2xl font-serif text-[var(--color-mw-green)] mb-4">Wir sind offen.</h4>
              <p className="text-gray-600 leading-relaxed">
                Offen für alle Menschen (LGBTQIA+ friendly) und Formen des Abschieds. Wir zeigen auf, was möglich ist und machen unsere Kosten absolut transparent.
              </p>
            </div>
            <div className="bg-[var(--color-mw-offwhite)] p-10 rounded-3xl border border-gray-100 hover:border-[#d5d0c5] transition">
              <Users className="text-[var(--color-mw-green-light)] w-12 h-12 mb-6" />
              <h4 className="text-2xl font-serif text-[var(--color-mw-green)] mb-4">Wir sind menschlich.</h4>
              <p className="text-gray-600 leading-relaxed">
                Nahbar und respektvoll. Wir waschen den verstorbenen Menschen, gerne in eigener Kleidung, wenn gewünscht auch gemeinsam mit Ihnen zu Hause.
              </p>
            </div>
          </div>
        </section>

        <section id="leistungen" className="py-24 bg-[var(--color-mw-sand)] px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <h3 className="text-3xl sm:text-4xl font-serif text-[var(--color-mw-green)] mb-6 leading-tight">
                Selbstbestimmt bis zum Schluss. <br />
                Unsere Vorsorge.
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Nehmen Sie Ihren Liebsten die schwersten Entscheidungen ab. Mit einer Bestattungsvorsorge legen Sie zu Lebzeiten fest, wie Ihr Abschied gestaltet werden soll.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-[var(--color-mw-green)] mt-1 shrink-0" size={20} />
                  <span className="text-gray-700">Sicherheit und Entlastung für Angehörige.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-[var(--color-mw-green)] mt-1 shrink-0" size={20} />
                  <span className="text-gray-700">Garantiert Ihre persönlichen Wünsche.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-[var(--color-mw-green)] mt-1 shrink-0" size={20} />
                  <span className="text-gray-700">Volle finanzielle Absicherung möglich.</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 w-full bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 text-center" id="vorsorge">
              <Euro className="text-[var(--color-mw-green)] w-16 h-16 mx-auto mb-6 opacity-80" />
              <h4 className="text-2xl font-serif text-[var(--color-mw-green)] mb-4">Transparente Kostenplanung</h4>
              <p className="text-gray-600 mb-8">
                Nutzen Sie unseren digitalen Konfigurator, um in 3 einfachen Schritten Ihre Wünsche zusammenzustellen und eine sofortige Kostenschätzung zu erhalten.
              </p>
              <button
                onClick={() => setIsConfiguratorOpen(true)}
                className="bg-[var(--color-mw-green)] text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-[var(--color-mw-green-dark)] transition w-full shadow-md"
              >
                Jetzt Wünsche konfigurieren
              </button>
            </div>
          </div>
        </section>

        <footer id="kontakt" className="bg-[var(--color-mw-green-dark)] text-white py-20 px-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
            <div>
              <h4 className="text-3xl font-serif mb-8 text-[var(--color-mw-sand)]">Wir sind für Sie da.</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-gray-200 bg-[var(--color-mw-green)]/30 p-4 rounded-2xl">
                  <Phone size={24} className="text-[#a8b5ab]" />
                  <span className="text-xl">0228 620 58 15</span>
                </div>
                <div className="flex items-center gap-4 text-gray-200 p-4">
                  <Mail size={24} className="text-[#a8b5ab]" />
                  <a href="mailto:info@minten-walter.de" className="text-lg hover:text-white transition">
                    info@minten-walter.de
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-[var(--color-mw-green)] rounded-3xl p-10 text-center shadow-2xl flex flex-col justify-center">
              <Info size={48} className="mx-auto mb-6 text-[#a8b5ab]" />
              <h5 className="text-2xl font-serif mb-4 text-[var(--color-mw-sand)]">Im Trauerfall - Was tun?</h5>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Sie haben Zeit. Sie dürfen den verstorbenen Menschen bis zu 36h zu Hause behalten. Rufen Sie den Arzt (Totenschein) und im Anschluss uns an.
              </p>
              <a href="tel:02286205815" className="inline-block bg-white text-[var(--color-mw-green-dark)] px-8 py-3.5 rounded-full font-medium hover:bg-gray-100 transition mx-auto shadow-md">
                Jetzt anrufen
              </a>
            </div>
          </div>
        </footer>
      </div>

      <VorsorgeConfigurator open={isConfiguratorOpen} onOpenChange={setIsConfiguratorOpen} />
    </>
  );
}
