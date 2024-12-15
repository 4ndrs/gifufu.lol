"use client";

import { toast } from "sonner";
import { FaGear } from "react-icons/fa6";
import { twMerge } from "tailwind-merge";
import { FaTimes } from "react-icons/fa";
import { useState } from "react";
import { MdSettingsSuggest } from "react-icons/md";

import Input from "@/app/ui/input";
import Button from "@/app/ui/button";
import useSettingsStore from "@/app/lib/store";

import * as Dialog from "@radix-ui/react-dialog";

interface Props extends React.ComponentProps<typeof Dialog.Trigger> {}

const Settings = ({ className, ...props }: Props) => {
  const [key, setKey] = useState(0);

  const { fps, reset, height, mpdecimate, updateSettings } = useSettingsStore();

  const handleSave = (formData: FormData) => {
    const fps = parseSafeNumber(formData.get("fps"));
    const height = parseSafeNumber(formData.get("height"));
    const mpdecimate = parseSafeNumber(formData.get("mpdecimate"));

    updateSettings({ fps, height, mpdecimate });

    toast.success("Settings saved!");
  };

  const handleReset = () => {
    reset();
    setKey((prev) => prev + 1);
    toast.success("Settings reset to defaults!");
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger
        {...props}
        title="Open settings"
        aria-label="open settings"
        className={twMerge("rounded-full", className)}
      >
        <MdSettingsSuggest className="size-6" />
      </Dialog.Trigger>

      <Dialog.Overlay className="fixed inset-0 z-[1] bg-black/60 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />

      <Dialog.Content className="fixed inset-x-0 bottom-0 z-[1] bg-white p-10 data-[state=closed]:animate-slide-down data-[state=open]:animate-slide-up lg:inset-0 lg:m-auto lg:h-[38rem] lg:w-[36rem] lg:rounded-md lg:p-16 lg:data-[state=closed]:animate-scale-out lg:data-[state=open]:animate-scale-in dark:bg-gray-900">
        <div className="absolute left-1/2 top-0 z-[1] flex h-14 w-48 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-emerald-500 lg:left-0 lg:top-20 lg:h-48 lg:w-14 lg:translate-y-0">
          <FaGear className="size-6 text-emerald-700" />
        </div>

        <form key={key} action={handleSave} className="flex h-full flex-col">
          <Dialog.Close
            aria-label="close settings"
            className="absolute right-4 top-4 cursor-pointer rounded-full"
          >
            <FaTimes size={16} />
          </Dialog.Close>

          <Dialog.Title className="mb-4 text-lg font-medium uppercase">
            Settings
          </Dialog.Title>

          <Dialog.Description className="sr-only">
            Configure your settings
          </Dialog.Description>

          <div className="flex flex-col gap-7">
            <div>
              <Input
                name="fps"
                type="number"
                label="Max FPS"
                defaultValue={fps}
              />
            </div>

            <div>
              <Input
                type="number"
                name="height"
                label="Height"
                defaultValue={height}
              />
            </div>

            <div>
              <Input
                type="number"
                name="mpdecimate"
                label="MPDecimate"
                defaultValue={mpdecimate}
              />
            </div>
          </div>

          <div className="bottom-4 mt-14 flex justify-end gap-4 lg:mb-0 lg:mt-auto">
            <Button type="button" onClick={handleReset}>
              Reset
            </Button>

            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

const parseSafeNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined; // Handle empty fields
  }

  const parsedValue = Number(value);

  return isNaN(parsedValue) ? undefined : parsedValue; // Return undefined if invalid
};

export default Settings;
