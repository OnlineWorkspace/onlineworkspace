import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";

const trpc = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/api/app/uk.ewsgit.store`,
      fetch(input, init) {
        return fetch(input, { credentials: "include", ...init });
      },
    }),
  ],
});

export default trpc;
