import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";

export const APPLICATION_ID = "uk.ewsgit.processorchestrator";

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
