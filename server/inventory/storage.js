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
    console.info('[inventory] Using static Netlify blobs credentials (siteID + token).');
    return { name: 'poster-inventory', siteID, token };
  }

  console.info('[inventory] Using runtime Netlify blobs context.');
  return { name: 'poster-inventory' };
};

let blobStore = null;

const getBlobStore = () => {
  if (getStorageMode() !== 'netlify') {
    blobStore = null;
    return null;
  }

  if (!blobStore) {
    console.info('[inventory] Initialising Netlify blob store client.');
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

  console.info('[inventory] Reading inventory blob key.');
  return store.get('inventory', { type: 'json' });
};

const writeBlobStore = async (data) => {
  const store = getBlobStore();
  if (!store) {
    throw new Error('Netlify blob store is not configured.');
  }

  console.info('[inventory] Writing inventory blob key.');
  await store.setJSON('inventory', data);
};

const readStore = async () => {
  if (getStorageMode() === 'netlify') {
    try {
      const json = await readBlobStore();
      if (json && typeof json === 'object') {
        return json;
      }
      console.warn('[inventory] Blob store returned empty payload. Falling back to seed if needed.');
      return null;
    } catch (error) {
      console.error('[inventory] Failed to read blob store. Falling back to local file.', error);
      return readFileStore();
    }
  }

  return readFileStore();
};

const writeStore = async (data) => {
  if (getStorageMode() === 'netlify') {
    try {
      await writeBlobStore(data);
      return;
    } catch (error) {
      console.error('[inventory] Failed to write blob store. Falling back to local file write.', error);
    }
  }

  return writeFileStore(data);
};

module.exports = {
  readStore,
  writeStore,
  getStorageMode
};
