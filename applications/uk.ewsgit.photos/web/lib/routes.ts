export const APPLICATION_ID = "uk.ewsgit.photos";

const BASE = `/app/${APPLICATION_ID}`;

export const routes = {
  photos: () => BASE,
  search: () => `${BASE}/search`,
  albums: () => `${BASE}/albums`,
  album: (id: number) => `${BASE}/albums/${id}`,
  favorites: () => `${BASE}/favorites`,
  archive: () => `${BASE}/archive`,
  faces: () => `${BASE}/faces`,
  person: (id: number) => `${BASE}/faces/${id}`,
  memories: () => `${BASE}/memories`,
  memory: (id: string) => `${BASE}/memories/${id}`,
  sharing: () => `${BASE}/sharing`,
  trash: () => `${BASE}/trash`,
};

// the same page can be reached with and without a trailing slash
export const samePath = (a: string, b: string) => a.replace(/\/+$/, "") === b.replace(/\/+$/, "");
