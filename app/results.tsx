import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MediaCard } from "@/components/media-card";
import { ScreenContainer } from "@/components/screen-container";
import { searchMedia, type MediaItem } from "@/lib/akwam-api";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (params.q) searchMedia(params.q).then(setItems).finally(() => setLoading(false)); else setLoading(false); }, [params.q]);
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><View className="flex-row-reverse items-center justify-between py-5"><Text onPress={() => router.back()} className="text-primary">رجوع</Text><Text className="text-2xl font-black text-foreground">نتائج البحث</Text></View>{loading ? <ActivityIndicator color="#A78BFA" size="large" /> : <FlatList data={items} numColumns={2} keyExtractor={(item) => item.id} columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }} renderItem={({ item }) => <MediaCard item={item} isFavorite={false} onToggleFavorite={() => {}} onPress={() => router.push({ pathname: "/details", params: { url: item.href } } as any)} />} ListEmptyComponent={<Text className="mt-16 text-center text-muted">لا توجد نتائج. جرّب كلمات أخرى.</Text>} />}</ScreenContainer>;
}
