import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Create users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        recovery_pin TEXT DEFAULT '1234'
      )`);

      // Create records table
      db.run(`CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        gender TEXT,
        origin TEXT
      )`);

      // Seed an admin user if not exists
      db.get(`SELECT * FROM users WHERE username = ?`, ['admin'], (err, row) => {
        if (!row) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync('admin123', salt);
          db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['admin', hash]);
          console.log('Seeded default admin user (admin/admin123)');
        }
      });
      
      // Seed some test records if empty
      db.get(`SELECT COUNT(*) as count FROM records`, (err, row: any) => {
        if (row && row.count === 0) {
          const stmt = db.prepare(`INSERT INTO records (name, category, date, status) VALUES (?, ?, ?, ?)`);
          stmt.run('Website Redesign', 'Design', '2026-03-01', 'Completed');
          stmt.run('API Integration', 'Development', '2026-03-10', 'In Progress');
          stmt.run('Q1 Marketing Report', 'Marketing', '2026-03-15', 'Pending');
          stmt.run('Database Migration', 'Development', '2026-03-20', 'In Progress');
          stmt.finalize();
          console.log('Seeded test records');
        }
      });

      // Create and seed monthly_enquiries table
      db.run(`CREATE TABLE IF NOT EXISTS monthly_enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        year INTEGER NOT NULL,
        value INTEGER NOT NULL DEFAULT 0,
        UNIQUE(month, year)
      )`);

      db.get('SELECT COUNT(*) as count FROM monthly_enquiries', (err, row: any) => {
        if (row && row.count === 0) {
          console.log('Seeding monthly_enquiries (Jan 2026 - Dec 2030)...');
          const stmt = db.prepare('INSERT INTO monthly_enquiries (month, year, value) VALUES (?, ?, ?)');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          for (let i = 0; i < 60; i++) {
            const year = 2026 + Math.floor(i / 12);
            const monthInfo = months[i % 12];
            const staticVal = 100 + ((i * 47) % 60) + ((i % 3 === 0) ? 50 : 0);
            stmt.run([monthInfo, year, staticVal]);
          }
          stmt.finalize();
          console.log('Seeded 60 months of enquiries');
        }
      });

      // Create and seed settings table
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`);

      db.get('SELECT value FROM settings WHERE key = ?', ['project_title'], (err, row: any) => {
        if (!row) {
          db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['project_title', 'Website Development Leads']);
          console.log('Seeded default project title');
        }
      });

      db.get('SELECT value FROM settings WHERE key = ?', ['total_enquiries_override'], (err, row: any) => {
        if (!row) {
          db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['total_enquiries_override', '0']);
          console.log('Seeded default total_enquiries_override');
        }
      });

      db.get('SELECT value FROM settings WHERE key = ?', ['display_date'], (err, row: any) => {
        if (!row) {
          db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['display_date', '']);
          console.log('Seeded empty default display_date');
        }
      });

      // Create and seed daily_enquiries table
      db.run(`CREATE TABLE IF NOT EXISTS daily_enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        value INTEGER NOT NULL DEFAULT 0
      )`);

      db.get('SELECT COUNT(*) as count FROM daily_enquiries', (err, row: any) => {
        if (row && row.count === 0) {
          console.log('Seeding daily_enquiries (last 14 days)...');
          const stmt = db.prepare('INSERT INTO daily_enquiries (date, value) VALUES (?, ?)');
          for (let i = 0; i < 15; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (14 - i));
            const dStr = date.toISOString().split('T')[0];
            const val = 5 + Math.floor(Math.random() * 15);
            stmt.run([dStr, val]);
          }
          stmt.finalize();
          console.log('Seeded 15 days of daily enquiries');
        }
      });
    });
  }
});

// Helper for queries that return promises
export const query = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};
