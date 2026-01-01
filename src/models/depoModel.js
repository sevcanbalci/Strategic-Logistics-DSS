const { pool } = require('../config/db');

async function getDepolar() {
  const [rows] = await pool.query(
    `SELECT d.depo_id, d.depo_ad, d.sehir_id, d.enlem, d.boylam, d.konum, d.kapasite,
            d.doluluk_orani,
            s.sehir_ad, s.bolge_id, b.bolge_ad
       FROM depolar d
       JOIN sehirler s ON s.sehir_id = d.sehir_id
       LEFT JOIN bolgeler b ON b.bolge_id = s.bolge_id
       ORDER BY d.depo_id`
  );
  return rows;
}
async function getMapData() {
  const [rows] = await pool.query(`
    SELECT 
        d.depo_id, 
        d.depo_ad, 
        d.enlem, 
        d.boylam, 
        d.konum, 
        d.kapasite AS Kapasite, 
        d.doluluk_orani, 
        s.sehir_id, 
        s.sehir_ad, 
        b.bolge_ad
    FROM depolar d
    JOIN sehirler s ON s.sehir_id = d.sehir_id
    LEFT JOIN bolgeler b ON b.bolge_id = s.bolge_id
  `);
  return rows;
}

async function uygunKonumlar() {
  const [rows] = await pool.query(
    `SELECT s.sehir_id, s.sehir_ad, b.bolge_ad,
            COUNT(m.id) AS rota_sayisi,
            COALESCE(SUM(m.benzin_litre), 0) AS toplam_benzin,
            COALESCE(AVG(m.benzin_litre), 0) AS ort_benzin
       FROM sehirler s
       LEFT JOIN bolgeler b ON b.bolge_id = s.bolge_id
       LEFT JOIN sehir_depo_maliyet m ON m.sehir_id = s.sehir_id
       GROUP BY s.sehir_id, s.sehir_ad, b.bolge_ad
       ORDER BY toplam_benzin DESC
       LIMIT 15`
  );
  return rows;
}

async function enMaliyetliRotalar(limit = 10) {
  const [rows] = await pool.query(
    `SELECT m.id, s.sehir_ad, d.depo_ad, m.mesafe_km, m.benzin_litre
       FROM sehir_depo_maliyet m
       JOIN sehirler s ON s.sehir_id = m.sehir_id
       JOIN depolar d ON d.depo_id = m.depo_id
       ORDER BY m.benzin_litre DESC
       LIMIT ?`,
    [limit]
  );
  return rows;
}

async function bolgeMaliyet() {
  const [rows] = await pool.query(
    `SELECT b.bolge_ad,
            COALESCE(SUM(m.benzin_litre), 0) AS toplam_benzin
       FROM bolgeler b
       JOIN sehirler s ON s.bolge_id = b.bolge_id
       LEFT JOIN sehir_depo_maliyet m ON m.sehir_id = s.sehir_id
       GROUP BY b.bolge_ad
       ORDER BY toplam_benzin DESC`
  );
  return rows;
}

async function yeniDepoOneri(){
  const [rows] = await pool.query(
    `SELECT s.sehir_id, s.sehir_ad, b.bolge_ad,
            COUNT(m.id) AS rota_sayisi,
            COALESCE(MIN(m.benzin_litre),0) AS min_benzin,
            COALESCE(MAX(m.benzin_litre),0) AS max_benzin,
            COALESCE(AVG(m.benzin_litre),0) AS ort_benzin,
            (COUNT(m.id) * COALESCE(AVG(m.benzin_litre),0)) AS ihtiyac_skoru
       FROM sehirler s
       LEFT JOIN bolgeler b ON b.bolge_id = s.bolge_id
       LEFT JOIN sehir_depo_maliyet m ON m.sehir_id = s.sehir_id
       GROUP BY s.sehir_id, s.sehir_ad, b.bolge_ad
       ORDER BY ihtiyac_skoru DESC
       LIMIT 20`
  );
  return rows;
}

module.exports = {
  getDepolar,
  getMapData,
  uygunKonumlar,
  enMaliyetliRotalar,
  bolgeMaliyet,
  yeniDepoOneri,
};
