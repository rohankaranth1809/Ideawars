import type { Metadata } from "next";
import { Instrument_Sans, Syne } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: "Idea Wars",
  description: "Drop ideas into a timed thread. The crowd votes. The best rise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${instrument.variable} font-sans antialiased`}>
        <Nav />
        <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8">{children}</main>
      </body>
    </html>
  );
}
