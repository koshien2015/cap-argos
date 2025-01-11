import sqlite3
from pathlib import Path

class AnalysisDB:
    def __init__(self, db_path: str = "sqlite.db"):
        self.db_path = db_path
        
    def get_cursor(self):
        """データベース接続とカーソルを返す"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        return conn, cursor