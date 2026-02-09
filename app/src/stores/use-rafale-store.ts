import { Vector3 } from "three";
import { createWithEqualityFn as create } from "zustand/traditional";

type RafaleStore = {
  // If we need to display the custom cursor
  cursor: boolean;

  // The target position for the camera to look at when focusing on an object
  lookAtTarget: Vector3 | null;

  // The expected fov
  fov: number;

  // The camera position
  position: Vector3;
  offset: Vector3;

  setCursor: (cursor: boolean) => void;
  setLookAtTarget: (target: Vector3 | null) => void;
  setFov: (fov: number | ((fov: number) => number)) => void;
  setPosition: (position: Vector3) => void;
  setOffset: (offset: Vector3) => void;
};

export const useRafaleStore = create<RafaleStore>((set) => ({
  cursor: false,
  lookAtTarget: null,
  fov: 75,
  position: new Vector3(-50, 38.5, 0),
  offset: new Vector3(0, 0, 0),

  setCursor: (cursor) => set({ cursor }),
  setLookAtTarget: (target) => set({ lookAtTarget: target }),
  setFov: (fov) =>
    set((state) => ({ fov: typeof fov === "function" ? fov(state.fov) : fov })),
  setPosition: (position) => set({ position }),
  setOffset: (offset) => set({ offset }),
}));
