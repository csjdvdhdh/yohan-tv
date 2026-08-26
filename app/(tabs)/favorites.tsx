import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { MediaCard } from "@/components/media-card";
import { ScreenContainer } from "@/components/screen-container";
import { loadFavorites, saveFavorites } from "@/lib/favorites";
import type { MediaItem } from "@/lib/akwam-api";

export default function FavoritesScreen() {
  const [items, setItems] = useState<MediaItem[]>([]);
  useFocusEffect(useCallback(() => { loadFavorites().then(setItems); }, []));
  const remove = async (item: MediaItem) => { const next = items.filter((entry) => entry.id !== item.id); setItems(next); await saveFavorites(next); };
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><View className="py-5"><Text className="text-right text-3xl font-black text-foreground">المفضلة</Text><Text className="mt-1 text-right text-sm text-muted">محفوظة على جهازك فقط</Text></View><FlatList data={items} numColumns={2} keyExtractor={(item) => item.id} columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }} renderItem={({ item }) => <MediaCard item={item} isFavorite onToggleFavorite={() => remove(item)} onPress={() => router.push({ pathname: "/details", params: { url: item.href } } as any)} />} ListEmptyComponent={<View className="mt-24 items-center"><Text className="text-center text-lg font-bold text-foreground">لم تحفظ أي محتوى بعد</Text><Text className="mt-2 text-center text-muted">اضغط على القلب في أي بطاقة لإضافتها هنا.</Text></View>} /></ScreenContainer>;
}
