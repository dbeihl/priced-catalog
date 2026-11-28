export function scrollToHashTarget(
  hash: string,
  getElementById: (id: string) => { scrollIntoView(): void } | null,
) {
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return;
  }
  if (id) getElementById(id)?.scrollIntoView();
}
