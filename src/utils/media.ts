export const resolveAssetPath = (path: string) => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseCandidate = (process.env.PUBLIC_URL ?? '').replace(/\/+$/, '');
  const normalized = path.replace(/^\/+/, '');

  if (!baseCandidate || baseCandidate === '.') {
    return `/${normalized}`;
  }

  return `${baseCandidate}/${normalized}`;
};
