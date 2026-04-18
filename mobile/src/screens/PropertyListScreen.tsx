import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { searchProperties, fetchAllRegions, type Property, type SearchParams } from "../services/api";

const TRADE_TYPES = ["매매", "전세", "월세"];

export default function PropertyListScreen() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<Record<string, string[]>>({});
  const [sido, setSido] = useState("서울특별시");
  const [sigungu, setSigungu] = useState("강남구");
  const [tradeType, setTradeType] = useState("매매");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchAllRegions()
      .then((data) => {
        setRegions(data);
      })
      .catch(() => {
        setRegions({ "서울특별시": ["강남구", "서초구", "송파구"] });
      });
  }, []);

  const sidoList = Object.keys(regions);
  const sigunguList = regions[sido] || [];

  const handleSidoChange = (newSido: string) => {
    setSido(newSido);
    const list = regions[newSido] || [];
    setSigungu(list[0] || "");
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: SearchParams = {
        sido,
        sigungu,
        property_type: "아파트",
        trade_type: tradeType,
        sources: "naver,dabang,r114",
        sort_by: "price_number",
        sort_order: sortOrder,
        page: 1,
      };
      const data = await searchProperties(params);
      setItems(data.items || []);
    } catch {
      Alert.alert("오류", "검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: Property; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIndex}>{index + 1}</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, item.trade_type === "매매" ? styles.badgeSale : styles.badgeRent]}>
          <Text style={styles.badgeText}>{item.trade_type}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.detail}>{item.area}m2 | {item.floor} | {item.region} | {item.source}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 시/도 선택 */}
      <Text style={styles.sectionLabel}>시/도</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
        <View style={styles.filterRow}>
          {sidoList.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, sido === s && styles.chipActive]}
              onPress={() => handleSidoChange(s)}
            >
              <Text style={[styles.chipText, sido === s && styles.chipTextActive]}>
                {s.replace("특별시", "").replace("광역시", "").replace("특별자치시", "").replace("특별자치도", "").replace("도", "") || s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 시/군/구 선택 */}
      <Text style={styles.sectionLabel}>시/군/구</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
        <View style={styles.filterRow}>
          {sigunguList.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, sigungu === g && styles.chipActive]}
              onPress={() => setSigungu(g)}
            >
              <Text style={[styles.chipText, sigungu === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 거래유형 + 정렬 */}
      <View style={styles.filterRow2}>
        {TRADE_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, tradeType === t && styles.chipActive]}
            onPress={() => setTradeType(t)}
          >
            <Text style={[styles.chipText, tradeType === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <Text style={styles.sortText}>가격 {sortOrder === "asc" ? "↑" : "↓"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.searchButtonText}>검색</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>검색 버튼을 눌러 매물을 조회하세요.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  sectionLabel: { fontSize: 12, color: "#6B7280", paddingHorizontal: 12, paddingTop: 8, fontWeight: "600" },
  scrollRow: { maxHeight: 44, marginBottom: 2 },
  filterRow: { flexDirection: "row", flexWrap: "nowrap", paddingHorizontal: 12, paddingTop: 4, gap: 6 },
  filterRow2: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingTop: 4, gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E5E7EB" },
  chipActive: { backgroundColor: "#2563EB" },
  chipText: { fontSize: 13, color: "#374151" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  sortButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#D1D5DB" },
  sortText: { fontSize: 13, color: "#374151" },
  searchButton: { marginHorizontal: 12, marginTop: 10, backgroundColor: "#2563EB", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  searchButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  list: { padding: 12 },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  cardIndex: { fontSize: 12, color: "#9CA3AF", width: 24 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeSale: { backgroundColor: "#FEE2E2" },
  badgeRent: { backgroundColor: "#DBEAFE" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  cardBody: { paddingLeft: 24 },
  price: { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 2 },
  detail: { fontSize: 13, color: "#6B7280" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40, fontSize: 15 },
});
