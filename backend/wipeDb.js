const mongoose = require("mongoose");


const MONGO_URI = "mongodb+srv://ankitt7222_db_user:NFDuqAJLiCDPnbd7@cluster0.ihm8c7f.mongodb.net/judex_fresh?appName=Cluster0"; 

async function wipeDatabase() {
  try {
    console.log("Connecting to MongoDB Atlas Cluster...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

   
    const db = mongoose.connection.db;


    const collections = await db.listCollections().toArray();

    console.log(`Found ${collections.length} collections. Beginning purge...`);

    for (let col of collections) {
      await db.collection(col.name).drop();
      console.log(`Dropped Collection: ${col.name}`);
    }

    console.log("\nDATABASE COMPLETELY WIPED! SYSTEM LOGS ARE BLANK.");
    console.log("You can now restart your backend server and create a fresh Enterprise Admin account profile.");
  } catch (err) {
    console.error("Purge aborted due to system error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

wipeDatabase();