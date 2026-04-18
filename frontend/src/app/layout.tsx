import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PersonalFinance - 부동산 정보",
  description: "부동산 매물 검색 및 관리 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600">PersonalFinance</h1>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-gray-700 hover:text-blue-600">홈</a>
              <a href="/realestate" className="text-gray-700 hover:text-blue-600">부동산 검색</a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
