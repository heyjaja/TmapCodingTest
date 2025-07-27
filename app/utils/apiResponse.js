/**
 * 성공 응답
 * @param {object} res - Express res 객체
 * @param {object} data - 데이터(객체, 배열 등)
 * @param {string} [message] - (선택) 성공 메시지
 * @param {number} [status=200] - HTTP status code (기본 200)
 */
exports.success = (res, data = null, message = '요청이 성공했습니다.', status = 200) => {
    res.status(status).json({
        success: true,
        data: data,
        message: message
    });
};

/**
 * 에러 응답
 * @param {object} res - Express res 객체
 * @param {string} message - 에러 메시지
 * @param {number} [status=500] - HTTP status code (기본 500)
 */
exports.errorResponse = (res, message = '알 수 없는 오류가 발생했습니다.', status = 500) => {
    res.status(status).json({
        success: false,
        message: message
    });
};