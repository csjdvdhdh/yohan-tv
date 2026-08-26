import { useEffect, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";
import { getPlaybackSources, type PlaybackSource } from "@/lib/akwam-api";

export default function PlayerScreen() {
  const { watchUrl, title = "Yohan TV", poster } = useLocalSearchParams<{ watchUrl: string; title?: string; poster?: string }>();
  const [sources, setSources] = useState<PlaybackSource[]>([]);
  const [selected, setSelected] = useState<PlaybackSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceError, setSourceError] = useState("");
  const player = useVideoPlayer(null);
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const selectedUrl = selected?.url;

  useEffect(() => {
    if (!watchUrl) return;
    let active = true;
    setLoading(true);
    getPlaybackSources(watchUrl)
      .then((nextSources) => {
        if (!active) return;
        setSources(nextSources);
        setSelected(nextSources[0] ?? null);
        if (!nextSources.length) setSourceError("لم يعثر التطبيق على رابط فيديو مباشر لهذا المحتوى.");
      })
      .catch(() => active && setSourceError("تعذر جلب مصدر المشاهدة. تحقق من اتصال الإنترنت ثم حاول مرة أخرى."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [watchUrl]);

  useEffect(() => {
    if (!selectedUrl) return;
    let active = true;
    setSourceError("");
    player.replaceAsync({ uri: selectedUrl, metadata: { title } })
      .then(() => active && player.play())
      .catch(() => active && setSourceError("تعذر تشغيل هذا المصدر داخل المشغّل."));
    return () => {
      active = false;
      player.pause();
    };
  }, [player, selectedUrl, title]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 bg-[#080A10]">
        <ImageBackground source={poster ? { uri: poster } : undefined} style={{ height: 185 }} resizeMode="cover">
          <View style={{ flex: 1, backgroundColor: "rgba(8,10,16,.76)" }}>
            <View className="flex-row-reverse items-center justify-between px-5 pt-3">
              <Pressable onPress={() => router.back()} style={({ pressed }) => [{ padding: 9, borderRadius: 99, backgroundColor: "rgba(255,255,255,.13)", opacity: pressed ? 0.7 : 1 }]}>
                <IconSymbol name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <Text className="max-w-[250px] text-right text-base font-black text-white" numberOfLines={2}>{title}</Text>
            </View>
            <Text className="mt-auto px-5 pb-5 text-right text-xs text-[#C4B5FD]">مشاهدة داخل Yohan TV</Text>
          </View>
        </ImageBackground>

        <View className="mx-4 -mt-5 overflow-hidden rounded-2xl border border-[#30384B] bg-black" style={{ aspectRatio: 16 / 9 }}>
          {selected ? <VideoView player={player} style={{ flex: 1 }} nativeControls allowsFullscreen allowsPictureInPicture contentFit="contain" surfaceType="textureView" /> : null}
          {(loading || status === "loading") ? <View className="absolute inset-0 items-center justify-center bg-black/60"><ActivityIndicator size="large" color="#A78BFA" /><Text className="mt-3 text-sm text-white">جارٍ تجهيز المشغّل…</Text></View> : null}
          {sourceError ? <View className="absolute inset-0 items-center justify-center px-6"><Text className="text-center text-sm leading-6 text-white">{sourceError}</Text></View> : null}
        </View>

        {sources.length > 1 ? <View className="mt-5 px-5"><Text className="mb-3 text-right text-sm font-bold text-foreground">الجودة المتاحة</Text><View className="flex-row-reverse flex-wrap gap-2">{sources.map((source) => <Pressable key={source.url} onPress={() => setSelected(source)} style={({ pressed }) => [{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: selected?.url === source.url ? "#8B5CF6" : "#202633", opacity: pressed ? 0.75 : 1 }]}><Text className="font-bold text-white">{source.label}</Text></Pressable>)}</View></View> : null}

        <View className="mt-6 px-5"><Pressable disabled={!selected} onPress={() => isPlaying ? player.pause() : player.play()} style={({ pressed }) => [{ alignItems: "center", borderRadius: 16, paddingVertical: 14, backgroundColor: selected ? "#8B5CF6" : "#30384B", opacity: pressed ? 0.8 : 1 }]}><View className="flex-row-reverse items-center gap-2"><IconSymbol name={isPlaying ? "pause" : "play-arrow"} size={20} color="#FFFFFF" /><Text className="font-extrabold text-white">{isPlaying ? "إيقاف مؤقت" : "تشغيل"}</Text></View></Pressable><Text className="mt-3 text-center text-xs text-muted">اختر جودة أخرى إذا لم يبدأ الفيديو.</Text></View>
      </View>
    </ScreenContainer>
  );
}
