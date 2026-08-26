export const AKWAM_BASE_URL = "https://ak.sv";

export type MediaItem = {
  id: string;
  title: string;
  href: string;
  poster: string;
  year?: string;
  genres?: string;
  rating?: string;
  quality?: string;
  kind: "movie" | "series" | "show" | "mix";
};

export type MediaDetails = MediaItem & {
  description: string;
  language?: string;
  subtitle?: string;
  duration?: string;
  country?: string;
  imdbUrl?: string;
  watchUrl?: string;
  downloadUrl?: string;
  screenshots: string[];
};

export type PlaybackSource = {
  url: string;
  label: string;
};

function decode(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function text(value: string) {
  return decode(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function absoluteUrl(value: string) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http")) return value;
  return `${AKWAM_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

function qualityLabel(value: string, fallbackIndex: number) {
  const normalized = decode(value);
  const quality = normalized.match(/(?:2160|1440|1080|720|480|360)p/i)?.[0];
  return quality?.toUpperCase() ?? `مصدر ${fallbackIndex + 1}`;
}

export function extractPlaybackSources(html: string): PlaybackSource[] {
  const collected: PlaybackSource[] = [];
  const add = (rawUrl: string, rawLabel = "") => {
    const url = absoluteUrl(decode(rawUrl.trim()));
    if (!url || !/\.(?:m3u8|mp4)(?:[?#]|$)/i.test(url) || collected.some((source) => source.url === url)) return;
    collected.push({ url, label: qualityLabel(rawLabel || url, collected.length) });
  };

  for (const match of html.matchAll(/<(?:source|video)\b[^>]*>/gi)) {
    const tag = match[0];
    const url = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const label = tag.match(/\b(?:label|data-quality|data-resolution|res)=["']([^"']+)["']/i)?.[1] ?? "";
    if (url) add(url, label);
  }

  for (const match of html.matchAll(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]+)?/gi)) add(match[0]);
  return collected.sort((a, b) => (parseInt(b.label, 10) || 0) - (parseInt(a.label, 10) || 0));
}

function kindFromHref(href: string): MediaItem["kind"] {
  if (href.includes("/series/")) return "series";
  if (href.includes("/shows/")) return "show";
  if (href.includes("/mix/")) return "mix";
  return "movie";
}

function parseCards(html: string): MediaItem[] {
  const items: MediaItem[] = [];
  const cardPattern = /<a[^>]+href=["']([^"']+\/(?:movie|series|shows|mix)\/[^"']+)["'][^>]*>[\s\S]{0,1800}?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]{0,1200}?<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(html)) && items.length < 40) {
    const href = absoluteUrl(match[1]);
    const poster = absoluteUrl(match[2]);
    const id = href.match(/\/(?:movie|series|shows|mix)\/(\d+)/)?.[1] ?? href;
    const titleMatch = html.slice(Math.max(0, match.index - 200), Math.min(html.length, match.index + match[0].length + 1200)).match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const nearby = text(titleMatch?.[1] ?? "");
    const title = nearby || decode(href.split("/").pop()?.replace(/-/g, " ") ?? "Yohan TV");
    if (!items.some((item) => item.id === id)) {
      const info = text(match[0]);
      items.push({ id, title, href, poster, kind: kindFromHref(href), year: info.match(/20\d{2}/)?.[0], rating: info.match(/(?:⭐|★)\s*([0-9.]+)/)?.[1], quality: info.match(/(WEB-DL|BluRay|HDTV|CAM)/i)?.[1] });
    }
  }
  return items;
}

export async function searchMedia(query: string) {
  const url = `${AKWAM_BASE_URL}/search?q=${encodeURIComponent(query.trim())}`;
  const response = await fetch(url, { headers: { Accept: "text/html,application/xhtml+xml" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return parseCards(await response.text());
}

export async function getRecentMedia() {
  const response = await fetch(`${AKWAM_BASE_URL}/recent`, { headers: { Accept: "text/html,application/xhtml+xml" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return parseCards(await response.text());
}

export async function getPlaybackSources(watchUrl: string): Promise<PlaybackSource[]> {
  const response = await fetch(watchUrl, { headers: { Accept: "text/html,application/xhtml+xml" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return extractPlaybackSources(await response.text());
}

export async function getMediaDetails(url: string): Promise<MediaDetails> {
  const response = await fetch(url, { headers: { Accept: "text/html,application/xhtml+xml" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const html = await response.text();
  const title = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const poster = absoluteUrl(html.match(/<main[\s\S]{0,1800}?<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? "");
  const description = text(html.match(/قصة الفيلم[\s\S]{0,1500}?<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? html.match(/<h2[^>]*>[^<]*(?:فيلم|مسلسل)[^<]*<\/h2>[\s\S]{0,1200}?<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
  const watchPath = html.match(/href=["'](https?:\/\/[^"']+\/watch\/[^"']+|\/watch\/[^"']+)["']/i)?.[1];
  const downloadPath = html.match(/href=["'](https?:\/\/[^"']+\/download\/[^"']+|\/download\/[^"']+)["']/i)?.[1];
  const imdbUrl = html.match(/href=["'](https?:\/\/www\.imdb\.com\/title\/[^"']+)["']/i)?.[1];
  const screenshots = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)].map((match) => absoluteUrl(match[1])).filter((item) => item !== poster).slice(0, 8);
  const infoText = text(html);
  const href = url;
  return {
    id: href.match(/\/(?:movie|series|shows|mix)\/(\d+)/)?.[1] ?? href,
    title: title || "محتوى Yohan TV",
    href,
    poster,
    kind: kindFromHref(href),
    description,
    year: infoText.match(/20\d{2}/)?.[0],
    rating: infoText.match(/(?:10\s*\/\s*)?([0-9]\.[0-9])/i)?.[1],
    quality: infoText.match(/(WEB-DL|BluRay|HDTV|CAM|720p|1080p)/i)?.[1],
    language: infoText.match(/اللغة\s*:\s*([^\n|]+)/)?.[1]?.trim(),
    subtitle: infoText.match(/الترجمة\s*:\s*([^\n|]+)/)?.[1]?.trim(),
    duration: infoText.match(/مدة[^:]*:\s*([^\n|]+)/)?.[1]?.trim(),
    country: infoText.match(/انتاج\s*:\s*([^\n|]+)/)?.[1]?.trim(),
    imdbUrl,
    watchUrl: watchPath ? absoluteUrl(watchPath) : undefined,
    downloadUrl: downloadPath ? absoluteUrl(downloadPath) : undefined,
    screenshots,
  };
}
