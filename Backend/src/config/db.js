const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

const backendEnvPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

const getRequiredDbConfig = () => ({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const PROCEDURE_PARAM_COUNTS = Object.freeze({
  insert_user: 6,
  login_user: 2,
  update_profile: 7,
  insert_admin: 5,
  login_admin: 2,
  update_admin_profile: 7,
  insert_book_details: 10,
  update_book_details: 11,
  add_book_copy: 3,
  update_book_copy_status: 3,
  delete_book: 2,
  delete_book_copy: 3,
  multi_search: 1,
});

const OUT_PROCEDURE_INPUT_COUNTS = Object.freeze({
  validate_email: 1,
  validate_password_strength: 1,
  encrypt_password: 1,
});

const getProcedureCallSql = (procedureName, paramCount) => {
  const placeholders = paramCount > 0 ? new Array(paramCount).fill('?').join(', ') : '';
  return `CALL ${procedureName}(${placeholders})`;
};

const callProcedure = async (procedureName, params = [], executor = pool) => {
  const expectedParamCount = PROCEDURE_PARAM_COUNTS[procedureName];

  if (expectedParamCount === undefined) {
    throw new Error(`Unsupported procedure call: ${procedureName}`);
  }

  if (params.length !== expectedParamCount) {
    throw new Error(
      `Invalid parameter count for ${procedureName}. Expected ${expectedParamCount}, received ${params.length}`
    );
  }

  const sql = getProcedureCallSql(procedureName, expectedParamCount);
  const [rows] = await executor.query(sql, params);

  if (!Array.isArray(rows)) return [];
  if (Array.isArray(rows[0])) return rows[0];
  return rows;
};

const callProcedureWithOutParams = async (
  procedureName,
  inputParams = [],
  outParamNames = [],
  executor = pool
) => {
  const expectedInputCount = OUT_PROCEDURE_INPUT_COUNTS[procedureName];

  if (expectedInputCount === undefined) {
    throw new Error(`Unsupported OUT procedure call: ${procedureName}`);
  }

  if (inputParams.length !== expectedInputCount) {
    throw new Error(
      `Invalid input parameter count for ${procedureName}. Expected ${expectedInputCount}, received ${inputParams.length}`
    );
  }

  const canCreateConnection = typeof executor?.getConnection === 'function';
  const conn = canCreateConnection ? await executor.getConnection() : executor;

  try {
    const outVariables = outParamNames.map((name) => `@${name}`);
    const allPlaceholders = [...inputParams.map(() => '?'), ...outVariables].join(', ');
    const callSql = `CALL ${procedureName}(${allPlaceholders})`;

    await conn.query(callSql, inputParams);

    if (outParamNames.length === 0) return {};

    const selectSql = `SELECT ${outVariables
      .map((variable, index) => `${variable} AS ${outParamNames[index]}`)
      .join(', ')}`;

    const [rows] = await conn.query(selectSql);
    return rows?.[0] || {};
  } finally {
    if (canCreateConnection && typeof conn?.release === 'function') {
      conn.release();
    }
  }
};

const initializeDatabase = async () => {
  const requiredConfig = getRequiredDbConfig();

  const missingConfigKeys = Object.entries(requiredConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingConfigKeys.length > 0) {
    throw new Error(`Missing DB environment variables: ${missingConfigKeys.join(', ')}`);
  }

  let connection;

  try {
    console.log('DB config check:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      hasPassword: Boolean(process.env.DB_PASSWORD),
    });

    connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
    });
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = pool;
module.exports.callProcedure = callProcedure;
module.exports.callProcedureWithOutParams = callProcedureWithOutParams;
module.exports.initializeDatabase = initializeDatabase;