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
  - POST `/api/poi/upload`
- POI 목록 조회
  - GET `/api/poi`