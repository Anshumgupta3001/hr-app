import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

const DIR = `${FileSystem.documentDirectory}peoplegrid-documents/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

export const localFileStore = {
  async saveFile(file) {
    await ensureDir();
    const ext = (file.name || 'file').split('.').pop();
    const dest = `${DIR}${uuidv4()}.${ext}`;
    await FileSystem.copyAsync({ from: file.uri, to: dest });
    return dest;
  },

  async deleteFile(uri) {
    if (!uri) return;
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // best-effort cleanup only
    }
  },
};

export default localFileStore;
