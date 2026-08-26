import { useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { getMediaDetails, type MediaDetails } from "@/lib/akwam-api";

export default function DetailsScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [item, setItem] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (url) getMediaDetails(url).then(setItem).catch(() => setItem(null)).finally(() => setLoading(false)); }, [url]);
  const openWatch = () => {
    if (!item?.watchUrl) return;
    router.push({ pathname: "/player", params: { watchUrl: item.watchUrl, title: item.title, poster: item.poster } } as never);
  };
  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color="#A78BFA" size="large" /></ScreenContainer>;
  if (!item) return <ScreenContainer className="items-center justify-center px-6"><Text className="text-center text-foreground">تعذر تحميل تفاصيل المحتوى.</Text><Pressable onPress={() => router.back()} className="mt-5"><Text className="font-bold text-primary">العودة</Text></Pressable></ScreenContainer>;
  return <ScreenContainer edges={["top", "left", "right"]}><ScrollView contentContainerStyle={{ paddingBottom: 40 }}><View className="relative h-[390px] overflow-hidden"><ImageBackground source={{ uri: item.poster }} resizeMode="cover" style={{ flex: 1 }}><View style={{ flex: 1, backgroundColor: "rgba(11,13,18,.58)" }}><Pressable onPress={() => router.back()} hitSlop={12} style={{ margin: 20, alignSelf: "flex-end" }}><IconSymbol name="arrow-back" size={26} color="#FFFFFF" /></Pressable><View className="mt-auto px-5 pb-6"><Text className="text-right text-[28px] font-black leading-9 text-white">{item.title}</Text><View className="mt-3 flex-row-reverse items-center gap-3"><Text className="text-white">{item.year || "—"}</Text><Text className="text-[#FBBF24]">★ {item.rating || "—"}</Text><Text className="rounded-full bg-white/15 px-2 py-1 text-[11px] text-white">{item.quality || "HD"}</Text></View></View></View></ImageBackground></View><View className="px-5 pt-5"><View className="flex-row-reverse gap-3"><Pressable onPress={openWatch} style={({ pressed }) => [{ flex: 1, backgroundColor: "#8B5CF6", borderRadius: 16, paddingVertical: 15, alignItems: "center", opacity: pressed ? .8 : 1 }]}><View className="flex-row-reverse items-center gap-2"><IconSymbol name="play-arrow" size={20} color="#FFFFFF" /><Text className="font-extrabold text-white">مشاهدة الآن</Text></View></Pressable>{item.downloadUrl ? <Pressable onPress={() => WebBrowser.openBrowserAsync(item.downloadUrl!)} style={{ width: 54, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#202633" }}><IconSymbol name="download" size={22} color="#A78BFA" /></Pressable> : null}</View><View className="mt-6 flex-row-reverse flex-wrap gap-2">{[item.language && `اللغة: ${item.language}`, item.subtitle && `ترجمة: ${item.subtitle}`, item.duration, item.country].filter(Boolean).map((label) => <View key={label} className="rounded-xl border border-border bg-surface px-3 py-2"><Text className="text-right text-[11px] text-muted">{label}</Text></View>)}</View><Text className="mt-8 text-right text-xl font-black text-foreground">قصة المحتوى</Text><Text className="mt-3 text-right text-[15px] leading-7 text-muted">{item.description || "لا يتوفر وصف لهذا المحتوى حاليًا."}</Text></View></ScrollView></ScreenContainer>;
}
