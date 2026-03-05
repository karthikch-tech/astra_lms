require('dotenv').config();

const pool = require('../src/config/db');
const { registerUser } = require('../src/services/auth.service');

const requiredFields = [
  'ADMIN_FIRST_NAME',
  'ADMIN_LAST_NAME',
  'ADMIN_EMAIL',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
];

const getMissingFields = () => {
  return requiredFields.filter((field) => !process.env[field] || String(process.env[field]).trim() === '');
};

const createAdmin = async () => {
  const missingFields = getMissingFields();
  if (missingFields.length > 0) {
    throw new Error(`Missing required env vars: ${missingFields.join(', ')}`);
  }

  const admin = await registerUser(
    process.env.ADMIN_FIRST_NAME.trim(),
    process.env.ADMIN_LAST_NAME.trim(),
    process.env.ADMIN_EMAIL.trim().toLowerCase(),
    process.env.ADMIN_USERNAME.trim().toLowerCase(),
    process.env.ADMIN_PASSWORD.trim(),
    'ADMIN'
  );

  return admin;
};

createAdmin()
  .then((admin) => {
    console.log('Admin created:', admin);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create admin:', error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch (error) {
      console.error('Failed to close DB pool:', error.message);
    }
  });
