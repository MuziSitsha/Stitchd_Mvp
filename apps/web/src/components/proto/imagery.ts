// Ported exactly from stitchd-v9.jsx lines 481, 498-499.
export const hash = (str: string): number => {
  let n = 0;
  for (let i = 0; i < str.length; i++) n = (n * 31 + str.charCodeAt(i)) >>> 0;
  return n;
};

export const SKIN = ["#8D5524", "#A56A3E", "#C68642", "#E0AC69", "#6B4423", "#3D2817"];
export const HAIR = ["#1A1310", "#2B1B12", "#3D2817", "#0F0D0C", "#4A3520"];
