const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserHistory = sequelize.define('UserHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id'
  },
  accion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  detalle: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  tableName: 'historial_usuarios',
  timestamps: true
});

module.exports = UserHistory;