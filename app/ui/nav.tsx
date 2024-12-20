import { twMerge } from "tailwind-merge";
import { FaGithub } from "react-icons/fa";

import Link from "next/link";
import Settings from "@/app/ui/settings";
import ThemeToggler from "@/app/ui/theme-toggler";

type Props = {
  className?: string;
};

const Nav = ({ className }: Props) => (
  <nav className={twMerge("relative flex", className)}>
    <Link href="/">gifufu.lol</Link>

    <div className="ml-auto mr-0 flex items-center gap-2">
      <Settings className="relative bottom-px" />
      <ThemeToggler className="size-6" />
      <a
        rel="noopener"
        target="_blank"
        className="rounded-full"
        title="Check out this cool github repo"
        href="https://github.com/4ndrs/gifufu.lol"
      >
        <FaGithub className="size-5" />
      </a>
    </div>
  </nav>
);

export default Nav;
