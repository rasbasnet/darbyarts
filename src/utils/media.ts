export const resolveAssetPath = (path: string) => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
  const normalized = path.replace(/^\//, '');
  return `${base}/${normalized}`;
};
