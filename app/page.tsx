import fs from "fs/promises";
import path from "path";
import Image from "next/image";
import Encoder from "./encoder";
import blurData from "@/app/lib/blur-data.json";

import { Suspense } from "react";

const Home = () => (
  <main className="flex flex-1 flex-col">
    <div className="relative flex flex-1 flex-col items-center gap-4 text-center">
      <h1 className="text-[min(7vw,4rem)] font-extrabold [font-family:var(--font-fredoka)] lg:text-[min(5vw,4rem)] dark:text-white">
        <span className="block lg:inline">Gifufu~ 💫</span> The Ultimate GIF
        Creator
      </h1>

      <p className="text-[min(3.5vw,1.5rem)] font-semibold text-gray-600 [font-family:var(--font-quicksand)] lg:text-[min(2.9vw,1.5rem)] dark:text-gray-400">
        Drag, drop, and watch the magic happen… fufufu~
      </p>

      <div className="mt-2 h-[11.625rem] w-[13.875rem] scale-75 overflow-hidden rounded-md lg:scale-100">
        <Suspense
          fallback={<div className="size-full animate-pulse bg-emerald-200" />}
        >
          <SmugAnimeImage />
        </Suspense>
      </div>

      <Encoder />
    </div>
  </main>
);

const SmugAnimeImage = async () => {
  const smugsDirectory = path.join(process.cwd(), "public", "smugs");

  const smugs = await fs.readdir(smugsDirectory);
  const randomSmug = smugs[Math.floor(Math.random() * smugs.length)];

  const blurDataURL = blurData[randomSmug as keyof typeof blurData];

  return (
    <Image
      width={222}
      height={186}
      alt="smug anime girl"
      src={`/smugs/${randomSmug}`}
      placeholder="blur"
      blurDataURL={blurDataURL}
      className="size-full object-cover"
    />
  );
};

export default Home;
