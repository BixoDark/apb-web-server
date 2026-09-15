require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: true // Cambia a console.log si deseas ver las consultas SQL en desarrollo
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Conexión a PostgreSQL establecida con éxito.');
  } catch (error) {
    console.error(' Error de conexión a la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };