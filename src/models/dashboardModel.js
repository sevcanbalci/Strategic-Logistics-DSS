const { pool } = require('../config/db');

async function getSummary() {
  const [[depoCount]] = await pool.query('SELECT COUNT(*) AS toplam_depo FROM depolar');
  const [[toplamBenzin]] = await pool.query('SELECT COALESCE(SUM(benzin_litre),0) AS toplam_benzin FROM sehir_depo_maliyet');

  const [enRotaRows] = await pool.query(
    `SELECT m.id, s.sehir_ad, d.depo_ad, m.benzin_litre
       FROM sehir_depo_maliyet m
       JOIN sehirler s ON s.sehir_id = m.sehir_id
       JOIN depolar d ON d.depo_id = m.depo_id
       ORDER BY m.benzin_litre DESC
       LIMIT 1`
  );

  const [bolgeRows] = await pool.query(
    `SELECT b.bolge_ad, COALESCE(SUM(m.benzin_litre),0) AS toplam_benzin
       FROM bolgeler b
       JOIN sehirler s ON s.bolge_id = b.bolge_id
       LEFT JOIN sehir_depo_maliyet m ON m.sehir_id = s.sehir_id
       GROUP BY b.bolge_ad
       ORDER BY toplam_benzin DESC
       LIMIT 1`
  );

  return {
    toplam_depo: depoCount.toplam_depo || 0,
    toplam_benzin: toplamBenzin.toplam_benzin || 0,
    en_maliyetli_rota: enRotaRows[0] || null,
    en_maliyetli_bolge: bolgeRows[0] || null,
  };
}

module.exports = { getSummary };
async function getSehirAktivite(){
  const [rows] = await pool.query(
    `SELECT sehir_ad, kac_defa, COALESCE(sehir_gelir, 0) AS sehir_gelir
       FROM sehirler
       ORDER BY kac_defa DESC`
  );
  return rows;
}5

module.exports.getSehirAktivite = getSehirAktivite;
async function getSehirAktiviteFallback(){
  const [rows] = await pool.query(
    `SELECT s.sehir_ad, COUNT(m.id) AS kac_defa
       FROM sehirler s
       LEFT JOIN sehir_depo_maliyet m ON m.sehir_id = s.sehir_id
       GROUP BY s.sehir_ad
       ORDER BY kac_defa DESC
       LIMIT 10`
  );
  return rows;
}

module.exports.getSehirAktiviteFallback = getSehirAktiviteFallback;
async function getSehirGelirMap(){
  const [rows] = await pool.query(
    `SELECT sehir_ad, COALESCE(sehir_gelir, 0) AS sehir_gelir
       FROM sehirler`
  );
  return rows;
}
module.exports.getSehirGelirMap = getSehirGelirMap;

