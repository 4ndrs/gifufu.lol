import { twMerge } from "tailwind-merge";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

import * as Select from "@radix-ui/react-select";

const SCALES = ["1080", "720", "620", "520", "480", "320", "240"] as const;

type Props = {
  value: string;
  className?: string;
  settingsHeight?: number;
  onValueChange: (value: string) => void;
};

const ScaleSelector = ({
  value,
  className,
  onValueChange,
  settingsHeight,
}: Props) => (
  <Select.Root value={value} onValueChange={onValueChange}>
    <Select.Trigger
      className={twMerge(
        "flex items-center gap-1 rounded-md bg-black/25 px-2 py-1 text-base font-bold text-white transition-colors [font-family:var(--font-anton)] lg:bg-transparent lg:hover:bg-black/25",
        className,
      )}
      aria-label="scale"
    >
      <Select.Value placeholder="scale" />

      <Select.Icon>
        <CheckIcon />
      </Select.Icon>
    </Select.Trigger>

    <Select.Portal>
      <Select.Content className="z-[1] overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] dark:bg-gray-800">
        <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white text-black dark:bg-gray-800 dark:text-white">
          <FaChevronUp />
        </Select.ScrollUpButton>

        <Select.Viewport className="p-1">
          <SelectItem value="-1">no scale</SelectItem>

          {SCALES.filter((scale) => scale !== settingsHeight?.toString()).map(
            (scale) => (
              <SelectItem key={scale} value={scale}>
                {scale}p
              </SelectItem>
            ),
          )}

          {settingsHeight && (
            <Select.Group>
              <Select.Label className="relative mt-2 pl-1 text-xs">
                Setting&apos;s scale
              </Select.Label>

              <SelectItem value={settingsHeight.toString()}>
                {settingsHeight}p
              </SelectItem>
            </Select.Group>
          )}
        </Select.Viewport>

        <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white text-black dark:bg-gray-800 dark:text-white">
          <FaChevronDown />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);

const SelectItem = ({
  ref,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Select.Item>) => (
  <Select.Item
    className="relative flex h-7 select-none items-center rounded-[3px] px-6 text-sm"
    {...props}
    ref={ref}
  >
    <Select.ItemText>{children}</Select.ItemText>

    <Select.ItemIndicator className="absolute right-0 inline-flex w-6 items-center justify-center">
      <CheckIcon />
    </Select.ItemIndicator>
  </Select.Item>
);

const CheckIcon = () => <div className="size-3 rounded-full bg-red-500" />;

export default ScaleSelector;
