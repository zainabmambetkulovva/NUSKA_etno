/**
 * Hints that the device is modest (two cores or fewer, 2 GB of memory or less,
 * data saver on):
 * heavy WebGL scenes are replaced by their light picture there, so pages
 * scroll smoothly. Browsers that do not tell are treated as capable.
 */
export function lowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return (
    (nav.hardwareConcurrency ?? 8) <= 2 ||
    (nav.deviceMemory ?? 8) <= 2 ||
    nav.connection?.saveData === true
  );
}

export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * The WebGL clouds over the home picture cost the most of all the effects
 * (pages stuttered while scrolling); the light CSS clouds are shown instead.
 * NEXT_PUBLIC_HERO_WEBGL=on brings the WebGL scene back on capable desktops.
 */
export const heroWebGLEnabled = process.env.NEXT_PUBLIC_HERO_WEBGL === 'on';
