import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { WorkspacesTRPCRouter } from "../../../systems/trpcRouter";

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
