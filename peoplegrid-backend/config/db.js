const mongoose = require('mongoose');

// Serialize with virtuals so every document (and subdocument) exposes `id`
// alongside `_id` — the frontends have always keyed on `id`.
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

async function connectDb() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || 'hr',
  });
  console.log(`Connected to MongoDB (db: ${process.env.MONGO_DB_NAME || 'hr'})`);
}

module.exports = { connectDb };
