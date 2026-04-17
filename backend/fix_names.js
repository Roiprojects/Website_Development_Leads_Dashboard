const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const foreignNames = [
  "James Smith", "Michael Johnson", "Robert Williams", "Maria Garcia",
  "David Brown", "Maria Rodriguez", "Mary Martinez", "John Hernandez",
  "Richard Lopez", "Thomas Gonzalez", "Charles Wilson", "Christopher Anderson",
  "Daniel Thomas", "Matthew Taylor", "Anthony Moore", "Mark Jackson",
  "Donald Martin", "Steven Lee", "Paul Perez", "Andrew Thompson",
  "Joshua White", "Kenneth Harris", "Kevin Sanchez", "Brian Clark",
  "George Ramirez", "Edward Lewis", "Ronald Robinson", "Timothy Walker",
  "Jason Young", "Jeffrey Allen", "Ryan King", "Jacob Wright",
  "Gary Scott", "Nicholas Torres", "Eric Nguyen", "Jonathan Hill",
  "Stephen Flores", "Larry Green", "Justin Adams", "Scott Nelson"
];

const indianNames = [
  "Aarav Patel", "Vihaan Sharma", "Vivaan Singh", "Ananya Reddy",
  "Diya Desai", "Aditya Kumar", "Sai Joshi", "Arjun Mehta",
  "Riya Gupta", "Aarohi Nair", "Kavya Rao", "Isha Verma",
  "Neha Iyer", "Rohan Pillai", "Rahul Kapoor", "Sneha Menon",
  "Pooja Bhat", "Karan Ahluwalia", "Simran Chawla", "Rajesh Khanna",
  "Amitabh Bachchan", "Shahrukh Khan", "Salman Khan", "Aamir Khan",
  "Akshay Kumar", "Ajay Devgn", "Hrithik Roshan", "Ranbir Kapoor",
  "Ranveer Singh", "Varun Dhawan", "Tiger Shroff", "Ayushmann Khurrana",
  "Rajkummar Rao", "Vicky Kaushal", "Sushant Singh Rajput", "Karthik Aryan",
  "Ishaan Khatter", "Siddhant Chaturvedi", "Rishabh Pant", "Hardik Pandya"
];

db.all("SELECT id, name FROM records ORDER BY id DESC LIMIT 50", [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }

  const seen = new Set();
  const duplicates = [];

  rows.forEach(row => {
    if (seen.has(row.name)) {
      duplicates.push(row);
    } else {
      seen.add(row.name);
    }
  });

  console.log(`Found ${duplicates.length} duplicates in the top 50 records.`);

  duplicates.forEach((row, i) => {
    // Pick a random unique name
    let newName = i % 4 === 0 ? foreignNames[Math.floor(Math.random() * foreignNames.length)] : indianNames[Math.floor(Math.random() * indianNames.length)];
    // Add a random number just to make sure it's strictly unique visually for this test
    newName = `${newName} ${Math.floor(Math.random() * 100)}`;
    
    db.run("UPDATE records SET name = ? WHERE id = ?", [newName, row.id], (err) => {
      if (err) {
        console.error(`Failed to update ${row.name}:`, err);
      } else {
        console.log(`Updated ${row.name} to ${newName}`);
      }
    });
  });

  setTimeout(() => db.close(), 1000);
});
