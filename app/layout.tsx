import Nav from "@/app/ui/nav";

import { Lato, Fredoka, Quicksand } from "next/font/google";

import "@/app/globals.css";

import type { Metadata } from "next";

const lato = Lato({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-lato",
});

const fredoka = Fredoka({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-fredoka",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "Gifufu",
  description: "Convert videos to GIFs in your browser with one click.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body
      className={`${lato.className} ${fredoka.variable} ${quicksand.variable} relative h-screen overflow-auto bg-white antialiased`}
    >
      <div className="flex h-full flex-col bg-white">
        <div className="flex size-full flex-col px-5 pt-5">
          <Nav className="mb-4" />
          {children}
        </div>

        <div className="background-wave bottom-0 h-72 w-full shrink-0" />
      </div>
    </body>
  </html>
);

export default RootLayout;
