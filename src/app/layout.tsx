import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Minten & Walter Bestattungen",
  description: "Wir begleiten Abschied. Einfühlsam, offen und menschlich. Seit über 20 Jahren in Bonn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="font-sans antialiased text-gray-800 bg-[#faf9f7] selection:bg-[#4a554e] selection:text-white">
        {children}
      </body>
    </html>
  );
}
