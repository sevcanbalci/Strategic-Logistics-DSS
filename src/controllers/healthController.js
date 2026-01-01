const { pool } = require('../config/db');

async function db(req, res){
  try{
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true });
  }catch(err){
    res.status(500).json({ ok: false, error: 'DB bağlantısı kurulamadı', code: err.code, message: err.message });
  }
}

module.exports = { db };
