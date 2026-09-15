const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lugar: {
    type: DataTypes.STRING,
    allowNull: false
  },
  salario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

module.exports = User;