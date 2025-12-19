import { DAY_KEYFRAME, NIGHT_KEYFRAME } from "@/lib/constants";
import { createWithEqualityFn as create } from "zustand/traditional";

export type Keyframe = {
  ambientLight: {
    color: string;
    intensity: number;
  };

  directionalLight: {
    color: string;
    intensity: number;
  };

  clouds: {
    brightness: number;
  };

  mountains: {
    brightness: number;
  };

  sky: {
    color: string;
  };

  tent: {
    emissiveIntensity: number;
  };

  commets: {
    enabled: boolean;
  }
};

type KeyframeStore = {
  keyframes: Keyframe[];

  frame: Keyframe;
  setFrame: (frame: Keyframe) => void;
};

export const useKeyframeStore = create<KeyframeStore>()((set) => ({
  keyframes: [DAY_KEYFRAME, NIGHT_KEYFRAME],
  frame: DAY_KEYFRAME,

  setFrame: (frame: Keyframe) => set(() => ({ frame })),
}));
