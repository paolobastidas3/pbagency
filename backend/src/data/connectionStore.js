import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Persistencia simple en JSON: alcanza para una app de agencia con pocos
// clientes. Guarda, por cliente, el token de página de Meta necesario para
// leer sus datos de Instagram/Facebook. Nunca se versiona (ver .gitignore).
const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE_PATH = join(__dirname, 'connections.json');

function readAll() {
  if (!existsSync(FILE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(FILE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  mkdirSync(dirname(FILE_PATH), { recursive: true });
  writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

export function getConnection(clientId) {
  return readAll()[clientId] || null;
}

export function saveConnection(clientId, connection) {
  const all = readAll();
  all[clientId] = { ...connection, connectedAt: new Date().toISOString() };
  writeAll(all);
  return all[clientId];
}

export function removeConnection(clientId) {
  const all = readAll();
  delete all[clientId];
  writeAll(all);
}
