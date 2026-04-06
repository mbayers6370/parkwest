export const DEFAULT_PROPERTIES = [
  { key: "580", name: "580" },
  { key: "bicycle", name: "Bicycle" },
  { key: "lodi", name: "Lodi" },
  { key: "manteca", name: "Manteca" },
  { key: "lotus", name: "Lotus" },
  { key: "cordova", name: "Cordova" },
] as const;

export type PropertyKey = (typeof DEFAULT_PROPERTIES)[number]["key"];

export function findDefaultPropertyByKey(propertyKey: string) {
  const normalizedKey = propertyKey.trim().toLowerCase();
  return DEFAULT_PROPERTIES.find((property) => property.key === normalizedKey) ?? null;
}

