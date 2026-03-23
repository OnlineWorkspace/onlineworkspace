import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";

const trpc = createTRPCClient<TRPCRouter>({
    links: [
        httpBatchLink({
            url: "https://localhost/api/app/uk.tcsw.ghostty",
            fetch(input, init) {
                return fetch(input, { credentials: "include", ...init });
            },
        }),
    ],
});

export default trpc;
