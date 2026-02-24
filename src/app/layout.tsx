import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "liebevoll bestatten",
  description: "Wir begleiten Sie in schweren Zeiten mit Wärme, Empathie und einem Fokus auf das, was wirklich zählt: Ein würdevoller, liebevoller Abschied.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body
        className="font-sans antialiased text-stone-700 bg-stone-50 selection:bg-emerald-900 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
