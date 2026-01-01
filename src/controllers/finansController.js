const { getAylik } = require('../models/finansModel');

async function view(req, res) {
  res.render('finans');
}

async function aylik(req, res) {
  try {
    const yilParam = req.query && req.query.yil ? Number(req.query.yil) : 2025;
    const data = await getAylik(yilParam);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Finans verisi alınamadı' });
  }
}

module.exports = { view, aylik };
