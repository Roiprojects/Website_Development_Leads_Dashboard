import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

const indianMen = ['Aarav', 'Vihaan', 'Arjun', 'Sai', 'Aryan', 'Aaditya', 'Krishna', 'Ishaan', 'Kabir', 'Rohan', 'Amit', 'Anay', 'Atharv', 'Dev', 'Shaurya', 'Tushar', 'Pranav', 'Rishi', 'Siddharth', 'Vikram'];
const indianWomen = ['Ananya', 'Diya', 'Ishani', 'Kavya', 'Myra', 'Navya', 'Saanvi', 'Tanvi', 'Vanya', 'Zara', 'Priya', 'Aadhya', 'Sia', 'Kiara', 'Ira', 'Avni', 'Riya', 'Amara', 'Jhiya', 'Meera'];
const foreignMen = ['Liam', 'Noah', 'Oliver', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Theodore', 'Jack', 'Levi', 'Alexander', 'Jackson', 'Mateo', 'Daniel', 'Michael', 'Mason', 'Sebastian', 'Ethan', 'Logan'];
const foreignWomen = ['Olivia', 'Emma', 'Amelia', 'Sophia', 'Charlotte', 'Ava', 'Isabella', 'Mia', 'Luna', 'Harper', 'Gianna', 'Evelyn', 'Aria', 'Ella', 'Ellie', 'Scarlett', 'Mila', 'Layla', 'Nora', 'Hazel'];

db.all('SELECT id FROM records', (err, rows: any[]) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Updating ${rows.length} records...`);

  db.serialize(() => {
    const stmt = db.prepare('UPDATE records SET name = ?, gender = ?, origin = ? WHERE id = ?');
    
    rows.forEach((row, index) => {
      const isIndian = Math.random() < 0.85;
      const origin = isIndian ? 'Indian' : 'Foreign';
      const isMale = Math.random() < 0.5;
      const gender = isMale ? 'Male' : 'Female';
      
      let name = '';
      if (isIndian) {
        name = (isMale ? indianMen[Math.floor(Math.random() * indianMen.length)] : indianWomen[Math.floor(Math.random() * indianWomen.length)]) as string;
        const lastName = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Reddy', 'Nair', 'Iyer', 'Prasad'][Math.floor(Math.random() * 10)];
        name = `${name} ${lastName}`;
      } else {
        name = (isMale ? foreignMen[Math.floor(Math.random() * foreignMen.length)] : foreignWomen[Math.floor(Math.random() * foreignWomen.length)]) as string;
        const lastName = ['Smith', 'Johnson', 'Brown', 'Taylor', 'Miller', 'Wilson', 'Anderson', 'Thomas', 'Jackson', 'White'][Math.floor(Math.random() * 10)];
        name = `${name} ${lastName}`;
      }

      stmt.run([name, gender, origin, row.id]);
    });

    stmt.finalize(() => {
      console.log('Finished updating records.');
      db.close();
    });
  });
});
