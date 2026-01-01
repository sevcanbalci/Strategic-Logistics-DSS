const { pool } = require('../config/db');

async function getAylik(yil) {
  if(yil){
    const [rows] = await pool.query(
      `SELECT ay,
              COALESCE(SUM(gelir),0) AS gelir,
              COALESCE(SUM(gider),0) AS gider,
              COALESCE(SUM(gelir) - SUM(gider),0) AS kar
         FROM gelir_gider
         WHERE yil = ?
         GROUP BY ay
         ORDER BY FIELD(ay,'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık')`,
      [yil]
    );
    return rows.map(r=>({ yil, ...r }));
  }else{
    const [rows] = await pool.query(
      `SELECT yil, ay,
              COALESCE(SUM(gelir),0) AS gelir,
              COALESCE(SUM(gider),0) AS gider,
              COALESCE(SUM(gelir) - SUM(gider),0) AS kar
         FROM gelir_gider
         GROUP BY yil, ay
         ORDER BY yil, FIELD(ay,'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık')`
    );
    return rows;
  }
}

module.exports = { getAylik };
