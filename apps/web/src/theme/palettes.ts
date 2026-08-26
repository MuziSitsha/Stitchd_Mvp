// Ported exactly from stitchd-v9.jsx lines 391-405 — the 9 normative palettes
// (STITCHD-SRS-SDS.md §B16). Index order matters: buildTheme() reads by index.
export interface Palette {
  name: string;
  cols: [string, string, string, string, string];
  img: string;
  a: string;
  al: string;
  g: string;
  gl: string;
  kw: string;
  trad?: boolean;
}

export const PALETTES: Palette[] = [
  { name: "Blush Romance", cols: ["#E8C7C8", "#C98B95", "#8A5A66", "#F3E9E4", "#D4A94E"], img: "1522673607200-164d1b6ce486", a: "#D98A9A", al: "#A8546A", g: "#D4A94E", gl: "#9C7522", kw: "wedding,blush" },
  { name: "Emerald & Gold", cols: ["#1E6E52", "#3DA57A", "#0E3B2C", "#E9E2D0", "#D4A94E"], img: "1519741497674-611481863552", a: "#3DA57A", al: "#1B6B4E", g: "#D4A94E", gl: "#8F6A18", kw: "wedding,green" },
  { name: "Midnight Violet", cols: ["#4B3F8F", "#8B7AF5", "#221B3A", "#E7E3F5", "#D4A94E"], img: "1470229722913-7c0e2dbbafd3", a: "#8B7AF5", al: "#6C4BE0", g: "#D4A94E", gl: "#F2C14E", kw: "wedding,night" },
  { name: "Terracotta Sunset", cols: ["#B5613C", "#E0824F", "#7A3B22", "#F2E4D6", "#C9A24B"], img: "1464366400600-7168b8af9bc3", a: "#E0824F", al: "#A9502A", g: "#C9A24B", gl: "#8A6A24", kw: "wedding,sunset" },
  { name: "Sage Garden", cols: ["#7A8A5A", "#A7B588", "#4E5B3A", "#EDEFE3", "#C9A24B"], img: "1510081887155-56fe96846e71", a: "#A7B588", al: "#56663A", g: "#C9A24B", gl: "#7E6220", kw: "wedding,garden" },
  { name: "Royal Navy", cols: ["#25365A", "#43618E", "#141E33", "#E4E8EF", "#D4A94E"], img: "1519225421980-715cb0215aed", a: "#6C93CC", al: "#25365A", g: "#D4A94E", gl: "#8F6A18", kw: "wedding,blue" },
  { name: "Dusty Rose", cols: ["#C48B94", "#E3B7BE", "#8A5560", "#F4E9EB", "#B99B54"], img: "1487530811176-3780de880c2d", a: "#DDA0A9", al: "#9C5464", g: "#B99B54", gl: "#7E6524", kw: "wedding,roses" },
  { name: "Golden Hour", cols: ["#D99B4C", "#F0C378", "#9A6522", "#F6ECD9", "#8A6A2A"], img: "1519167758481-83f550bb49b3", a: "#F0C378", al: "#8A5E17", g: "#D99B4C", gl: "#7A5518", kw: "wedding,golden" },
  { name: "Traditional African", cols: ["#C1272D", "#E8A020", "#1E7A3C", "#F3E7CE", "#111111"], img: "1521805103424-d8f8430e8933", a: "#E8A020", al: "#B5411F", g: "#C1272D", gl: "#8A1E22", kw: "wedding,traditional,african", trad: true },
];

export const PALETTE_ROLES: Record<string, string> = {
  "Flower Specialist": "floral & foliage scheme",
  "Décor Supplier": "draping, linen & lighting",
  Cake: "icing & sugar-flower tones",
  "Tent & Weather": "marquee lining & drapes",
  Tailor: "suiting accents & pocket squares",
};

export const SWATCH_USE = ["Primary blooms", "Secondary blooms", "Foliage & depth", "Linen & stationery", "Metallics & candlelight"];
