import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(190), allowNull: false, unique: { name: 'uq_usuarios_email' }, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING(255), allowNull: true },
  google_id: { type: DataTypes.STRING(255), allowNull: true, unique: { name: 'uq_usuarios_google_id' } },
  rol: { type: DataTypes.ENUM('Admin', 'Public'), allowNull: false, defaultValue: 'Public' }
}, { tableName: 'usuarios_locales', timestamps: true, underscored: true });

export default Usuario;
