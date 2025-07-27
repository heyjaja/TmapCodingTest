class PoiDao {
    // 기존 POI 데이터 모두 삭제 후 새 데이터 삽입
    async replaceAllPoi(poiDataList) {
        return new Promise(async (resolve, reject) => {
            const connection = await psql.getConnection();

            try {
                await connection.query('BEGIN');

                // 기존 데이터 삭제
                await new Promise((resolve, reject) => {
                    psql.delete('poi', 'deleteAllPoi', {},
                        (result) => {
                            resolve(result);
                        },
                        (err) => reject(err)
                    );
                });

                // 새 데이터 삽입
                let insertedCount = 0;
                for (const poiData of poiDataList) {
                    await new Promise((resolve, reject) => {
                        psql.insert('poi', 'insertPoi', poiData,
                            (result) => {
                                insertedCount += result;
                                resolve(result);
                            },
                            (err) => reject(err)
                        );
                    });
                }

                await connection.query('COMMIT');
                console.log(`${insertedCount}개의 POI 데이터가 성공적으로 저장되었습니다.`);
                resolve(insertedCount);

            } catch (error) {
                await connection.query('ROLLBACK');
                console.error('POI 데이터 저장 중 오류 발생:', error);
                reject(error);
            } finally {
                connection.release();
            }
        });
    }

    // 모든 POI 데이터 조회
    getAllPoi() {
        return new Promise((resolve, reject) => {
            psql.select('poi', 'selectAllPoi', {},
                (result) => resolve(result),
                (err) => reject(err)
            );
        });
    }
}

module.exports = new PoiDao();
