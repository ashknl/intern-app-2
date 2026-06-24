import { app } from "electron";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "app.db");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isFirstRun = !fs.existsSync(dbPath);

  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");

  if (isFirstRun) {
    runMigrations(db);
  }

  return db;
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  security_question: string;
  security_answer_hash: string;
  created_at: string;
}

export function createUser(
  username: string,
  passwordHash: string,
  securityQuestion: string,
  securityAnswerHash: string,
): number {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO users (username, password_hash, security_question, security_answer_hash)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    username,
    passwordHash,
    securityQuestion,
    securityAnswerHash,
  );
  return Number(result.lastInsertRowid);
}

export function getUserByUsername(username: string): UserRow | undefined {
  const database = getDb();
  const stmt = database.prepare("SELECT * FROM users WHERE username = ?");
  return stmt.get(username) as UserRow | undefined;
}

export function getUserSecurityQuestion(username: string): string | undefined {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT security_question FROM users WHERE username = ?",
  );
  const row = stmt.get(username) as { security_question: string } | undefined;
  return row?.security_question;
}

export function updatePassword(
  username: string,
  newPasswordHash: string,
): boolean {
  const database = getDb();
  const stmt = database.prepare(
    "UPDATE users SET password_hash = ? WHERE username = ?",
  );
  const result = stmt.run(newPasswordHash, username);
  return result.changes > 0;
}

function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      security_question TEXT NOT NULL,
      security_answer_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO users (username, password_hash, security_question, security_answer_hash)
    SELECT 'admin', '$2b$10$DfrPWeWOwWKGyiuL2U4yOur2sp04WtRKZjFukoS540/OrrNBV4q1W', 'Who is the administrator?', '$2b$10$3GR7UZPHq0w0jXlgTZ44i.0.fZqhDEpMM7SkmGCIe/PvTstepDveK'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
  `)
}
