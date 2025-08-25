import { useEffect } from "react";

type UseAmbientSoundProperties = {
    // Default to true
    enabled?: boolean;

    // Volume default to .5
    volume?: number;
}

export const useAmbientSound = (src: string, { enabled = true, volume = 0.5 }: UseAmbientSoundProperties = {}) => {
  // Play an ambient sound
  return useEffect(() => {
    const audio = new Audio(src);

    audio.loop = true;
    audio.volume = volume;

    let interval: ReturnType<typeof setInterval> | undefined = undefined;

    const onVisibility = () => {
      // If the user has disabled the sound, pause the audio
      if (!enabled) {
        audio.pause();
        return;
      }

      // If the page is hidden, pause the audio
      if (document.hidden) {
        audio.pause();
        return;
      }

      // If the audio is paused and the user has interacted with the page, start
      if (audio.paused && navigator.userActivation.hasBeenActive) {
        audio.play();
        return;
      }

      // Check every seconds it the user has interacted with the page to start the audio
      if (!navigator.userActivation.hasBeenActive) {
        interval = setInterval(() => {
          if (document.hidden) {
            return;
          }

          if (!navigator.userActivation.hasBeenActive) {
            return;
          }

          audio.play();

          clearInterval(interval);
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    // Run once on start to trigger the interval
    onVisibility();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);

      audio.pause();

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [enabled, src, volume]);


}