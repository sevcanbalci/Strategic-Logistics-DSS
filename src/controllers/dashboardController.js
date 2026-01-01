const { getSummary, getSehirAktivite, getSehirAktiviteFallback, getSehirGelirMap } = require('../models/dashboardModel');
const { getMapData } = require('../models/depoModel');

async function view(req, res) {
  res.render('dashboard');
}

async function summary(req, res) {
  try {
    const data = await getSummary();
    res.json({ ok: true, data });
  } catch (err) {
    res.json({ ok: true, data: { toplam_depo: 0, en_maliyetli_rota: null, en_maliyetli_bolge: null } });
  }
}

async function mapData(req, res) {
  try {
    const data = await getMapData();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('map-data error:', err);
    res.status(500).json({ ok: false, error: 'Harita verisi alınamadı' });
  }
}

module.exports = { view, summary, mapData };
async function aktifSehirler(req,res){
  try{
    const data = await getSehirAktivite();
    try{
      const gelirRows = await getSehirGelirMap();
      const gelirMap = new Map(gelirRows.map(g=>[g.sehir_ad, Number(g.sehir_gelir||0)]));
      const merged = data.map(d=>({
        ...d,
        sehir_gelir: d.sehir_gelir !== undefined ? Number(d.sehir_gelir||0) : (gelirMap.has(d.sehir_ad) ? gelirMap.get(d.sehir_ad) : 0)
      }));
      res.json({ ok: true, data: merged });
    }catch(e1){
      const merged = data.map(d=>({ ...d, sehir_gelir: Number(d.sehir_gelir||0) || 0 }));
      res.json({ ok: true, data: merged });
    }
  }catch(err){
    try{
      const data = await getSehirAktiviteFallback();
      try{
        const gelirRows = await getSehirGelirMap();
        const gelirMap = new Map(gelirRows.map(g=>[g.sehir_ad, Number(g.sehir_gelir||0)]));
        const merged = data.map(d=>({
          ...d,
          sehir_gelir: gelirMap.has(d.sehir_ad) ? gelirMap.get(d.sehir_ad) : 0
        }));
        res.json({ ok: true, data: merged });
      }catch(e2){
        const merged = data.map(d=>({ ...d, sehir_gelir: 0 }));
        res.json({ ok: true, data: merged });
      }
    }catch(e){
      res.json({ ok: true, data: [] });
    }
  }
}

module.exports.aktifSehirler = aktifSehirler;

