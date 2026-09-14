import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_FILE = path.join(process.cwd(), 'data', 'food_forecast.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs({
    locateFile: (file) => {
      // Check multiple locations for sql-wasm.wasm
      const candidate1 = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
      if (fs.existsSync(candidate1)) return candidate1;
      return file;
    },
  });

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run("PRAGMA foreign_keys = ON;");
  
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error("Database not initialized");
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function get<T = any>(sql: string, params: any[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  if (!dbInstance) throw new Error("Database not initialized");
  dbInstance.run(sql, params);
  
  let lastInsertRowid = 0;
  try {
    const res = dbInstance.exec("SELECT last_insert_rowid();");
    if (res.length > 0 && res[0].values.length > 0 && res[0].values[0].length > 0) {
      lastInsertRowid = Number(res[0].values[0][0]) || 0;
    }
  } catch (e) {
    // ignore
  }

  let changes = 0;
  try {
    changes = dbInstance.getRowsModified();
  } catch (e) {
    // ignore
  }

  saveDb();
  return { changes, lastInsertRowid };
}
