import { create } from "zustand";
import { persist } from "zustand/middleware";

type NonFunctionKeys<T> = Exclude<
  {
    [K in keyof T]: T[K] extends Function ? never : K;
  }[keyof T],
  undefined
>;

type SettingsState = {
  fps?: number;
  height?: number;
  mpdecimate?: number;
  reset: () => void;
  updateSettings: (settings: SettingsWithoutFunctions) => void;
};

type SettingsWithoutFunctions = Pick<
  SettingsState,
  NonFunctionKeys<SettingsState>
>;

const initialSettings = {
  fps: 50,
  mpdecimate: 3,
  height: undefined,
} satisfies SettingsWithoutFunctions;

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialSettings,
      reset: () => set(initialSettings),
      updateSettings: (settings) => set(settings),
    }),
    {
      name: "settings",
    },
  ),
);

export default useSettingsStore;
