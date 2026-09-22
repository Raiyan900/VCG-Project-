const mongoose = require("mongoose");
const { DB_NAME } = require("../constants");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";

  try {
    await mongoose.connect(`${uri}/${DB_NAME}`);

    console.log(`[db] connected to ${DB_NAME}`);
  } catch (err) {
    console.error("[db] connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;