interface Props extends React.ComponentProps<"input"> {
  label: string;
}

const Input = ({ label, placeholder, ...props }: Props) => (
  <div
    style={{ "--highlight-color": "#10b981" } as React.CSSProperties}
    className="relative flex flex-col"
  >
    <input
      ref={(inputElement) => {
        if (!inputElement) {
          return;
        }

        const controller = new AbortController();

        const { signal } = controller;

        const handleInput = () => {
          if (inputElement.value) {
            inputElement.setAttribute("data-has-text", "true");
          } else {
            inputElement.removeAttribute("data-has-text");
          }
        };

        handleInput();

        inputElement.addEventListener("input", handleInput, { signal });

        return () => controller.abort();
      }}
      aria-label={label}
      className="peer mt-1 rounded-[4px] border-2 border-gray-500 px-[0.9375rem] py-[0.8125rem] focus:outline-none focus:outline-[3px] focus:outline-offset-[-2px] focus:outline-[var(--highlight-color)] focus:ring-0 dark:border-gray-600 dark:bg-gray-800"
      {...props}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute left-2 top-1/2 origin-left -translate-y-1/2 bg-white px-2 text-black transition-all peer-focus:top-1 peer-focus:scale-75 peer-focus:text-[var(--highlight-color)] peer-data-[has-text]:top-1 peer-data-[has-text]:scale-75 dark:bg-gray-800 dark:text-white"
    >
      {label}
    </div>
  </div>
);

export default Input;
