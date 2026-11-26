import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { Usuario } from '../models/index.js';

export async function authenticateJWT(req, res, next) {
  const token = req.cookies?.jwt_token;
  if (!token) return res.status(401).json({ error: 'Sesión no iniciada o expirada.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'esports-api', audience: 'esports-admin-frontend' });
    if (!payload?.sub || !payload?.role || !payload?.csrfToken) return res.status(401).json({ error: 'Sesión inválida.' });
    const usuario = await Usuario.findByPk(payload.sub, { attributes: ['id', 'email', 'rol'] });
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado.' });
    req.user = { id: usuario.id, email: usuario.email, role: usuario.rol, csrfToken: payload.csrfToken };
    next();
  } catch { return res.status(401).json({ error: 'Sesión inválida o expirada.' }); }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'Admin') return res.status(403).json({ error: 'Se requiere el rol Admin.' });
  next();
}

export function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.get('X-CSRF-Token');
  const expected = req.user?.csrfToken;
  const a = Buffer.from(String(cookieToken || ''));
  const b = Buffer.from(String(headerToken || ''));
  if (!cookieToken || !headerToken || a.length !== b.length || !crypto.timingSafeEqual(a, b) || headerToken !== expected) {
    return res.status(403).json({ error: 'Token CSRF ausente o inválido.' });
  }
  next();
}
