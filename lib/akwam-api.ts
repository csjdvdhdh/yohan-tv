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
  if (value.startsWith("http")) return value;
  return `${AKWAM_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
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
