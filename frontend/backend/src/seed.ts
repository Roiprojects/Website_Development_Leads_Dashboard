import { db } from './database';

// ── Indian Names (75% = 750 records) ──
const indianMaleFirst = [
  'Aarav', 'Aditya', 'Ajay', 'Akash', 'Amit', 'Anand', 'Anil', 'Arjun', 'Arun', 'Ashish',
  'Bharat', 'Chetan', 'Deepak', 'Dev', 'Dhruv', 'Dinesh', 'Ganesh', 'Gaurav', 'Girish', 'Gopal',
  'Hari', 'Harish', 'Hemant', 'Hitesh', 'Ishaan', 'Jatin', 'Karan', 'Kartik', 'Kunal', 'Lalit',
  'Mahesh', 'Manish', 'Mohan', 'Mukesh', 'Naman', 'Naresh', 'Naveen', 'Nikhil', 'Nitin', 'Om',
  'Pankaj', 'Paresh', 'Pradeep', 'Pranav', 'Prasad', 'Pratik', 'Rahul', 'Raj', 'Rajesh', 'Rakesh',
  'Ramesh', 'Ravi', 'Rohit', 'Sachin', 'Sagar', 'Sameer', 'Sandeep', 'Sanjay', 'Santosh', 'Shiv',
  'Shubham', 'Siddharth', 'Sunil', 'Suresh', 'Tushar', 'Uday', 'Varun', 'Vijay', 'Vikram', 'Vinay',
  'Vikas', 'Vishal', 'Vivek', 'Yash', 'Yogesh', 'Ankit', 'Abhinav', 'Ashok', 'Brijesh', 'Chirag',
  'Darshan', 'Devendra', 'Govind', 'Jagdish', 'Jayesh', 'Kishore', 'Manoj', 'Mayank', 'Neeraj', 'Piyush',
  'Rajat', 'Rishabh', 'Rohan', 'Sahil', 'Shreyas', 'Sumit', 'Tanmay', 'Umesh', 'Venkat', 'Vineet'
];

const indianFemaleFirst = [
  'Aisha', 'Ananya', 'Anjali', 'Ankita', 'Anusha', 'Asha', 'Bhavna', 'Chitra', 'Deepa', 'Devi',
  'Divya', 'Durga', 'Esha', 'Gauri', 'Geeta', 'Hema', 'Indira', 'Isha', 'Jaya', 'Jyoti',
  'Kajal', 'Kavita', 'Kirti', 'Lakshmi', 'Lata', 'Madhuri', 'Mamta', 'Meena', 'Megha', 'Mira',
  'Nandini', 'Neelam', 'Neha', 'Nisha', 'Padma', 'Pallavi', 'Pooja', 'Priya', 'Radha', 'Rashmi',
  'Rekha', 'Renu', 'Rina', 'Ritu', 'Rupal', 'Sakshi', 'Sandhya', 'Sapna', 'Sarita', 'Seema',
  'Shanti', 'Shilpa', 'Shruti', 'Sita', 'Sneha', 'Sonali', 'Suman', 'Sunita', 'Swati', 'Tanvi',
  'Tara', 'Uma', 'Urmila', 'Vandana', 'Varsha', 'Vidya', 'Vimala', 'Yamini', 'Zara', 'Aditi',
  'Bhavika', 'Charulata', 'Daksha', 'Falguni', 'Harini', 'Indu', 'Janki', 'Komal', 'Lavanya', 'Mitali',
  'Namrata', 'Payal', 'Rachana', 'Shalini', 'Smita', 'Suchitra', 'Trupti', 'Urvashi', 'Vasundhara', 'Vrinda',
  'Aparna', 'Archana', 'Chanda', 'Dipti', 'Garima', 'Heeral', 'Juhi', 'Kriti', 'Mansi', 'Preeti'
];

const indianLastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Rao',
  'Joshi', 'Mishra', 'Tiwari', 'Pandey', 'Dubey', 'Srivastava', 'Agarwal', 'Banerjee', 'Chatterjee', 'Mukherjee',
  'Das', 'Bose', 'Ghosh', 'Sen', 'Roy', 'Dutta', 'Pillai', 'Menon', 'Desai', 'Shah',
  'Mehta', 'Jain', 'Chopra', 'Kapoor', 'Malhotra', 'Khanna', 'Bhatia', 'Sinha', 'Saxena', 'Thakur',
  'Chauhan', 'Yadav', 'Rajput', 'Kulkarni', 'Patil', 'Hegde', 'Shetty', 'Gowda', 'Naidu', 'Sethi',
  'Choudhury', 'Mahajan', 'Bhat', 'Bhatt', 'Kaur', 'Gill', 'Sidhu', 'Bajaj', 'Lal', 'Rathore',
  'Trivedi', 'Goswami', 'Shukla', 'Dwivedi', 'Bhardwaj', 'Oberoi', 'Tandon', 'Mitra', 'Chakraborty', 'Ganguly',
  'Karnik', 'Khatri', 'Nanda', 'Parmar', 'Pawar', 'Solanki', 'Thapar', 'Wadia', 'Tendulkar', 'Kohli'
];

// ── Foreign Names (25% = 250 records) ──
const foreignMaleFirst = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin',
  'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary',
  'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel',
  'Liam', 'Noah', 'Oliver', 'Ethan', 'Lucas', 'Mason', 'Logan', 'Alexander', 'Henry', 'Sebastian',
  'Pierre', 'Jean', 'François', 'Marco', 'Luca', 'Hans', 'Klaus', 'Carlos', 'Miguel', 'Ahmed',
  'Omar', 'Yusuf', 'Hiroshi', 'Kenji', 'Takeshi', 'Wei', 'Chen', 'Min', 'Seo', 'Jun',
  'Lars', 'Erik', 'Stefan', 'Ivan', 'Dmitri', 'Nikolai', 'Alejandro', 'Fernando', 'Ricardo', 'Diego'
];

const foreignFemaleFirst = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna',
  'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
  'Marie', 'Sophie', 'Lucia', 'Elena', 'Yuki', 'Sakura', 'Hana', 'Fatima', 'Aisha', 'Nadia',
  'Ingrid', 'Helga', 'Katarina', 'Natasha', 'Olga', 'Ana', 'Carmen', 'Rosa', 'Valentina', 'Bianca',
  'Astrid', 'Freya', 'Mei', 'Ling', 'Suki', 'Ji', 'Yuna', 'Mina', 'Petra', 'Greta'
];

const foreignLastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Dubois', 'Müller', 'Schmidt', 'Rossi', 'Ferrari', 'Bianchi', 'Tanaka', 'Suzuki', 'Yamamoto', 'Kim',
  'Park', 'Johansson', 'Andersson', 'Petrov', 'Ivanov', 'Fernandez', 'Moreno', 'Jimenez', 'Silva', 'Santos',
  'Costa', 'Oliveira', 'Berg', 'Hansen', 'Lindberg', 'Nakamura', 'Watanabe', 'Chen', 'Wang', 'Zhang'
];

const categories = ['Design', 'Development', 'Marketing', 'Sales', 'Other'];
const statuses = ['Pending', 'In Progress', 'Completed'];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomPhone = (): string => {
  return `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`;
};

const getRandomDate = (): string => {
  const start = new Date(2026, 0, 1).getTime();
  const end = new Date(2026, 11, 31).getTime();
  const date = new Date(start + Math.random() * (end - start));
  return date.toISOString().split('T')[0];
};

console.log('Waiting for DB to initialize...');

setTimeout(() => {
  // First clear existing records
  db.run('DELETE FROM records', (err) => {
    if (err) {
      console.error('Error clearing records:', err);
      process.exit(1);
    }
    console.log('Cleared existing records.');

    console.log('Seeding 1000 records (750 Indian + 250 Foreign)...');
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`INSERT INTO records (name, category, date, status) VALUES (?, ?, ?, ?)`);

      // 750 Indian names
      for (let i = 0; i < 750; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale ? getRandom(indianMaleFirst) : getRandom(indianFemaleFirst);
        const lastName = getRandom(indianLastNames);
        const name = `${firstName} ${lastName}`;
        const category = getRandom(categories);
        const date = getRandomDate();
        const status = getRandom(statuses);
        stmt.run(name, category, date, status);
      }

      // 250 Foreign names
      for (let i = 0; i < 250; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale ? getRandom(foreignMaleFirst) : getRandom(foreignFemaleFirst);
        const lastName = getRandom(foreignLastNames);
        const name = `${firstName} ${lastName}`;
        const category = getRandom(categories);
        const date = getRandomDate();
        const status = getRandom(statuses);
        stmt.run(name, category, date, status);
      }

      stmt.finalize();
      db.run('COMMIT', () => {
        console.log('✅ Successfully seeded 1000 records!');
        console.log('   - 750 Indian names (75%)');
        console.log('   - 250 Foreign names (25%)');
        process.exit(0);
      });
    });
  });
}, 1000);
