const fs = require('fs/promises');
const path = require('path');

const STORE_FILENAME = 'inventory.store.json';
const STORE_PATH = path.join(__dirname, STORE_FILENAME);

const resolveStorageMode = () => {
  const configured = (process.env.INVENTORY_STORAGE ?? '').toLowerCase();
  if (configured === 'file' || configured === 'netlify') {
    return configured;
  }

  return process.env.NETLIFY === 'true' ? 'netlify' : 'file';
};

const storageMode = resolveStorageMode();

let blobStore = null;

const getBlobStore = () => {
  if (storageMode !== 'netlify') {
    return null;
  }

  if (!blobStore) {
    const { getStore } = require('@netlify/blobs');
    blobStore = getStore({ name: 'poster-inventory' });
  }

  return blobStore;
};

const readFileStore = async () => {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if ((error && error.code) === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const writeFileStore = async (data) => {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2));
};

const readBlobStore = async () => {
  const store = getBlobStore();
  if (!store) {
    return null;
  }

  return store.get('inventory', { type: 'json' });
};

const writeBlobStore = async (data) => {
  const store = getBlobStore();
  if (!store) {
    throw new Error('Netlify blob store is not configured.');
  }

  await store.setJSON('inventory', data);
};

const readStore = async () => {
  if (storageMode === 'netlify') {
    const json = await readBlobStore();
    if (json && typeof json === 'object') {
      return json;
    }
    return null;
  }

  return readFileStore();
};

const writeStore = async (data) => {
  if (storageMode === 'netlify') {
    return writeBlobStore(data);
  }

  return writeFileStore(data);
};

module.exports = {
  readStore,
  writeStore,
  storageMode
};
