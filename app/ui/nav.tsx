import { twMerge } from "tailwind-merge";
import { FaGithub } from "react-icons/fa";

import Link from "next/link";

type Props = {
  className?: string;
};

const Nav = ({ className }: Props) => {
  return (
    <nav className={twMerge("relative flex", className)}>
      <Link href="/">gifufu.lol</Link>
      <a
        target="_blank"
        rel="noopener"
        href="https://github.com/4ndrs/gifufu.lol"
        className="ml-auto mr-0"
      >
        <FaGithub className="size-5" />
      </a>
    </nav>
  );
};

export default Nav;
