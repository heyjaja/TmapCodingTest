## POI Database Schema
```sql
CREATE TABLE tb_poi (
    poi_id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);
```

## API
- POI 엑셀 파일 업로드
  - POST `/api/poi/import`
- POI 목록 조회
  - GET `/api/poi`

## 실행
1. .env 생성
2. `TMAP_API_KEY` 추가
3. DB 및 사용자 생성
4. table 생성
3. `npm start`