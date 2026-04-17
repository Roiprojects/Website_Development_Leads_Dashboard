import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const indianFirstNames = [
  'Aarav', 'Arjun', 'Aditya', 'Vivaan', 'Vihaan', 'Krishna', 'Sai', 'Aryan', 'Ishaan', 'Shaurya', 
  'Ansh', 'Muhammad', 'Rehan', 'Ayaan', 'Viraj', 'Kabir', 'Advik', 'Reyansh', 'Agastya', 'Dhruv', 
  'Kiyansh', 'Vedant', 'Atharv', 'Arush', 'Ayush', 'Pranav', 'Rishabh', 'Shivam', 'Yash', 'Zayan', 
  'Aadhya', 'Ananya', 'Diya', 'Pihu', 'Prisha', 'Myra', 'Ira', 'Advika', 'Saanvi', 'Zara', 
  'Navya', 'Siya', 'Anvi', 'Pari', 'Riya', 'Shanaya', 'Kavya', 'Ishita', 'Avani', 'Vanya', 
  'Manya', 'Amaira', 'Inaya', 'Kyra', 'Trisha', 'Zahra', 'Aarya', 'Ishanvi', 'Mishka', 'Sarah', 
  'Sia', 'Viha', 'Vedika', 'Zoya', 'Advit', 'Darsh', 'Heyansh', 'Hridaan', 'Ivaan', 'Jivaj',
  'Arnav', 'Bhavin', 'Chirag', 'Dev', 'Eshan', 'Faiyaz', 'Gautam', 'Hardik', 'Inder', 'Jai'
];

const indianLastNames = [
  'Sharma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Shah', 'Verma', 'Reddy', 'Nair', 'Iyer', 
  'Rao', 'Choudhury', 'Khan', 'Joshi', 'Kulkarni', 'Yadav', 'Mishra', 'Das', 'Bose', 'Chatterjee', 
  'Saxena', 'Malhotra', 'Mehra', 'Khanna', 'Kapoor', 'Chauhan', 'Thakur', 'Pandey', 'Shrivastav', 
  'Bhattacharya', 'Mukherjee', 'Banerjee', 'Agarwal', 'Bansal', 'Goel', 'Mittal', 'Singhal', 
  'Somani', 'Tibrewal', 'Soni', 'Basu', 'Sen', 'Dutta', 'Pillai'
];

const intlFirstNames = [
  'Liam', 'Noah', 'Oliver', 'James', 'Elijah', 'William', 'Henry', 'Lucas', 'Benjamin', 'Theodore', 
  'Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Mia', 'Isabella', 'Harper', 'Evelyn', 'Gianna', 
  'Alexander', 'Sebastian', 'Jack', 'Owen', 'Samuel', 'Joseph', 'John', 'David', 'Wyatt', 'Luke', 
  'Asher', 'Julian', 'Leo', 'Ezra', 'Isaac', 'Anthony', 'Dylan', 'Thomas', 'Charles', 'Christopher'
];

const intlLastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 
  'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 
  'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez'
];

const categories = ['Website Dev', 'SEO Service', 'Mobile App', 'Social Media', 'Content Writing'];
const statuses = ['Interested', 'Completed', 'In Progress', 'Pending'];

function generateNames(count: number, firsts: string[], lasts: string[]): string[] {
  const names = new Set<string>();
  while (names.size < count) {
    const fn = firsts[Math.floor(Math.random() * firsts.length)];
    const ln = lasts[Math.floor(Math.random() * lasts.length)];
    names.add(`${fn} ${ln}`);
  }
  return Array.from(names);
}

async function seed() {
  console.log('Generating 1000 unique names...');
  
  const indianNames = generateNames(800, indianFirstNames, indianLastNames);
  const internationalNames = generateNames(200, intlFirstNames, intlLastNames);
  
  const allRecords: any[] = [];
  
  indianNames.forEach(name => {
    allRecords.push({
      name,
      origin: 'Indian',
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0]
    });
  });
  
  internationalNames.forEach(name => {
    allRecords.push({
      name,
      origin: 'International',
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split('T')[0]
    });
  });

  db.serialize(() => {
    db.run('DELETE FROM records', (err) => {
      if (err) console.error(err);
      else console.log('Cleared existing records.');
    });

    const stmt = db.prepare('INSERT INTO records (name, category, date, status, origin) VALUES (?, ?, ?, ?, ?)');
    allRecords.forEach(r => {
      stmt.run(r.name, r.category, r.date, r.status, r.origin);
    });
    stmt.finalize();
    
    console.log('Seeded 1000 records (800 Indian, 200 International).');
  });
  
  db.close();
}

seed();
