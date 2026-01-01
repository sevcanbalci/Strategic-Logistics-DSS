const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const depoController = require('../controllers/depoController');
const finansController = require('../controllers/finansController');
const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');

function parseCookies(cookieHeader){
  const out = {};
  if(!cookieHeader) return out;
  cookieHeader.split(';').forEach(part=>{
    const [k,...rest]=part.split('=');
    const key=(k||'').trim();
    const val=(rest.join('=')||'').trim();
    if(key) out[key]=val;
  });
  return out;
}

function requireAuth(req,res,next){
  const cookies = parseCookies(req.headers.cookie);
  if(cookies['admin_auth'] === 'yes') return next();
  res.redirect('/login');
}

router.get('/login', authController.view);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/', requireAuth, dashboardController.view);
router.get('/api/dashboard/summary', dashboardController.summary);
router.get('/api/dashboard/map-data', dashboardController.mapData);
router.get('/api/dashboard/aktif-sehirler', dashboardController.aktifSehirler);

router.get('/depo-yonetimi', requireAuth, depoController.view);
router.get('/api/depolar', depoController.list);
router.get('/api/analiz/uygun-konumlar', depoController.uygunKonumlar);
router.get('/api/analiz/en-maliyetli-rotalar', depoController.enMaliyetliRotalar);
router.get('/api/analiz/bolge-maliyet', depoController.bolgeMaliyet);
router.get('/api/analiz/yeni-depo-oneri', depoController.yeniDepoOneri);

router.get('/finansal', requireAuth, finansController.view);
router.get('/api/finans/aylik', finansController.aylik);

router.get('/api/health/db', healthController.db);

module.exports = router;
