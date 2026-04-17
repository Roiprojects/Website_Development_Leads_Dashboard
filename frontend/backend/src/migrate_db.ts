import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Migrating database schema...');

db.serialize(() => {
  db.run('ALTER TABLE records ADD COLUMN gender TEXT', (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "gender" already exists.');
      } else {
        console.error('Error adding "gender" column:', err.message);
      }
    } else {
      console.log('Added column "gender" successfully.');
    }
  });

  db.run('ALTER TABLE records ADD COLUMN origin TEXT', (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('Column "origin" already exists.');
      } else {
        console.error('Error adding "origin" column:', err.message);
      }
    } else {
      console.log('Added column "origin" successfully.');
    }
  });
});

db.close();
