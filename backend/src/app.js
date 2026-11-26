import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import sequelize from './config/database.js';
import { Usuario } from './models/index.js';
import crypto from 'node:crypto';
import { DataTypes } from 'sequelize';
import jugadoresRoutes from './routes/jugadores.routes.js';
import rostersRoutes from './routes/rosters.routes.js';
import auxiliaresRoutes from './routes/auxiliares.routes.js';
import authRoutes from './routes/auth.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const app = express();
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean);
// En desarrollo, localhost y 127.0.0.1 se usan indistintamente al ejecutar Playwright.
const allowedOrigins = [...new Set([...configuredOrigins, ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'])])];

app.use(cors({
  origin(origin, callback) {
    // Permite herramientas sin Origin (p. ej. curl/Postman); navegador debe coincidir con allowlist.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const API = '/api/v1';
app.get(`${API}/health`, async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/jugadores`, jugadoresRoutes);
app.use(`${API}/rosters`, rostersRoutes);
app.use(`${API}`, auxiliaresRoutes);

const openapi = YAML.parse(fs.readFileSync(path.resolve(__dirname, '../openapi.yaml'), 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.use((req, res) => res.status(404).json({ error: 'Endpoint no encontrado.' }));
app.use((err, _req, res, _next) => {
  if (err.message === 'Origen no permitido por CORS.') return res.status(403).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const port = Number(process.env.PORT || 3000);
const start = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('Falta JWT_SECRET en .env. Copia .env.example y configura las variables.');
    process.exit(1);
  }
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    // Actualiza instalaciones existentes sin borrar las cuentas locales.
    const queryInterface = sequelize.getQueryInterface();
    const userColumns = await queryInterface.describeTable('usuarios_locales');
    if (userColumns.password_hash?.allowNull === false) {
      await queryInterface.changeColumn('usuarios_locales', 'password_hash', { type: DataTypes.STRING(255), allowNull: true });
    }
    if (!userColumns.google_id) {
      await queryInterface.addColumn('usuarios_locales', 'google_id', { type: DataTypes.STRING(255), allowNull: true });
    }
    const userIndexes = await queryInterface.showIndex('usuarios_locales');
    if (!userIndexes.some(index => index.name === 'uq_usuarios_google_id')) {
      await queryInterface.addIndex('usuarios_locales', ['google_id'], { name: 'uq_usuarios_google_id', unique: true });
    }
    const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@esports.local').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Cambia_Esta_Clave_123!';
    const admin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = await new Promise((resolve, reject) => crypto.scrypt(adminPassword, salt, 64, (error, key) => error ? reject(error) : resolve(`scrypt$${salt}$${key.toString('hex')}`)));
      await Usuario.create({ nombre: process.env.ADMIN_NAME || 'Administrador', email: adminEmail, password_hash: passwordHash, rol: 'Admin' });
      console.log(`Administrador inicial creado: ${adminEmail}`);
    }
    console.log('Conexión a MySQL establecida.');
    app.listen(port, () => console.log(`API disponible en http://localhost:${port}`));
  } catch (error) {
    console.error('No se pudo iniciar la API. Revisa MySQL y el archivo .env.', error.message);
    process.exit(1);
  }
};
start();
