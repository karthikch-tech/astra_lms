const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const callProcedure = async (procedureName, params = [], executor = pool) => {
  const placeholders = params.length ? params.map(() => '?').join(', ') : '';
  const sql = `CALL ${procedureName}(${placeholders})`;
  const [result] = await executor.query(sql, params);

  if (!Array.isArray(result)) {
    return [];
  }

  if (Array.isArray(result[0])) {
    return result[0];
  }

  return result;
};

const initializeDatabase = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log('Database connected');
  } finally {
    connection.release();
  }
};

module.exports = pool;
module.exports.callProcedure = callProcedure;
module.exports.initializeDatabase = initializeDatabase;
