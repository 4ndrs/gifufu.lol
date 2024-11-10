import { twMerge } from "tailwind-merge";

interface LinkProps extends React.ComponentProps<"a"> {
  link: true;
}

interface ButtonProps extends React.ComponentProps<"button"> {
  link?: false;
}

type Props = ButtonProps | LinkProps;

const Button = ({ children, className, ...props }: Props) => {
  const baseClasses =
    "cursor-pointer rounded-md bg-emerald-500 px-4 py-2.5 font-bold text-white disabled:cursor-auto disabled:bg-gray-300 disabled:text-gray-500";

  if (props.link) {
    const { link, ...rest } = props;

    return (
      <a {...rest} className={twMerge(baseClasses, className)}>
        {children}
      </a>
    );
  }

  const { link, ...rest } = props;

  return (
    <button
      {...rest}
      className={twMerge(
        "cursor-pointer rounded-md bg-emerald-500 px-4 py-2.5 font-bold text-white disabled:cursor-auto disabled:bg-gray-300 disabled:text-gray-500",
        className,
      )}
    >
      {children}
    </button>
  );
};

export default Button;
