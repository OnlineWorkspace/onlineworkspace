import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";
import { APPLICATION_ID } from "./routes";

export { APPLICATION_ID };

const trpc = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/api/app/${APPLICATION_ID}`,
      fetch(input, init) {
        return fetch(input, { credentials: "include", ...init });
      },
    }),
  ],
});

export default trpc;
