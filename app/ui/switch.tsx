import * as _Switch from "@radix-ui/react-switch";

const Switch = (props: React.ComponentProps<typeof _Switch.Root>) => (
  <_Switch.Root
    className="relative h-[25px] w-[42px] cursor-default rounded-full bg-gray-300 outline-none data-[state=checked]:bg-emerald-500 dark:bg-gray-700"
    {...props}
  >
    <_Switch.Thumb className="block size-[21px] translate-x-0.5 rounded-full bg-white transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[19px]" />
  </_Switch.Root>
);

export default Switch;
