// MongoDB 초기화 스크립트
db = db.getSiblingDB("personalfinance");

db.createUser({
  user: "pfuser",
  pwd: "pfpass123",
  roles: [{ role: "readWrite", db: "personalfinance" }],
});

// 컬렉션 및 인덱스 생성
db.createCollection("properties");
db.properties.createIndex({ region: 1 });
db.properties.createIndex({ property_type: 1 });
db.properties.createIndex({ trade_type: 1 });
db.properties.createIndex({ price_number: 1 });
db.properties.createIndex({ area: 1 });
db.properties.createIndex({ created_at: -1 });

print("PersonalFinance DB 초기화 완료");
