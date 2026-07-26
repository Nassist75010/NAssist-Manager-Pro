import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';

export type ScanStatus = 'READ' | 'OCR_ERROR' | 'BLOCKED' | 'AUTHORIZED';

export interface ScanRecordInput {
  prestationNumber: string | null;
  confidence: number;
  rawText: string;
  status: ScanStatus;
  agentName?: string;
}

let database: Database.Database | null = null;

export function getDatabase() {
  if (database) return database;

  const databasePath = path.join(app.getPath('userData'), 'nassist-manager-pro.sqlite');
  database = new Database(databasePath);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prestation_number TEXT,
      confidence REAL NOT NULL,
      raw_text TEXT NOT NULL,
      status TEXT NOT NULL,
      agent_name TEXT NOT NULL DEFAULT 'Agent non renseigné',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return database;
}

export function saveScan(input: ScanRecordInput) {
  const statement = getDatabase().prepare(`
    INSERT INTO scans (prestation_number, confidence, raw_text, status, agent_name)
    VALUES (@prestationNumber, @confidence, @rawText, @status, @agentName)
  `);
  const result = statement.run({ ...input, agentName: input.agentName || 'Agent non renseigné' });
  return Number(result.lastInsertRowid);
}

export function listScans(limit = 100) {
  return getDatabase().prepare(`
    SELECT id,
      prestation_number AS prestationNumber,
      confidence,
      raw_text AS rawText,
      status,
      agent_name AS agentName,
      created_at AS createdAt
    FROM scans
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);
}