const fs = require('fs/promises');
const path = require('path');

const STORE_FILENAME = 'inventory.store.json';
const STORE_PATH = path.join(__dirname, STORE_FILENAME);

const resolveStorageMode = () => {
  const configured = (process.env.INVENTORY_STORAGE ?? '').toLowerCase();
  if (configured === 'file') {
    return 'file';
  }

  if (configured === 'netlify') {
    if (process.env.NETLIFY_BLOBS_CONTEXT) {
      return 'netlify';
    }
    console.warn(
      '[inventory] INVENTORY_STORAGE=netlify but NETLIFY_BLOBS_CONTEXT is missing. Falling back to file storage.'
    );
    return 'file';
  }

  if (process.env.NETLIFY_BLOBS_CONTEXT) {
    return 'netlify';
  }

  return 'file';
};

const getStorageMode = () => resolveStorageMode();

const getBlobStoreConfig = () => {
  const siteID =
    process.env.NETLIFY_BLOBS_SITE_ID ||
    process.env.NETLIFY_SITE_ID ||
    process.env.NETLIFY_INTERNAL_SITE_ID ||
    null;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN ||
    null;

  if (siteID && token) {
    return { name: 'poster-inventory', siteID, token };
  }

  return { name: 'poster-inventory' };
};

let blobStore = null;

const getBlobStore = () => {
  if (getStorageMode() !== 'netlify') {
    blobStore = null;
    return null;
  }

  if (!blobStore) {
    const { getStore } = require('@netlify/blobs');
    blobStore = getStore(getBlobStoreConfig());
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
  if (getStorageMode() === 'netlify') {
    const json = await readBlobStore();
    if (json && typeof json === 'object') {
      return json;
    }
    return null;
  }

  return readFileStore();
};

const writeStore = async (data) => {
  if (getStorageMode() === 'netlify') {
    return writeBlobStore(data);
  }

  return writeFileStore(data);
};

module.exports = {
  readStore,
  writeStore,
  getStorageMode
};
