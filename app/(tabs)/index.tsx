import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MediaCard } from "@/components/media-card";
import { ScreenContainer } from "@/components/screen-container";
import { getRecentMedia, searchMedia, type MediaItem } from "@/lib/akwam-api";
import { loadFavorites, saveFavorites } from "@/lib/favorites";

const categories = [
  { label: "أفلام", icon: "movie", query: "" },
  { label: "مسلسلات", icon: "live-tv", query: "" },
  { label: "تلفزيون", icon: "live-tv", query: "" },
  { label: "منوعات", icon: "bookmark", query: "" },
];

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  const loadRecent = useCallback(async () => {
    setError("");
    try { setItems(await getRecentMedia()); } catch { setError("تعذر تحميل المحتوى حاليًا. تحقق من اتصالك وأعد المحاولة."); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadRecent(); loadFavorites().then(setFavorites); }, [loadRecent]);

  const toggleFavorite = async (item: MediaItem) => {
    const next = favoriteIds.has(item.id) ? favorites.filter((entry) => entry.id !== item.id) : [item, ...favorites];
    setFavorites(next); await saveFavorites(next);
  };

  const submitSearch = async () => {
    if (!query.trim()) return loadRecent();
    setLoading(true); setError("");
    try { setItems(await searchMedia(query)); } catch { setError("حدث خطأ أثناء البحث. جرّب اسمًا آخر."); } finally { setLoading(false); }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="px-5">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRecent(); }} tintColor="#A78BFA" />}
        ListHeaderComponent={<>
          <View className="flex-row-reverse items-center justify-between pt-4 pb-5"><View><Text className="text-right text-[13px] font-semibold text-primary">مرحبًا بك في</Text><Text className="mt-1 text-right text-[30px] font-black tracking-tight text-foreground">Yohan TV</Text></View><View className="h-14 w-14 items-center justify-center rounded-[18px] bg-primary/15"><IconSymbol name="movie" size={28} color="#A78BFA" /></View></View>
          <View className="rounded-[26px] bg-[#171B27] p-5"><Text className="text-right text-[22px] font-extrabold leading-8 text-white">شاهد ما تحب،<Text className="text-primary"> بسهولة.</Text></Text><Text className="mt-2 text-right text-[13px] leading-5 text-[#A6AEC0]">ابحث عن فيلمك أو مسلسلك المفضل واستمتع بتجربة مشاهدة بسيطة.</Text><View className="mt-4 flex-row-reverse items-center rounded-2xl bg-[#242A39] px-3"><IconSymbol name="search" size={21} color="#A6AEC0" /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={submitSearch} returnKeyType="search" placeholder="ابحث عن فيلم أو مسلسل..." placeholderTextColor="#8992A6" className="mr-2 flex-1 py-4 text-right text-[14px] text-white" /><Pressable onPress={submitSearch} style={({ pressed }) => [{ backgroundColor: "#8B5CF6", borderRadius: 13, paddingHorizontal: 13, paddingVertical: 9, opacity: pressed ? 0.75 : 1 }]}><Text className="font-bold text-white">بحث</Text></Pressable></View></View>
          <View className="mt-6 flex-row-reverse justify-between">{categories.map((category) => <Pressable key={category.label} onPress={() => category.label === "أفلام" ? router.push("/results" as any) : undefined} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, alignItems: "center", width: 72 }]}><View className="h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-border"><IconSymbol name={category.icon} size={23} color="#A78BFA" /></View><Text className="mt-2 text-[11px] font-semibold text-muted">{category.label}</Text></Pressable>)}</View>
          <View className="mt-8 mb-4 flex-row-reverse items-center justify-between"><Pressable onPress={loadRecent}><Text className="text-[12px] font-bold text-primary">تحديث</Text></Pressable><Text className="text-right text-[20px] font-extrabold text-foreground">أضيف حديثًا</Text></View>
          {error ? <View className="mb-5 rounded-2xl border border-[#69344C] bg-[#321B2A] p-4"><Text className="text-right leading-6 text-[#FFB4C7]">{error}</Text><Pressable onPress={loadRecent} style={{ marginTop: 10 }}><Text className="text-right font-bold text-white">إعادة المحاولة ↻</Text></Pressable></View> : null}
          {loading ? <View className="h-32 items-center justify-center"><ActivityIndicator color="#A78BFA" size="large" /></View> : null}
          {!loading && !error && items.length === 0 ? <View className="h-32 items-center justify-center"><Text className="text-muted">لا توجد نتائج مطابقة.</Text></View> : null}
        </>}
        renderItem={({ item }) => <MediaCard item={item} isFavorite={favoriteIds.has(item.id)} onToggleFavorite={() => toggleFavorite(item)} onPress={() => router.push({ pathname: "/details", params: { url: item.href } } as any)} />}
      />
    </ScreenContainer>
  );
}
