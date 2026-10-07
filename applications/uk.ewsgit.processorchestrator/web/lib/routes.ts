import { APPLICATION_ID } from "./trpc";

const base = `/app/${APPLICATION_ID}`;

export const routes = {
  list: () => `${base}/`,
  activity: () => `${base}/activity`,
  detail: (id: string) => `${base}/p/${id}`,
};
