export function buildWatchUrl(
  movieSlug: string,
  serverIndex?: number,
  episodeIndex?: number,
) {
  const searchParams = new URLSearchParams();

  if (typeof serverIndex === "number") {
    searchParams.set("server", String(serverIndex));
  }

  if (typeof episodeIndex === "number") {
    searchParams.set("episode", String(episodeIndex));
  }

  const query = searchParams.toString();
  return query ? `/movie/${movieSlug}/watch?${query}` : `/movie/${movieSlug}/watch`;
}
