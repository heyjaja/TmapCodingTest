const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');
const { excelUpload, handleUploadError } = require('../middleware/uploadMiddleware');
const axios = require("axios");
const TMAP_API_KEY = process.env.TMAP_API_KEY || 'VxOtMgjZGc7kTP50VWRKC62WBf2QRzxeaz2ViIqB';

/* GET home page. */
router.get('/index', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/getScript', async (req, res) => {
  try {
    const url = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${encodeURIComponent(TMAP_API_KEY)}`;
    // 외부 JS 파일을 받아서 Content-Type을 그대로 내보내기
    const response = await axios.get(url, { responseType: 'text' });
    res.set('Content-Type', 'application/javascript; charset=UTF-8');
    res.send(response.data);
  } catch (error) {
    res.type('js').send('// Tmap JS SDK 프록시 오류');
  }
});

// POI 데이터 import
router.post('/api/poi/import',
    excelUpload.single('excelFile'),
    handleUploadError,
    indexController.importPoi,
);

// POI 리스트
router.get('/api/poi', indexController.getPoiList);

module.exports = router;
