import Link from "next/link";
import { FaGithub } from "react-icons/fa";

const Nav = () => {
  return (
    <nav className="relative flex">
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
