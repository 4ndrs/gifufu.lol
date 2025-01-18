import Nav from "@/app/ui/nav";
import Wave from "@/app/ui/wave";

import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { Lato, Fredoka, Quicksand, Anton_SC } from "next/font/google";

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

const anton = Anton_SC({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-anton",
});

export const metadata: Metadata = {
  title: "Gifufu",
  description: "Convert videos to GIFs in your browser with one click.",
};

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const isDarkMode = (await cookies()).get("theme")?.value === "dark";

  return (
    // eslint-disable-next-line tailwindcss/no-custom-classname
    <html lang="en" className={isDarkMode ? "dark" : undefined}>
      <body
        className={`${lato.className} ${fredoka.variable} ${quicksand.variable} ${anton.variable} min-h-screen bg-white text-black antialiased dark:bg-gray-900 dark:text-gray-200`}
      >
        <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
          <div className="relative flex flex-1 flex-col px-5 pt-5">
            <Nav className="mb-4" />
            {children}
          </div>

          <Wave />
        </div>

        <Toaster position="top-right" />
      </body>
    </html>
  );
};

export default RootLayout;
