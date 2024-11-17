"use client";

import Cookies from "js-cookie";

import { twMerge } from "tailwind-merge";
import { useEffect } from "react";
import { BsFillMoonStarsFill, BsFillSunFill } from "react-icons/bs";

type Props = {
  className?: string;
};

const ThemeToggler = ({ className }: Props) => {
  useEffect(() => {
    if (Cookies.get("theme")) {
      return;
    }

    // listen for theme changes when the theme cookie is not set
    // we need to change themes somehow when the user changes their system theme
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    enableDarkMode(media.matches);

    const listener = (event: MediaQueryListEvent) =>
      enableDarkMode(event.matches);

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  return (
    <button
      title="Toggle theme"
      aria-label="toggle theme"
      className={twMerge(
        "rounded-full border border-stone-200 p-1 dark:border-stone-600 [&>*]:size-full",
        className,
      )}
      onClick={() => {
        const themeCookie = Cookies.get("theme");

        let theme: "dark" | "light";

        if (themeCookie === "dark") {
          Cookies.set("theme", "light", { expires: 365 });
          theme = "light";
        } else if (themeCookie === "light") {
          Cookies.set("theme", "dark", { expires: 365 });
          theme = "dark";
        } else if (
          themeCookie === undefined &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          Cookies.set("theme", "light", { expires: 365 });
          theme = "light";
        } else {
          Cookies.set("theme", "dark", { expires: 365 });
          theme = "dark";
        }

        enableDarkMode(theme === "dark");
      }}
    >
      <BsFillSunFill className="hidden dark:block" />
      <BsFillMoonStarsFill className="dark:hidden" />
    </button>
  );
};

const enableDarkMode = (isDarkMode: boolean) => {
  if (isDarkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export default ThemeToggler;
