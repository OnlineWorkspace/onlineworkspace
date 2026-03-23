import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";

const trpc = createTRPCClient<TRPCRouter>({
    links: [
        splitLink({
            condition: (op: { type: string }) => op.type === "subscription",
            true: httpSubscriptionLink({
                url: "https://localhost/api/app/uk.tcsw.console",
                eventSourceOptions: {
                    withCredentials: true,
                },
            }),
            false: httpBatchLink({
                url: "https://localhost/api/app/uk.tcsw.console",
                fetch(input, init) {
                    return fetch(input, { credentials: "include", ...init });
                },
            }),
        }),
    ],
});

export default trpc;
