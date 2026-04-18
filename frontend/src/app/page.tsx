import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          부동산 정보 한눈에
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          네이버 부동산에서 매물을 검색하고, 정렬하여 다운로드하세요.
        </p>
        <Link
          href="/realestate"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
        >
          부동산 검색 시작
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="font-bold text-lg mb-2">매물 검색</h3>
          <p className="text-gray-600 text-sm">
            지역, 매물유형, 거래유형별로 네이버 부동산 매물을 실시간 검색합니다.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="font-bold text-lg mb-2">정렬 및 필터</h3>
          <p className="text-gray-600 text-sm">
            가격순, 면적순 등 원하는 기준으로 정렬하고 조건별 필터링이 가능합니다.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="font-bold text-lg mb-2">다운로드</h3>
          <p className="text-gray-600 text-sm">
            검색/정렬 결과를 Excel 또는 CSV 파일로 내려받을 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
