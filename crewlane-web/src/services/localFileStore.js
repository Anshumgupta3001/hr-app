import { openDB } from 'idb';

const DB_NAME = 'peoplegrid-local-files';
const STORE_NAME = 'files';
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export const localFileStore = {
  async saveBlob(key, blob) {
    const db = await getDb();
    await db.put(STORE_NAME, blob, key);
  },

  async getBlob(key) {
    const db = await getDb();
    return (await db.get(STORE_NAME, key)) || null;
  },

  async deleteBlob(key) {
    const db = await getDb();
    await db.delete(STORE_NAME, key);
  },
};

export default localFileStore;
