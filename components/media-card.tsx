import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { MediaItem } from "@/lib/akwam-api";

export function MediaCard({ item, onPress, isFavorite, onToggleFavorite }: { item: MediaItem; onPress: () => void; isFavorite: boolean; onToggleFavorite: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1, width: 148 }]}>
      <View className="overflow-hidden rounded-[20px] bg-surface border border-border">
        <View className="relative h-[210px] bg-[#202633]">
          {item.poster ? <Image source={item.poster} contentFit="cover" transition={180} style={{ width: "100%", height: "100%" }} /> : <View className="flex-1 items-center justify-center"><IconSymbol name="movie" size={40} color="#667085" /></View>}
          <View className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1"><Text className="text-[10px] font-bold text-white">{item.rating ? `★ ${item.rating}` : "جديد"}</Text></View>
          <Pressable onPress={onToggleFavorite} hitSlop={10} style={{ position: "absolute", left: 9, top: 9, backgroundColor: "rgba(0,0,0,.72)", borderRadius: 20, padding: 6 }}><IconSymbol name={isFavorite ? "favorite" : "favorite-border"} size={18} color={isFavorite ? "#F472B6" : "#FFFFFF"} /></Pressable>
        </View>
        <View className="p-3">
          <Text numberOfLines={2} className="min-h-[38px] text-right text-[13px] font-bold leading-[19px] text-foreground">{item.title}</Text>
          <View className="mt-2 flex-row-reverse items-center justify-between"><Text className="text-[11px] text-muted">{item.year || "—"}</Text><Text className="text-[10px] font-semibold text-primary">{item.quality || "HD"}</Text></View>
        </View>
      </View>
    </Pressable>
  );
}
