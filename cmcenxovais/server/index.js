import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import express from 'express';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);
const catalogUrl = 'https://cmc-enxovais.clearcow.chatgpt.site/catalogo';
const databaseUrl = process.env.DATABASE_URL;
const adminEmail = (process.env.ADMIN_EMAIL || 'aurumnorthgroup@gmail.com').trim().toLowerCase();
const publicOriginUrl = process.env.PUBLIC_ORIGIN || 'https://www.cmcenxovais.online';
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const scryptAsync = promisify(scrypt);

if (!databaseUrl) throw new Error('DATABASE_URL não foi configurada.');

const app = express();
const pool = mysql.createPool({
  uri: databaseUrl,
  waitForConnections: true,
  connectionLimit: 8,
  maxIdle: 4,
  idleTimeout: 60_000,
  enableKeepAlive: true,
});

const publicDir = production ? path.join(rootDir, 'dist') : rootDir;
const publicAssetsDir = production ? path.join(rootDir, 'dist', 'assets') : path.join(rootDir, 'public', 'assets');
const commonAssetsDir = path.join(rootDir, 'assets');
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const requestWindows = new Map();
const validInterests = new Set([
  'Quero revender',
  'Já sou revendedor',
  'Compra para minha casa',
  'Pedido em andamento',
  'Quero ser representante',
  'Outro assunto',
]);
const validStates = new Set(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']);
let databaseReady = false;

const normalizeText = (value, maxLength = 5000) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length <= maxLength ? normalized : null;
};

const normalizePhone = (value) => {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  if (!/^\d{10,11}$/.test(digits) || /^([0-9])\1+$/.test(digits) || digits.startsWith('00')) return null;
  return digits;
};

const validEmail = (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const hashToken = (value) => createHash('sha256').update(value).digest('hex');
const randomToken = () => randomBytes(32).toString('base64url');
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

function validCpf(digits) {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  const check = (length) => {
    const sum = digits.slice(0, length).split('').reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const value = (sum * 10) % 11;
    return value === 10 ? 0 : value;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

function validCnpj(digits) {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;
  const check = (length) => {
    let factor = length - 7;
    const sum = digits.slice(0, length).split('').reduce((total, digit) => {
      const next = total + Number(digit) * factor;
      factor = factor === 2 ? 9 : factor - 1;
      return next;
    }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return check(12) === Number(digits[12]) && check(13) === Number(digits[13]);
}

function normalizeDocument(value) {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  return validCpf(digits) || validCnpj(digits) ? digits : null;
}

function passwordError(password) {
  if (typeof password !== 'string' || password.length < 10) return 'Use pelo menos 10 caracteres na senha.';
  if (password.length > 128) return 'Use no máximo 128 caracteres na senha.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return 'Inclua letra maiúscula, minúscula e número na senha.';
  return '';
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  try {
    const [algorithm, salt, expectedHex] = String(storedHash).split('$');
    if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
    const actual = Buffer.from(await scryptAsync(password, salt, 64));
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function cookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((result, pair) => {
    const separator = pair.indexOf('=');
    if (separator < 1) return result;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
    return result;
  }, {});
}

function cookieOptions(req, { httpOnly = true, maxAge = sessionLifetimeMs } = {}) {
  const secure = production || req.secure || req.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https';
  return { httpOnly, secure, sameSite: secure ? 'none' : 'lax', path: '/', maxAge };
}

function ensureCsrf(req, res) {
  const current = cookies(req).cmc_csrf;
  if (current && /^[A-Za-z0-9_-]{32,128}$/.test(current)) return current;
  const token = randomToken();
  res.cookie('cmc_csrf', token, cookieOptions(req, { httpOnly: false }));
  return token;
}

function requireCsrf(req, res, next) {
  const token = cookies(req).cmc_csrf;
  const sent = req.get('x-csrf-token');
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token || '') || !/^[A-Za-z0-9_-]{32,128}$/.test(sent || '')) {
    return res.status(403).json({ error: 'Sessão inválida. Atualize a página e tente novamente.' });
  }
  const tokenBuffer = Buffer.from(token);
  const sentBuffer = Buffer.from(sent);
  if (tokenBuffer.length !== sentBuffer.length || !timingSafeEqual(tokenBuffer, sentBuffer)) {
    return res.status(403).json({ error: 'Sessão inválida. Atualize a página e tente novamente.' });
  }
  return next();
}

function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('\r') || value.includes('\n')) return '/';
  const allowed = new Set(['/', '/catalogo', '/admin']);
  return allowed.has(value) ? value : '/';
}

function publicOrigin() {
  return publicOriginUrl.replace(/\/$/, '');
}

function rateLimit(scope, maxRequests) {
  return (req, res, next) => {
    const address = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${scope}:${address}`;
    const now = Date.now();
    if (requestWindows.size > 2_000) {
      for (const [storedKey, value] of requestWindows) {
        if (now - value.startedAt > 60_000) requestWindows.delete(storedKey);
      }
    }
    const entry = requestWindows.get(key) || { count: 0, startedAt: now };
    if (now - entry.startedAt > 60_000) {
      entry.count = 0;
      entry.startedAt = now;
    }
    entry.count += 1;
    requestWindows.set(key, entry);
    if (entry.count > maxRequests) return res.status(429).json({ error: 'Aguarde um instante antes de tentar novamente.' });
    return next();
  };
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NULL,
      name VARCHAR(180) NOT NULL,
      phone VARCHAR(24) NOT NULL,
      email VARCHAR(191) NOT NULL,
      city VARCHAR(120) NULL,
      state CHAR(2) NULL,
      interest VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      consent TINYINT(1) NOT NULL DEFAULT 0,
      source VARCHAR(80) NOT NULL DEFAULT 'site-cmc',
      status VARCHAR(40) NOT NULL DEFAULT 'novo',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_leads_created_at (created_at),
      KEY idx_leads_interest (interest)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(180) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(24) NULL,
      document_number VARCHAR(14) NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
      review_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      email_verified_at DATETIME NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_site_users_email (email),
      UNIQUE KEY uq_site_users_document (document_number),
      KEY idx_site_users_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const ensureUserColumn = async (column, definition) => {
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_users' AND COLUMN_NAME = ?`,
      [column],
    );
    if (!columns.length) await pool.query(`ALTER TABLE site_users ADD COLUMN ${definition}`);
  };
  await ensureUserColumn('document_number', 'document_number VARCHAR(14) NULL AFTER phone');
  await ensureUserColumn('review_status', "review_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER role");
  await pool.execute("UPDATE site_users SET role = 'admin', review_status = 'approved' WHERE email = ?", [adminEmail]);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_site_sessions_token (token_hash),
      KEY idx_site_sessions_user (user_id),
      KEY idx_site_sessions_expiry (expires_at),
      CONSTRAINT fk_site_sessions_user FOREIGN KEY (user_id) REFERENCES site_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_email_verification_tokens_hash (token_hash),
      KEY idx_email_verification_tokens_user (user_id),
      CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES site_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_password_reset_tokens_hash (token_hash),
      KEY idx_password_reset_tokens_user (user_id),
      CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES site_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function prepareDatabase() {
  try {
    await ensureSchema();
    databaseReady = true;
    console.log('Banco CMC pronto para leads, contas e administração.');
  } catch (error) {
    databaseReady = false;
    console.error('Banco CMC indisponível; nova tentativa em 10 segundos.', error.message);
    setTimeout(prepareDatabase, 10_000).unref();
  }
}

async function sendEmail({ to, subject, html }) {
  if (!resendApiKey || !resendFromEmail) throw new Error('O envio de e-mail ainda não está configurado.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: resendFromEmail, to: [to], subject, html }),
  });
  if (!response.ok) {
    console.error('Falha no envio de e-mail CMC:', response.status);
    throw new Error('Não foi possível enviar o e-mail agora.');
  }
}

async function issueToken(table, userId, lifetimeHours) {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + lifetimeHours * 60 * 60 * 1000);
  await pool.execute(`DELETE FROM ${table} WHERE user_id = ? AND used_at IS NULL`, [userId]);
  await pool.execute(`INSERT INTO ${table} (user_id, token_hash, expires_at) VALUES (?, ?, ?)`, [userId, tokenHash, expiresAt]);
  return token;
}

async function currentUser(req) {
  const token = cookies(req).cmc_session;
  if (!token || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) return null;
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.review_status
     FROM site_sessions s
     INNER JOIN site_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.is_active = 1 AND u.email_verified_at IS NOT NULL
     LIMIT 1`,
    [hashToken(token)],
  );
  return rows[0] || null;
}

async function createSession(req, res, userId) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await pool.execute('DELETE FROM site_sessions WHERE expires_at <= UTC_TIMESTAMP()');
  await pool.execute('INSERT INTO site_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [userId, hashToken(token), expiresAt]);
  res.cookie('cmc_session', token, cookieOptions(req));
}

async function clearSession(req, res) {
  const token = cookies(req).cmc_session;
  if (token && /^[A-Za-z0-9_-]{32,128}$/.test(token)) await pool.execute('DELETE FROM site_sessions WHERE token_hash = ?', [hashToken(token)]);
  const options = cookieOptions(req, { maxAge: 0 });
  res.clearCookie('cmc_session', options);
}

async function requireUser(req, res, next) {
  try {
    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: 'Faça login para continuar.', login: '/login' });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

async function requireAdminPage(req, res, next) {
  try {
    const user = await currentUser(req);
    if (!user) return res.redirect(302, '/login?next=/admin');
    if (user.role !== 'admin') return res.status(403).send('Acesso restrito à administração da CMC.');
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdminApi(req, res, next) {
  return requireUser(req, res, (error) => {
    if (error) return next(error);
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso administrativo necessário.' });
    return next();
  });
}

function authPage(_req, res) {
  return res.sendFile(path.join(publicDir, 'auth.html'));
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '24kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return next();
});

app.get('/api/health', async (_req, res) => {
  if (!databaseReady) return res.status(503).json({ ok: false, database: 'preparing' });
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({ ok: false, database: 'unavailable' });
  }
});

app.get('/api/auth/session', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store');
    const csrfToken = ensureCsrf(req, res);
    const user = await currentUser(req);
    return res.json({ user: user ? { name: user.name, email: user.email, role: user.role } : null, csrfToken });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/register', rateLimit('register', 6), requireCsrf, async (req, res, next) => {
  try {
    if (!databaseReady) return res.status(503).json({ error: 'O cadastro está sendo preparado. Tente novamente em alguns instantes.' });
    const body = req.body || {};
    const name = normalizeText(body.name, 180);
    const email = normalizeText(body.email, 191)?.toLowerCase();
    const phone = body.phone ? normalizePhone(body.phone) : null;
    const documentNumber = normalizeDocument(body.documentNumber);
    const password = typeof body.password === 'string' ? body.password : '';
    const consent = body.consent === true;
    const honeypot = body.website === undefined ? '' : normalizeText(body.website, 200);
    const passwordMessage = passwordError(password);

    if (honeypot === null || honeypot) return res.status(204).end();
    if (!name || name.length < 3 || !validEmail(email) || (body.phone && !phone) || !documentNumber || passwordMessage || !consent) {
      return res.status(422).json({ error: passwordMessage || 'Revise os campos obrigatórios para concluir o cadastro.' });
    }

    const [existing] = await pool.execute('SELECT id FROM site_users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Já existe uma conta com este e-mail. Use a Área de login ou recupere sua senha.' });

    const role = email === adminEmail ? 'admin' : 'customer';
    const passwordHash = await hashPassword(password);
    const [result] = await pool.execute(
      'INSERT INTO site_users (name, email, phone, document_number, password_hash, role, review_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, documentNumber, passwordHash, role, role === 'admin' ? 'approved' : 'pending'],
    );

    const verificationToken = await issueToken('email_verification_tokens', result.insertId, 24);
    const verificationUrl = `${publicOrigin()}/verificar-email?token=${encodeURIComponent(verificationToken)}`;
    let mailDelivered = true;
    try {
      await sendEmail({
        to: email,
        subject: 'Confirme seu acesso à CMC Enxovais',
        html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24241f"><h1 style="color:#771426">Olá, ${escapeHtml(name)}.</h1><p>Para ativar sua conta CMC, confirme seu e-mail pelo botão abaixo.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:14px 20px;background:#ad1f35;color:#fff;text-decoration:none;border-radius:999px;font-weight:700">Confirmar meu e-mail</a></p><p style="font-size:12px;color:#69675f">Este link expira em 24 horas. Se você não solicitou o cadastro, ignore esta mensagem.</p></main>`,
      });
    } catch {
      mailDelivered = false;
    }

    return res.status(mailDelivered ? 201 : 202).json({
      ok: true,
      message: mailDelivered
        ? 'Cadastro recebido. Confirme seu e-mail; depois, a equipe avaliará seus dados para liberar o acesso ao catálogo.'
        : 'Cadastro recebido, mas não foi possível enviar a confirmação agora. Fale com a equipe pelo WhatsApp.',
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um cadastro com estes dados. Entre para continuar ou fale com a equipe CMC.' });
    return next(error);
  }
});

app.post('/api/auth/login', rateLimit('login', 8), requireCsrf, async (req, res, next) => {
  try {
    if (!databaseReady) return res.status(503).json({ error: 'O acesso está sendo preparado. Tente novamente em alguns instantes.' });
    const email = normalizeText(req.body?.email, 191)?.toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const nextPath = safeNext(req.body?.next);
    if (!validEmail(email) || !password) return res.status(422).json({ error: 'Informe seu e-mail e sua senha.' });

    const [users] = await pool.execute('SELECT id, name, email, password_hash, role, review_status, email_verified_at, is_active FROM site_users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];
    if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    if (!user.email_verified_at) return res.status(403).json({ error: 'Confirme seu e-mail para liberar o acesso.', needsVerification: true });

    await createSession(req, res, user.id);
    const isAdmin = user.role === 'admin';
    const requestedCatalog = nextPath === '/catalogo';
    const redirect = isAdmin && nextPath === '/' ? '/admin' : (requestedCatalog && user.review_status !== 'approved' ? '/login?review=pending' : nextPath);
    return res.json({ ok: true, redirect });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/logout', requireCsrf, async (req, res, next) => {
  try {
    await clearSession(req, res);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/resend-verification', rateLimit('resend-verification', 4), requireCsrf, async (req, res, next) => {
  try {
    const email = normalizeText(req.body?.email, 191)?.toLowerCase();
    const response = { ok: true, message: 'Se houver um cadastro pendente neste e-mail, enviaremos uma nova confirmação.' };
    if (!validEmail(email) || !databaseReady) return res.json(response);
    const [users] = await pool.execute('SELECT id, name, email FROM site_users WHERE email = ? AND email_verified_at IS NULL AND is_active = 1 LIMIT 1', [email]);
    const user = users[0];
    if (!user) return res.json(response);
    const token = await issueToken('email_verification_tokens', user.id, 24);
    const verificationUrl = `${publicOrigin()}/verificar-email?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: user.email,
      subject: 'Confirme seu acesso à CMC Enxovais',
      html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24241f"><h1 style="color:#771426">Olá, ${escapeHtml(user.name)}.</h1><p>Use o botão abaixo para confirmar seu e-mail e seguir com a análise do seu cadastro.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:14px 20px;background:#ad1f35;color:#fff;text-decoration:none;border-radius:999px;font-weight:700">Confirmar meu e-mail</a></p><p style="font-size:12px;color:#69675f">Este link expira em 24 horas.</p></main>`,
    });
    return res.json(response);
  } catch (error) {
    console.error('Confirmação de cadastro não reenviada:', error.message);
    return res.json({ ok: true, message: 'Se houver um cadastro pendente neste e-mail, enviaremos uma nova confirmação.' });
  }
});

app.post('/api/auth/forgot-password', rateLimit('forgot-password', 5), requireCsrf, async (req, res, next) => {
  try {
    const email = normalizeText(req.body?.email, 191)?.toLowerCase();
    const channel = req.body?.channel === 'whatsapp' ? 'whatsapp' : 'email';
    const whatsappUrl = `https://wa.me/5537988424250?text=${encodeURIComponent(`Olá! Preciso de ajuda para recuperar o acesso ao site da CMC. Meu e-mail cadastrado é ${email || ''}.`)}`;
    const response = {
      ok: true,
      message: channel === 'whatsapp'
        ? 'Vamos abrir o WhatsApp para a equipe confirmar seus dados com segurança.'
        : 'Se houver uma conta ativa com este e-mail, enviaremos as instruções de recuperação.',
      whatsappUrl: channel === 'whatsapp' ? whatsappUrl : null,
    };

    if (!validEmail(email) || !databaseReady) return res.json(response);
    const [users] = await pool.execute('SELECT id, name, email FROM site_users WHERE email = ? AND email_verified_at IS NOT NULL AND is_active = 1 LIMIT 1', [email]);
    const user = users[0];
    if (!user || channel !== 'email') return res.json(response);

    const resetToken = await issueToken('password_reset_tokens', user.id, 1);
    const resetUrl = `${publicOrigin()}/redefinir-senha?token=${encodeURIComponent(resetToken)}`;
    await sendEmail({
      to: user.email,
      subject: 'Redefina sua senha da CMC Enxovais',
      html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24241f"><h1 style="color:#771426">Olá, ${escapeHtml(user.name)}.</h1><p>Recebemos um pedido para redefinir sua senha. Use o botão abaixo para criar uma nova senha.</p><p><a href="${resetUrl}" style="display:inline-block;padding:14px 20px;background:#ad1f35;color:#fff;text-decoration:none;border-radius:999px;font-weight:700">Redefinir minha senha</a></p><p style="font-size:12px;color:#69675f">Este link expira em uma hora. Se você não fez esta solicitação, pode ignorar esta mensagem.</p></main>`,
    });
    return res.json(response);
  } catch (error) {
    console.error('Recuperação de senha não enviada:', error.message);
    return res.json({ ok: true, message: 'Se houver uma conta ativa com este e-mail, enviaremos as instruções de recuperação.' });
  }
});

app.post('/api/auth/reset-password', rateLimit('reset-password', 6), requireCsrf, async (req, res, next) => {
  try {
    const token = normalizeText(req.body?.token, 160);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const passwordMessage = passwordError(password);
    if (!token || passwordMessage) return res.status(422).json({ error: passwordMessage || 'Link de recuperação inválido.' });

    const [tokens] = await pool.execute(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
       LIMIT 1`,
      [hashToken(token)],
    );
    const reset = tokens[0];
    if (!reset) return res.status(400).json({ error: 'Este link expirou ou já foi utilizado. Solicite uma nova recuperação.' });

    const passwordHash = await hashPassword(password);
    await pool.execute('UPDATE site_users SET password_hash = ? WHERE id = ?', [passwordHash, reset.user_id]);
    await pool.execute('UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?', [reset.id]);
    await pool.execute('DELETE FROM site_sessions WHERE user_id = ?', [reset.user_id]);
    return res.json({ ok: true, message: 'Senha atualizada. Faça login com a nova senha.' });
  } catch (error) {
    return next(error);
  }
});

app.get('/verificar-email', async (req, res, next) => {
  try {
    const token = normalizeText(req.query.token, 160);
    if (!token) return res.redirect(302, '/login?verified=invalid');
    const [tokens] = await pool.execute(
      `SELECT id, user_id FROM email_verification_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
       LIMIT 1`,
      [hashToken(token)],
    );
    const verification = tokens[0];
    if (!verification) return res.redirect(302, '/login?verified=invalid');
    await pool.execute(
      "UPDATE site_users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()), role = CASE WHEN email = ? THEN 'admin' ELSE role END, review_status = CASE WHEN email = ? THEN 'approved' ELSE review_status END WHERE id = ?",
      [adminEmail, adminEmail, verification.user_id],
    );
    await pool.execute('UPDATE email_verification_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?', [verification.id]);
    return res.redirect(302, '/login?verified=1&review=pending');
  } catch (error) {
    return next(error);
  }
});

app.get('/catalogo', async (req, res, next) => {
  try {
    const user = await currentUser(req);
    if (!user) return res.redirect(302, '/login?next=/catalogo');
    if (user.role !== 'admin' && user.review_status !== 'approved') return res.redirect(302, '/login?review=pending');
    return res.redirect(302, catalogUrl);
  } catch (error) {
    return next(error);
  }
});

app.get('/admin', requireAdminPage, (_req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  return res.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('/api/admin/overview', requireAdminApi, async (_req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store');
    const [[summary]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM leads) AS leads_total,
        (SELECT COUNT(*) FROM leads WHERE status = 'novo') AS leads_novos,
        (SELECT COUNT(*) FROM leads WHERE interest = 'Quero revender') AS interessados_revenda,
        (SELECT COUNT(*) FROM site_users WHERE email_verified_at IS NOT NULL) AS usuarios_ativos,
        (SELECT COUNT(*) FROM site_users WHERE email_verified_at IS NOT NULL AND review_status = 'pending' AND role <> 'admin') AS cadastros_pendentes
    `);
    const [leads] = await pool.query(`
      SELECT name, phone, email, city, state, interest, status, created_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT 60
    `);
    const [pendingUsers] = await pool.query(`
      SELECT id, name, email, phone, document_number, created_at
      FROM site_users
      WHERE email_verified_at IS NOT NULL AND review_status = 'pending' AND role <> 'admin'
      ORDER BY created_at ASC
      LIMIT 60
    `);
    return res.json({ summary, leads, pendingUsers });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/admin/users/:id/review', requireAdminApi, requireCsrf, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const reviewStatus = req.body?.reviewStatus;
    if (!Number.isSafeInteger(userId) || !['approved', 'rejected'].includes(reviewStatus)) {
      return res.status(422).json({ error: 'Dados de análise inválidos.' });
    }
    const [result] = await pool.execute(
      "UPDATE site_users SET review_status = ? WHERE id = ? AND role <> 'admin' AND email_verified_at IS NOT NULL",
      [reviewStatus, userId],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Cadastro não encontrado para análise.' });
    return res.json({ ok: true, message: reviewStatus === 'approved' ? 'Cadastro aprovado e acesso ao catálogo liberado.' : 'Cadastro marcado como não aprovado.' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/leads', rateLimit('leads', 12), async (req, res, next) => {
  try {
    if (!databaseReady) return res.status(503).json({ error: 'O cadastro está sendo preparado. Tente novamente em alguns instantes.' });
    const body = req.body || {};
    const honeypot = body.website === undefined ? '' : normalizeText(body.website, 200);
    if (honeypot === null || honeypot) return res.status(204).end();

    const name = normalizeText(body.name, 180);
    const phone = normalizePhone(body.phone);
    const emailValue = normalizeText(body.email, 191);
    const cityValue = normalizeText(body.city, 120);
    const stateValue = normalizeText(body.state, 2);
    const interest = normalizeText(body.interest, 100);
    const message = normalizeText(body.message, 4000);
    const consent = body.consent === true;
    const email = emailValue?.toLowerCase();
    const city = cityValue || null;
    const state = stateValue?.toUpperCase() || null;

    if (!name || name.length < 3 || !phone || !validEmail(email) || !interest || !validInterests.has(interest) || cityValue === null || stateValue === null || (state && !validStates.has(state)) || !message || message.length < 10 || !consent) {
      return res.status(422).json({ error: 'Revise os campos obrigatórios para concluir o cadastro.' });
    }

    const user = await currentUser(req);
    await pool.execute(
      `INSERT INTO leads (user_id, name, phone, email, city, state, interest, message, consent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user?.id || null, name, phone, email, city, state, interest, message, 1],
    );
    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.get(['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha'], authPage);

app.use('/assets', express.static(publicAssetsDir, { fallthrough: true, maxAge: production ? '7d' : 0 }));
app.use('/assets', express.static(commonAssetsDir, { fallthrough: true, maxAge: production ? '7d' : 0 }));

if (production) {
  app.use(express.static(publicDir, { index: ['index.html'], dotfiles: 'deny', fallthrough: true }));
} else {
  app.get(['/styles.css', '/main.js', '/auth.css', '/auth.js', '/admin.css', '/admin.js'], (req, res) => res.sendFile(path.join(rootDir, req.path)));
  app.get('/robots.txt', (_req, res) => res.sendFile(path.join(rootDir, 'public', 'robots.txt')));
  app.get('/manus-routes.json', (_req, res) => res.sendFile(path.join(rootDir, 'public', 'manus-routes.json')));
  app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(rootDir, 'index.html')));
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'Os dados excedem o tamanho permitido.' });
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Dados inválidos.' });
  return res.status(500).json({ error: 'Não foi possível concluir a solicitação. Tente novamente.' });
});

app.use((_req, res) => res.status(404).send('Página não encontrada.'));

app.listen(port, '0.0.0.0', () => {
  console.log(`CMC server listening on ${port}`);
  prepareDatabase();
});
