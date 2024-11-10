import Nav from "@/app/ui/nav";
import localFont from "next/font/local";

import type { Metadata } from "next";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
      className={`${geistSans.variable} ${geistMono.variable} m-5 overflow-hidden bg-white antialiased`}
    >
      <div className="bg-white">
        <Nav />
        {children}
        <div className="background-wave absolute inset-x-0 -bottom-2 z-[-2] h-[40rem]" />
      </div>
    </body>
  </html>
);

export default RootLayout;
