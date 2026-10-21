/**
 * FOXCRAK SYSTEM APS — cuenta global y directorio comunitario.
 * Requiere un Google Sheet PRIVADO vinculado a este proyecto de Apps Script.
 * NO usa Google Forms para contraseñas. Auth.html es el formulario seguro en la web.
 * La hoja Accounts guarda SAL + PBKDF2-HMAC-SHA256, nunca la contraseña original.
 * Prototipo comunitario: para un servicio comercial/de alta seguridad, usa un backend
 * dedicado, rate limiting de red, monitorización y una política formal de recuperación.
 */
const FOXCRAK_DB_ID = ''; // Recomendado: deja el script vinculado al Google Sheet; o pega su ID aquí.
const FOXCRAK_SESSION_DAYS = 30;
const FOXCRAK_PBKDF2_ITERATIONS = 120000;
const FOXCRAK_PUBLIC_MAX = 500;
const FOXCRAK_ACCOUNT_HEADERS = [
  'Serie','UserId','Nickname','NicknameKey','Club','ConsentPublic','PasswordSalt','PasswordHash',
  'Status','XP','Level','Activity','RegisteredAt','LastSeenAt'
];
const FOXCRAK_SESSION_HEADERS = ['SessionHash','UserId','CreatedAt','ExpiresAt','LastSeenAt','Revoked'];

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (String(params.mode || '') === 'auth') {
    return HtmlService.createHtmlOutputFromFile('Auth')
      .setTitle('FOXCRAK SYSTEM APS · Registro global')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  const data = { ok: true, updatedAt: new Date().toISOString(), profiles: foxcrakReadPublicProfiles_() };
  const body = JSON.stringify(data).replace(/</g, '\\u003c');
  const callback = String(params.callback || '');
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
      return ContentService.createTextOutput('{"ok":false,"error":"invalid_callback"}')
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(callback + '(' + body + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutar MANUALMENTE una vez desde el editor de Apps Script. */
function foxcrakSetupDatabase() {
  const ss = foxcrakSpreadsheet_();
  PropertiesService.getScriptProperties().setProperty('FOXCRAK_DB_ID', ss.getId());
  const accountSheet = foxcrakEnsureSheet_(ss, 'Accounts', FOXCRAK_ACCOUNT_HEADERS);
  foxcrakEnsureSheet_(ss, 'Sessions', FOXCRAK_SESSION_HEADERS);
  foxcrakRepairMisalignedAccounts_(accountSheet);
  accountSheet.setFrozenRows(1);
  accountSheet.getRange(1, 1, 1, FOXCRAK_ACCOUNT_HEADERS.length).setFontWeight('bold');
  const sessionSheet = ss.getSheetByName('Sessions');
  sessionSheet.setFrozenRows(1);
  sessionSheet.getRange(1, 1, 1, FOXCRAK_SESSION_HEADERS.length).setFontWeight('bold');
  return 'Base de datos preparada. No publiques el Google Sheet ni compartas acceso de edición.';
}

/** Función llamada por Auth.html; la contraseña entra por HTTPS y nunca se escribe en claro. */
function foxcrakRegisterAccount(nickname, password, club, acceptedRules) {
  nickname = String(nickname || '').trim().normalize('NFKC');
  password = String(password || '');
  club = String(club || '').trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 80);
  if (/^[=+\-@]/.test(club)) return { ok: false, error: 'El nombre del club no puede empezar con =, +, - o @.' };
  const nicknameKey = foxcrakNormalizeNickname_(nickname);
  if (!/^[\p{L}\p{N}][\p{L}\p{N}._ -]{2,23}$/u.test(nickname)) return { ok: false, error: 'Usa un nickname de 3 a 24 caracteres con letras, números, punto, guion o guion bajo.' };
  if (password.length < 10 || password.length > 128) return { ok: false, error: 'La contraseña debe tener entre 10 y 128 caracteres.' };
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return { ok: false, error: 'Usa una contraseña con al menos una letra y un número.' };
  if (acceptedRules !== true) return { ok: false, error: 'Debes aceptar las Normas de la Comunidad y el Aviso de Privacidad para crear una cuenta.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = foxcrakSpreadsheet_();
    const accounts = foxcrakEnsureSheet_(ss, 'Accounts', FOXCRAK_ACCOUNT_HEADERS);
    const headers = foxcrakHeaderMap_(accounts);
    const lastRow = accounts.getLastRow();
    if (lastRow >= 2) {
      const existing = accounts.getRange(2, 1, lastRow - 1, accounts.getLastColumn()).getDisplayValues();
      if (existing.some(row => foxcrakNormalizeNickname_(row[headers.Nickname]) === nicknameKey)) {
        return { ok: false, error: 'Ese nickname ya está registrado. Elige otro o inicia sesión.' };
      }
    }
    const userId = Utilities.getUuid();
    const serial = foxcrakNextSerial_(accounts, headers.Serie);
    const saltBytes = foxcrakRandomSalt_();
    const salt = Utilities.base64EncodeWebSafe(saltBytes);
    const hash = foxcrakPbkdf2_(password, saltBytes, FOXCRAK_PBKDF2_ITERATIONS);
    const now = new Date();
    // ConsentPublic se conserva como encabezado heredado para no romper hojas ya creadas.
    // Las cuentas nuevas se incluyen en el directorio tras aceptar las normas y leer el aviso.
    // Mantener exactamente el orden de FOXCRAK_ACCOUNT_HEADERS (14 columnas).
    const row = [
      '#' + String(serial).padStart(7, '0'), userId, nickname, nicknameKey, club, 'Sí',
      salt, hash, 'Activo', 0, 1, 0, now.toISOString(), now.toISOString()
    ];
    accounts.appendRow(row);
    const token = foxcrakCreateSession_(userId);
    const profile = foxcrakProfileFromRow_(row, headers, true);
    return { ok: true, token: token, profile: profile };
  } finally {
    lock.releaseLock();
  }
}

function foxcrakLoginAccount(nickname, password) {
  nickname = String(nickname || '').trim().normalize('NFKC');
  password = String(password || '');
  const nicknameKey = foxcrakNormalizeNickname_(nickname);
  if (!nicknameKey || password.length < 1 || password.length > 128) return { ok: false, error: 'Nickname o contraseña incorrectos.' };
  const cache = CacheService.getScriptCache();
  const failKey = 'login_fail_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, nicknameKey)).slice(0, 40);
  const currentFailures = Number(cache.get(failKey) || 0);
  if (currentFailures >= 8) return { ok: false, error: 'Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.' };

  const ss = foxcrakSpreadsheet_();
  const sheet = ss.getSheetByName('Accounts');
  if (!sheet || sheet.getLastRow() < 2) return { ok: false, error: 'Nickname o contraseña incorrectos.' };
  const headers = foxcrakHeaderMap_(sheet);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  let matchIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (foxcrakNormalizeNickname_(data[i][headers.Nickname]) === nicknameKey) { matchIndex = i; break; }
  }
  if (matchIndex < 0) {
    cache.put(failKey, String(currentFailures + 1), 600);
    return { ok: false, error: 'Nickname o contraseña incorrectos.' };
  }
  const row = data[matchIndex];
  const accountStatus = foxcrakStatusKey_(row[headers.Status]);
  if (accountStatus === 'suspendido') return { ok: false, error: 'Este perfil está SUSPENDIDO. Contacta con la administración de FOXCRAK.' };
  if (accountStatus !== 'activo' && accountStatus !== 'active') return { ok: false, error: 'Este perfil está EN REVISIÓN o inactivo. Contacta con la administración.' };
  const salt = Utilities.base64DecodeWebSafe(String(row[headers.PasswordSalt] || ''));
  const computed = foxcrakPbkdf2_(password, salt, FOXCRAK_PBKDF2_ITERATIONS);
  if (!foxcrakConstantTimeEquals_(computed, String(row[headers.PasswordHash] || ''))) {
    cache.put(failKey, String(currentFailures + 1), 600);
    return { ok: false, error: 'Nickname o contraseña incorrectos.' };
  }
  cache.remove(failKey);
  const sheetRow = matchIndex + 2;
  sheet.getRange(sheetRow, headers.LastSeenAt + 1).setValue(new Date().toISOString());
  const token = foxcrakCreateSession_(String(row[headers.UserId]));
  row[headers.LastSeenAt] = new Date().toISOString();
  return { ok: true, token: token, profile: foxcrakProfileFromRow_(row, headers, true) };
}

function foxcrakValidateSession(token) {
  const session = foxcrakFindSession_(token);
  if (!session) return { ok: false, error: 'La sesión expiró. Inicia sesión otra vez.' };
  const found = foxcrakFindAccountById_(session.userId);
  if (!found) return { ok: false, error: 'No se encontró el perfil.' };
  const accountStatus = foxcrakStatusKey_(found.row[found.headers.Status]);
  if (accountStatus !== 'activo' && accountStatus !== 'active') return { ok: false, error: accountStatus === 'suspendido' ? 'Este perfil está suspendido.' : 'Este perfil no está activo.' };
  const now = new Date().toISOString();
  found.sheet.getRange(found.rowIndex, found.headers.LastSeenAt + 1).setValue(now);
  found.row[found.headers.LastSeenAt] = now;
  return { ok: true, profile: foxcrakProfileFromRow_(found.row, found.headers, true) };
}

function foxcrakHeartbeat(token) {
  const session = foxcrakFindSession_(token);
  if (!session) return { ok: false };
  const now = new Date();
  const expires = new Date(now.getTime() + FOXCRAK_SESSION_DAYS * 86400000);
  const sessions = foxcrakSpreadsheet_().getSheetByName('Sessions');
  sessions.getRange(session.rowIndex, 5).setValue(now.toISOString());
  sessions.getRange(session.rowIndex, 4).setValue(expires.toISOString());
  const found = foxcrakFindAccountById_(session.userId);
  if (found && ['activo','active'].includes(foxcrakStatusKey_(found.row[found.headers.Status]))) {
    found.sheet.getRange(found.rowIndex, found.headers.LastSeenAt + 1).setValue(now.toISOString());
  } else { return { ok: false }; }
  return { ok: true, at: now.toISOString() };
}

/** Sincroniza únicamente los puntos de progreso del perfil autenticado. */
function foxcrakSaveProgress(token, progress) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const session = foxcrakFindSession_(token);
    if (!session) return { ok: false, error: 'Sesión no válida.' };
    const found = foxcrakFindAccountById_(session.userId);
    if (!found) return { ok: false, error: 'No se encontró el perfil.' };
    if (!['activo','active'].includes(foxcrakStatusKey_(found.row[found.headers.Status]))) return { ok: false, error: 'El perfil no está activo.' };
    progress = progress && typeof progress === 'object' ? progress : {};
    const bounded = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
    const currentXP = Math.max(0, Number(found.row[found.headers.XP]) || 0);
    const requestedXP = bounded(progress.xp, 100000000);
    // Evita que una sola petición cambie de golpe cientos de millones de puntos.
    // El ranking sigue siendo de comunidad informal, no un sistema antifraude.
    const xp = Math.max(currentXP, Math.min(requestedXP, currentXP + 50));
    const currentActivity = Math.max(0, Number(found.row[found.headers.Activity]) || 0);
    const requestedActivity = bounded(progress.activity, 100000000);
    const activity = Math.max(currentActivity, Math.min(requestedActivity, currentActivity + 10));
    const now = new Date().toISOString();
    const updates = {
      XP: xp, Level: Math.max(1, Math.floor(xp / 100) + 1),
      Activity: activity, LastSeenAt: now
    };
    Object.keys(updates).forEach(name => found.sheet.getRange(found.rowIndex, found.headers[name] + 1).setValue(updates[name]));
    const freshRow = foxcrakReadRow_(found.sheet, found.rowIndex);
    return { ok: true, profile: foxcrakProfileFromRow_(freshRow, foxcrakHeaderMap_(found.sheet), true) };
  } finally {
    lock.releaseLock();
  }
}

function foxcrakLogout(token, progress) {
  const session = foxcrakFindSession_(token);
  if (!session) return { ok: true };
  // Guarda el progreso final antes de revocar la sesión.
  if (progress && typeof progress === 'object') foxcrakSaveProgress(token, progress);
  const sheet = foxcrakSpreadsheet_().getSheetByName('Sessions');
  sheet.getRange(session.rowIndex, 6).setValue('Sí');
  return { ok: true };
}

function foxcrakReadPublicProfiles_() {
  const ss = foxcrakSpreadsheet_();
  const sheet = ss.getSheetByName('Accounts');
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = foxcrakHeaderMap_(sheet);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const now = Date.now();
  const profiles = [];
  rows.forEach(row => {
    // Las cuentas antiguas que habían elegido no aparecer siguen ocultas.
    // Las cuentas nuevas se registran en el directorio tras ver el aviso de publicación.
    if (String(row[headers.ConsentPublic] || '').toLowerCase() !== 'sí') return;
    const statusRaw = String(row[headers.Status] || 'Activo');
    const lastSeen = row[headers.LastSeenAt] ? new Date(row[headers.LastSeenAt]).getTime() : 0;
    let status = 'Desconectado';
    if (/suspendid/i.test(statusRaw)) status = 'Suspendido';
    else if (/revision|pendient/i.test(statusRaw)) status = 'En revisión';
    else if (lastSeen && now - lastSeen <= 3 * 60 * 1000) status = 'Activo';
    profiles.push({
      serie: String(row[headers.Serie] || ''), nickname: String(row[headers.Nickname] || ''),
      club: String(row[headers.Club] || ''), xp: Math.max(0, Number(row[headers.XP]) || 0),
      level: Math.max(1, Number(row[headers.Level]) || 1), status: status,
      registeredAt: String(row[headers.RegisteredAt] || ''), activity: Math.max(0, Number(row[headers.Activity]) || 0)
    });
  });
  profiles.sort((a, b) => (b.xp - a.xp) || a.nickname.localeCompare(b.nickname, 'es'));
  return profiles.slice(0, FOXCRAK_PUBLIC_MAX);
}

function foxcrakRepairMisalignedAccounts_(sheet) {
  // Reparación idempotente de filas creadas por una versión previa que escribía
  // 16 valores bajo un esquema de 14 encabezados. Nunca toca salt/hash/identidad.
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 16) return;
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:/.test(value);
  values.forEach((row, index) => {
    if (timestamp(row[14]) && timestamp(row[15]) && !timestamp(row[12]) && !timestamp(row[13])) {
      sheet.getRange(index + 2, 12, 1, 3).setValues([[0, row[14], row[15]]]);
      sheet.getRange(index + 2, 15, 1, 2).clearContent();
    }
  });
}

function foxcrakSpreadsheet_() {
  const savedId = PropertiesService.getScriptProperties().getProperty('FOXCRAK_DB_ID') || '';
  const id = String(FOXCRAK_DB_ID || savedId || '').trim();
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Vincula Apps Script a un Google Sheet y ejecuta foxcrakSetupDatabase.');
  return ss;
}
function foxcrakEnsureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  else {
    const present = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getDisplayValues()[0];
    headers.forEach((header, index) => { if (present[index] !== header) sheet.getRange(1, index + 1).setValue(header); });
  }
  return sheet;
}
function foxcrakHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const map = {};
  headers.forEach((name, index) => { map[String(name).trim()] = index; });
  return map;
}
function foxcrakNextSerial_(sheet, serialCol) {
  if (sheet.getLastRow() < 2) return 1;
  let max = 0;
  sheet.getRange(2, serialCol + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat().forEach(value => {
    const match = String(value || '').match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]) || 0);
  });
  return max + 1;
}
function foxcrakNormalizeNickname_(value) { return String(value || '').normalize('NFKC').trim().toLocaleLowerCase(); }
function foxcrakStatusKey_(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); }
function foxcrakRandomSalt_() { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + '|' + Utilities.getUuid()).slice(0, 16); }
function foxcrakPbkdf2_(password, saltBytes, iterations) {
  // PBKDF2-HMAC-SHA256, bloque 1 (32 bytes), para no almacenar contraseñas en claro.
  const passwordBytes = Utilities.newBlob(String(password), 'text/plain').getBytes();
  const message = saltBytes.concat([0, 0, 0, 1]);
  let u = Utilities.computeHmacSha256Signature(message, passwordBytes);
  let t = u.slice();
  for (let i = 1; i < iterations; i++) {
    u = Utilities.computeHmacSha256Signature(u, passwordBytes);
    for (let j = 0; j < t.length; j++) {
      const x = ((t[j] & 255) ^ (u[j] & 255));
      t[j] = x > 127 ? x - 256 : x;
    }
  }
  return Utilities.base64EncodeWebSafe(t);
}
function foxcrakConstantTimeEquals_(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function foxcrakCreateSession_(userId) {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const tokenHash = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  const now = new Date(); const expires = new Date(now.getTime() + FOXCRAK_SESSION_DAYS * 86400000);
  const sheet = foxcrakEnsureSheet_(foxcrakSpreadsheet_(), 'Sessions', FOXCRAK_SESSION_HEADERS);
  sheet.appendRow([tokenHash, userId, now.toISOString(), expires.toISOString(), now.toISOString(), 'No']);
  return token;
}
function foxcrakFindSession_(token) {
  token = String(token || '');
  if (token.length < 40 || token.length > 100) return null;
  const hash = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  const sheet = foxcrakSpreadsheet_().getSheetByName('Sessions');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getDisplayValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row[0] !== hash || String(row[5]).toLowerCase() === 'sí') continue;
    if (new Date(row[3]).getTime() < Date.now()) { sheet.getRange(i + 2, 6).setValue('Sí'); return null; }
    return { userId: row[1], rowIndex: i + 2 };
  }
  return null;
}
function foxcrakFindAccountById_(userId) {
  const sheet = foxcrakSpreadsheet_().getSheetByName('Accounts');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const headers = foxcrakHeaderMap_(sheet);
  const values = sheet.getRange(2, headers.UserId + 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
  const index = values.findIndex(value => value === userId);
  if (index < 0) return null;
  const rowIndex = index + 2;
  return { sheet: sheet, headers: headers, rowIndex: rowIndex, row: foxcrakReadRow_(sheet, rowIndex) };
}
function foxcrakReadRow_(sheet, rowIndex) { return sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0]; }
function foxcrakProfileFromRow_(row, headers, includePrivateId) {
  return {
    userId: includePrivateId ? String(row[headers.UserId] || '') : undefined,
    serie: String(row[headers.Serie] || ''), nickname: String(row[headers.Nickname] || ''),
    club: String(row[headers.Club] || ''), consentPublic: true,
    status: String(row[headers.Status] || 'Activo'), xp: Math.max(0, Number(row[headers.XP]) || 0),
    level: Math.max(1, Number(row[headers.Level]) || 1), activity: Math.max(0, Number(row[headers.Activity]) || 0),
    registeredAt: String(row[headers.RegisteredAt] || ''), lastSeenAt: String(row[headers.LastSeenAt] || '')
  };
}
