// db.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbFile = path.join(dataDir, 'bookings.db');
const db = new Database(dbFile);

// Inicializar tablas si no existen
db.exec(`
CREATE TABLE IF NOT EXISTS professionals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bio TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  work_start TEXT DEFAULT '09:00',   -- horas de trabajo (diarias)
  work_end TEXT DEFAULT '17:00'
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  start_iso TEXT NOT NULL,
  end_iso TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (professional_id) REFERENCES professionals(id)
);
`);

// Funciones útiles
function listProfessionals() {
  return db.prepare('SELECT id, name, bio, duration_minutes, work_start, work_end FROM professionals').all();
}

function getProfessional(id) {
  return db.prepare('SELECT * FROM professionals WHERE id = ?').get(id);
}

function listBookingsForProfessionalBetween(id, start_iso, end_iso) {
  return db.prepare(
    `SELECT * FROM bookings WHERE professional_id = ? AND NOT (end_iso <= ? OR start_iso >= ?)`
  ).all(id, start_iso, end_iso);
}

function createBooking(professional_id, client_name, client_email, start_iso, end_iso) {
  const exists = db.prepare(
    `SELECT 1 FROM bookings WHERE professional_id = ? AND NOT (end_iso <= ? OR start_iso >= ?)`
  ).get(professional_id, start_iso, end_iso);

  if (exists) {
    const err = new Error('Slot ocupado');
    err.code = 'CONFLICT';
    throw err;
  }

  const info = db.prepare(
    `INSERT INTO bookings (professional_id, client_name, client_email, start_iso, end_iso) VALUES (?, ?, ?, ?, ?)`
  ).run(professional_id, client_name, client_email, start_iso, end_iso);

  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid);
}

function seedIfEmpty() {
  const count = db.prepare('SELECT count(1) as c FROM professionals').get().c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO professionals (name, bio, duration_minutes, work_start, work_end) VALUES (?, ?, ?, ?, ?)');
    insert.run('Dra. Ana Pérez', 'Psicóloga clínica — terapia cognitivo-conductual', 50, '09:00', '17:00');
    insert.run('Lic. Roberto Ruiz', 'Psicólogo adulto y adolescente', 50, '10:00', '18:00');
    insert.run('Dra. María Gómez', 'Psiquiatra — evaluación y manejo farmacológico', 30, '08:30', '14:30');
  }
}

seedIfEmpty();

module.exports = {
  db,
  listProfessionals,
  getProfessional,
  listBookingsForProfessionalBetween,
  createBooking
};
