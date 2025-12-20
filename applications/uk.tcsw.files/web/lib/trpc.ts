import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";

const trpc = createTRPCClient<TRPCRouter>({
    links: [
        httpBatchLink({
            url: "http://localhost:3563/app/uk.tcsw.files",
            fetch(input, init) {
                return fetch(input, { credentials: "include", ...init });
            },
        }),
    ],
});

export default trpc;
