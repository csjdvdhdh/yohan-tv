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



export type PlaybackSource = { url: string; label: string };



function decode(value: string) {
  
  return value.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
  
}



function text(value: string) { return decode(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()); }

function absoluteUrl(value: string) { if (!value) return ""; if (value.startsWith("//")) return `https:${value}`; if (value.startsWith("http")) return value; return `${AKWAM_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`; }

function qualityLabel(value: string, index: number) { return decode(value).match(/(?:2160|1440|1080|720|480|360)p/i)?.[0]?.toUpperCase() ?? `مصدر ${index + 1}`; }



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



function kindFromHref(href: string): MediaItem["kind"] { if (href.includes("/series/")) return "series"; if (href.includes("/shows/")) return "show"; if (href.includes("/mix/")) return "mix"; return "movie"; }



function parseCards(html: string): MediaItem[] {
  
  const items: MediaItem[] = [];
  
  const cardPattern = /<a[^>]+href=["']([^"']+\/(?:movie|series|shows|mix)\/[^"']+)["'][^>]*>[\s\S]{0,1800}?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]{0,1200}?<\/a>/gi;
  
  let match: RegExpExecArray | null;
  
  while ((match = cardPattern.exec(html)) && items.length < 40) {
    
    const href = absoluteUrl(match[1]); const poster = absoluteUrl(match[2]); const id = href.match(/\/(?:movie|series|shows|mix)\/(\d+)/)?.[1] ?? href;
    
    const tit










































