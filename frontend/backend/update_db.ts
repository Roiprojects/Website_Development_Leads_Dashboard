import { db } from './src/database';

console.log('Waiting for DB...');
setTimeout(() => {
  db.run("UPDATE records SET status = 'Interested'", (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.log("Successfully updated all records to 'Interested'");
      process.exit(0);
    }
  });
}, 1000);
