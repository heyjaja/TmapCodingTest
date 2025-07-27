const fs = require('fs');
const XLSX = require('xlsx');
const poiDao = require('../dao/poiDao');
const poiModel = require('../models/poiModel');
const { success, error, errorResponse } = require("../utils/apiResponse");

exports.importPoi = async (req, res) => {
    const filePath = req.file?.path;
    try {
        if (!req.file) {
            return errorResponse(res, '엑셀 파일이 업로드되지 않았습니다.', 400);
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData.length) {
            _cleanupTempFile(filePath);
            return errorResponse(res, '엑셀 파일에 데이터가 없습니다.', 400);
        }

        // 유효성 검사 및 변환
        const { validData, errors } = _processExcelDataWithModel(jsonData);

        if (!validData.length) {
            _cleanupTempFile(filePath);
            return errorResponse(res, '유효한 데이터가 없습니다.', 400);
        }

        // DB에 새로 저장
        const insertedCount = await poiDao.replaceAllPoi(validData);

        // 응답 데이터
        const data = {
            totalRows: jsonData.length,
            validRows: validData.length,
            insertedRows: insertedCount,
            errorRows: errors.length,
        };

        _cleanupTempFile(filePath);

        return success(res, data, 'POI 데이터 import 성공', 201);

    } catch (e) {
        console.error('POI import 오류:', e);
        _cleanupTempFile(filePath);

        if (e.message.includes('Invalid file format')) {
            return errorResponse(res, '파일 형식이 올바르지 않습니다.', 400);
        }
        return errorResponse(res, '서버 오류: ' + e.message, 500);
    }
};

// 유효성 검사
function _processExcelDataWithModel(jsonData) {
    const validData = [];
    const errors = [];
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
            const poiData = poiModel.fromJson(row);
            const validation = poiModel.validate(poiData);
            if (validation.isValid) {
                validData.push(validation.data);
            } else {
                errors.push({
                    row: i + 1,
                    data: row,
                    errors: validation.errors
                });
            }
        } catch (err) {
            errors.push({
                row: i + 1,
                data: row,
                errors: [(err.message || "알 수 없는 오류")]
            });
        }
    }
    return { validData, errors };
}

function _cleanupTempFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log('파일 삭제 완료:', filePath);
        } catch (e) {
            console.error('파일 삭제 실패:', e);
        }
    }
}

// POI 리스트
exports.getPoiList = async (req, res) => {
    try {
        const list = await poiDao.getAllPoi();
        return success(res, list, 'POI 리스트 로딩 성공', 200);
    } catch (e) {
        return errorResponse(res, 'POI 리스트 로딩 오류: ' + e.message, 500);
    }
};