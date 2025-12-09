import { createTRPCClient, httpBatchLink, wsLink, splitLink, createWSClient } from "@trpc/client";
import type { WorkspacesTRPCRouter } from "../../../subsystems/trpcRouter";

const trpc = createTRPCClient<WorkspacesTRPCRouter>({
    links: [
        // splitLink({
        //     condition: (op: { type: string }) => op.type === "subscription",
        //     true: wsLink({
        //         client: createWSClient({
        //             url: "ws://localhost:3564",
        //             connectionParams: async () => {
        //                 return {};
        //             },
        //         }),
        //     }),
        //     false:
        httpBatchLink({
            url: "http://localhost:3563/instance/workspaces/trpc",
            fetch(input, init) {
                return fetch(input, { credentials: "include", ...init });
            },
        }),
        // }),
    ],
});

export default trpc;
