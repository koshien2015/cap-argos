// eslint-disable-next-line
const sqlite3 = require('sqlite3')
// eslint-disable-next-line
const { open } = require('sqlite')
const path = require("path");

let db = null;

async function getDatabaseConnection() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), "sqlite.db"),
      driver: sqlite3.Database
    })
  }
  return db;
}

module.exports = { getDatabaseConnection };