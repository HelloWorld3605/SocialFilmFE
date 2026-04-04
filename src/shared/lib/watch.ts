export function buildWatchUrl(
  movieSlug: string,
  serverIndex?: number,
  episodeIndex?: number,
  historyId?: number,
) {
  const searchParams = new URLSearchParams();

  if (typeof serverIndex === "number") {
    searchParams.set("server", String(serverIndex));
  }

  if (typeof episodeIndex === "number") {
    searchParams.set("episode", String(episodeIndex));
  }

  if (typeof historyId === "number") {
    searchParams.set("historyId", String(historyId));
  }

  const query = searchParams.toString();
  return query ? `/movie/${movieSlug}/watch?${query}` : `/movie/${movieSlug}/watch`;
}
