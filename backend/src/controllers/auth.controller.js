import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Usuario } from '../models/index.js';

const maxAge = Number(process.env.JWT_COOKIE_MAX_AGE || 3600000);
const scrypt = (password, salt) => new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key)));
async function hashPassword(password) { const salt = crypto.randomBytes(16).toString('hex'); const key = await scrypt(password, salt); return `scrypt$${salt}$${key.toString('hex')}`; }
async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const key = await scrypt(password, salt); const expected = Buffer.from(hash, 'hex');
  return expected.length === key.length && crypto.timingSafeEqual(key, expected);
}
const jwtCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge };
const csrfCookieOptions = { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge };
const oauthStateCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 };

export function createSession(usuario, res) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    { email: usuario.email, role: usuario.rol, csrfToken },
    process.env.JWT_SECRET,
    { subject: String(usuario.id), expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: 'esports-api', audience: 'esports-admin-frontend' }
  );
  res.cookie('jwt_token', token, jwtCookieOptions);
  res.cookie('csrf_token', csrfToken, csrfCookieOptions);
  return { user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role: usuario.rol }, csrfToken };
}

function googleClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
}

export function googleLogin(_req, res) {
  const client = googleClient();
  if (!client) return res.redirect(`${frontendUrl()}/?oauth_error=${encodeURIComponent('Google OAuth no está configurado en el servidor.')}`);
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie('google_oauth_state', state, oauthStateCookieOptions);
  const url = client.generateAuthUrl({
    access_type: 'online',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
    state,
  });
  return res.redirect(url);
}

export async function googleCallback(req, res) {
  const stateCookie = req.cookies.google_oauth_state;
  res.clearCookie('google_oauth_state', { ...oauthStateCookieOptions, maxAge: undefined });
  const fail = (message) => res.redirect(`${frontendUrl()}/?oauth_error=${encodeURIComponent(message)}`);
  if (req.query.error) return fail('No se completó el acceso con Google.');
  if (!req.query.code || !stateCookie || typeof req.query.state !== 'string') return fail('La respuesta de Google está incompleta. Intenta nuevamente.');
  const received = Buffer.from(String(req.query.state));
  const expected = Buffer.from(String(stateCookie));
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return fail('La validación de seguridad de Google falló. Intenta nuevamente.');

  const client = googleClient();
  if (!client) return fail('Google OAuth no está configurado en el servidor.');
  try {
    const { tokens } = await client.getToken(String(req.query.code));
    if (!tokens.id_token) return fail('Google no devolvió un token de identidad válido.');
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) return fail('Google no pudo verificar el correo de la cuenta.');

    const email = profile.email.trim().toLowerCase();
    let usuario = await Usuario.findOne({ where: { google_id: profile.sub } });
    if (!usuario) {
      usuario = await Usuario.findOne({ where: { email } });
      if (usuario) {
        if (usuario.google_id && usuario.google_id !== profile.sub) return fail('Este correo ya está vinculado a otra cuenta de Google.');
        usuario.google_id = profile.sub;
        if (!usuario.nombre && profile.name) usuario.nombre = profile.name;
        await usuario.save();
      } else {
        usuario = await Usuario.create({
          nombre: String(profile.name || profile.given_name || email.split('@')[0]).slice(0, 120),
          email,
          google_id: profile.sub,
          password_hash: null,
          rol: 'Public',
        });
      }
    }

    createSession(usuario, res);
    return res.redirect(`${frontendUrl()}/?oauth=success`);
  } catch (error) {
    console.error('Error durante Google OAuth:', error.message);
    return fail('No fue posible iniciar sesión con Google. Intenta nuevamente.');
  }
}

export async function login(req, res) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;
    if (!email || typeof password !== 'string') return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario || !(await verifyPassword(password, usuario.password_hash))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    const session = createSession(usuario, res);
    res.json({ message: 'Sesión iniciada.', ...session });
  } catch (error) { console.error(error); res.status(500).json({ error: 'No fue posible iniciar sesión.' }); }
}

export async function register(req, res) {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;
    if (!nombre || !email || typeof password !== 'string') return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Correo electrónico inválido.' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    if (await Usuario.findOne({ where: { email } })) return res.status(409).json({ error: 'El correo ya está registrado.' });
    const usuario = await Usuario.create({ nombre, email, password_hash: await hashPassword(password), rol: 'Public' });
    const session = createSession(usuario, res);
    res.status(201).json({ message: 'Cuenta creada.', ...session });
  } catch (error) { console.error(error); res.status(500).json({ error: 'No fue posible crear la cuenta.' }); }
}

export async function me(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.user.id, { attributes: ['id', 'nombre', 'email', 'rol'] });
    if (!usuario) return res.status(401).json({ error: 'La cuenta ya no existe.' });
    res.json({ user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role: usuario.rol } });
  } catch (error) { console.error(error); res.status(500).json({ error: 'No fue posible consultar la sesión.' }); }
}

export function logout(_req, res) {
  const base = { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' };
  res.clearCookie('jwt_token', { ...base, httpOnly: true });
  res.clearCookie('csrf_token', { ...base, httpOnly: false });
  res.status(204).end();
}
