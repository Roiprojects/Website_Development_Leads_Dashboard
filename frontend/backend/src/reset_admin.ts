import bcrypt from 'bcryptjs';
import { db } from './database';

console.log('Resetting admin password to default...');

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('admin123', salt);

db.run(`UPDATE users SET password = ? WHERE username = ?`, [hash, 'admin'], function (err) {
  if (err) {
    console.error('Failed to reset password:', err);
    process.exit(1);
  }
  
  if (this.changes === 0) {
    console.log('No admin user found. Creating one...');
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['admin', hash], (err) => {
      if (err) {
        console.error('Failed to create admin user:', err);
        process.exit(1);
      }
      console.log('New admin user created successfully.');
      console.log('Username: admin');
      console.log('Password: admin123');
      process.exit(0);
    });
  } else {
    console.log('Admin password has been reset successfully.');
    console.log('Username: admin');
    console.log('Password: admin123');
    process.exit(0);
  }
});
