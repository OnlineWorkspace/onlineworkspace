import {
    createTRPCClient,
    httpBatchLink,
    httpLink,
    httpSubscriptionLink,
    isNonJsonSerializable,
    splitLink,
} from "@trpc/client";
import type { TRPCRouter } from "../../backend/index";

const ENDPOINT_URL = "http://localhost:3563/app/uk.tcsw.settings";

const trpc = createTRPCClient<TRPCRouter>({
    links: [
        splitLink({
            condition: (op) => isNonJsonSerializable(op.input),
            true: httpLink({
                url: ENDPOINT_URL,
                fetch(input, init) {
                    return fetch(input, { credentials: "include", ...init });
                },
            }),
            false: splitLink({
                condition: (op: { type: string }) => op.type === "subscription",
                true: httpSubscriptionLink({
                    url: ENDPOINT_URL,
                    eventSourceOptions: {
                        withCredentials: true,
                    },
                }),
                false: httpBatchLink({
                    url: ENDPOINT_URL,
                    fetch(input, init) {
                        return fetch(input, { credentials: "include", ...init });
                    },
                }),
            }),
        }),
    ],
});

export default trpc;
