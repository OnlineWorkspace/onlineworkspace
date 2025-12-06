import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";

const trpc = createTRPCClient<TRPCRouter>({
    links: [
        splitLink({
            condition: (op: { type: string }) => op.type === "subscription",
            true: httpSubscriptionLink({
                url: "http://localhost:3563/app/uk.tcsw.console",
                eventSourceOptions: {
                    withCredentials: true,
                },
            }),
            false: httpBatchLink({
                url: "http://localhost:3563/app/uk.tcsw.console",
                fetch(input, init) {
                    return fetch(input, { credentials: "include", ...init });
                },
            }),
        }),
    ],
});

export default trpc;
