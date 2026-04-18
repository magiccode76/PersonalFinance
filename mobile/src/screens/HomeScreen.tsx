import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>부동산 정보 한눈에</Text>
      <Text style={styles.subtitle}>
        네이버 부동산에서 매물을 검색하고{"\n"}정렬하여 확인하세요.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("PropertyList")}
      >
        <Text style={styles.buttonText}>부동산 검색 시작</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#F9FAFB" },
  title: { fontSize: 28, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center", marginBottom: 32, lineHeight: 24 },
  button: { backgroundColor: "#2563EB", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
