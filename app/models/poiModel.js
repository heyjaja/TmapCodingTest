let baseModel = require('./baseModel');

const POI = {
    poiId: null,
    title: null,
    latitude: null,
    longitude: null
};

// 새 POI 모델 생성
exports.newModel = (opt) => {
    return baseModel.extend(POI, opt);
};

// JSON에서 POI 데이터 추출 (XSS 필터링 포함)
exports.fromJson = (jsonData) => {
    return baseModel.extend(POI, jsonData);
};

// POI 데이터 검증
exports.validate = (poiData) => {
    const errors = [];

    // title 검증
    if (!poiData.title || typeof poiData.title !== 'string' || poiData.title.trim().length === 0) {
        errors.push('title은 필수이며 빈 문자열일 수 없습니다');
    }

    // latitude 검증
    const lat = parseFloat(poiData.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('latitude는 -90 ~ 90 사이의 숫자여야 합니다');
    }

    // longitude 검증
    const lng = parseFloat(poiData.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('longitude는 -180 ~ 180 사이의 숫자여야 합니다');
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        data: errors.length === 0 ? {
            title: poiData.title.trim(),
            latitude: lat,
            longitude: lng
        } : null
    };
};