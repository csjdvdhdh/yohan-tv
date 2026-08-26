import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MediaItem } from "./akwam-api";

const FAVORITES_KEY = "yohan-tv-favorites-v1";

export async function loadFavorites(): Promise<MediaItem[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MediaItem[];
  } catch {
    return [];
  }
}

export async function saveFavorites(items: MediaItem[]) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}
