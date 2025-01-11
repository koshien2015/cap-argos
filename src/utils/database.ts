import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDatabaseConnection() {
  if (!db) {
    const dbPath = path.join(process.cwd(), "sqlite.db");
    db = new Database(dbPath);
  }
  return db;
}