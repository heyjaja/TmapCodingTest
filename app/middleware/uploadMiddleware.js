const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { errorResponse } = require("../utils/apiResponse");

// 업로드 디렉토리 생성
const createUploadDir = () => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, createUploadDir());
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 한글파일명 대응 
        cb(null, `${timestamp}-${originalName}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.xlsx', '.xls'];
    if (!allowedExts.includes(ext)) {
        const err = new Error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
        err.code = 'INVALID_FILE_TYPE';
        return cb(err);
    }
    cb(null, true);
};

const uploadConfig = {
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    }
};

const excelUpload = multer(uploadConfig);

// 에러 처리
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return errorResponse(res, '파일 크기가 너무 큽니다. (최대 10MB)', 400);
            case 'LIMIT_FILE_COUNT':
                return errorResponse(res, '파일은 하나만 업로드 가능합니다.', 400);
            case 'LIMIT_UNEXPECTED_FILE':
                return errorResponse(res, '예상하지 못한 파일 필드입니다.', 400);
            default:
                return errorResponse(res, '파일 업로드 중 오류가 발생했습니다.', 400);
        }
    }
    if (err && err.code === 'INVALID_FILE_TYPE') {
        return errorResponse(res, err.message, 400);
    }
    next(err);
};



module.exports = {
    excelUpload,
    handleUploadError
};
