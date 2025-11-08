// This is a one-time-use tool to create a correct hash.
const bcrypt = require('bcryptjs');

// The PIN we want to hash
const pin = '1234';
const saltRounds = 10;

console.log(`Hashing PIN: "${pin}" ...`);

bcrypt.hash(pin, saltRounds, (err, hash) => {
  if (err) {
    console.error("Error creating hash:", err);
    return;
  }
  
  console.log("\n--- HASH CREATED SUCCESSFULLY ---");
  console.log("This is the 100% correct hash for '1234' on your system:");
  console.log("\n");
  console.log(hash); // This will print the real hash
  console.log("\n");
  console.log("Please copy this hash and use it in your DBeaver UPDATE command.");
});
