const {
  getDepolar,
  uygunKonumlar,
  enMaliyetliRotalar,
  bolgeMaliyet,
  yeniDepoOneri,
} = require('../models/depoModel');

async function view(req, res) {
  res.render('depo');
}

async function list(req, res) {
  try {
    const data = await getDepolar();
    res.json({ ok: true, data });
  } catch (err) {
    res.json({ ok: true, data: [] });
  }
}

async function uygunKonumlarApi(req, res) {
  try {
    const data = await uygunKonumlar();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Uygun konumlar alınamadı' });
  }
}

async function enMaliyetliRotalarApi(req, res) {
  try {
    const data = await enMaliyetliRotalar(10);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Rotalar alınamadı' });
  }
}

async function bolgeMaliyetApi(req, res) {
  try {
    const data = await bolgeMaliyet();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Bölge maliyetleri alınamadı' });
  }
}

async function yeniDepoOneriApi(req, res){
  try{
    const data = await yeniDepoOneri();
    res.json({ ok: true, data });
  }catch(err){
    res.status(500).json({ ok: false, error: 'Yeni depo önerisi alınamadı' });
  }
}

module.exports = {
  view,
  list,
  uygunKonumlar: uygunKonumlarApi,
  enMaliyetliRotalar: enMaliyetliRotalarApi,
  bolgeMaliyet: bolgeMaliyetApi,
  yeniDepoOneri: yeniDepoOneriApi,
};
