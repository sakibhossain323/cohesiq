export function getAvatarInitials(name: string | null | undefined, fallback = "CR") {
  const words = (name ?? "")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const latinInitials = words
    .map(word => word.match(/[A-Za-z0-9]/)?.[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return latinInitials || fallback;
}
