/// <reference path="./global.d.ts" />

import { createTRPCContext, procedure } from "@tcsw/workspaces-instance/src/subsystems/trpcRouter";
import { initTRPC } from "@trpc/server";
import chalk from "chalk";
import EventEmitter, { on } from "node:events";

const log = instance.log.createLogger("uk.tcsw.console");

export const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

const consoleEventEmitter = new EventEmitter();

const router = t.router({
    output: procedure
        // @ts-ignore
        .subscription(async function* (opt) {
            yield [`--------------------------------------------------------------------------`];
            yield [`   ${chalk.hex("FF002E")(/XXX/)}${chalk.hex("70FF00")(/XXX/)}${chalk.hex("0066FF")(/XXX/)}`];
            yield [
                `  ${chalk.hex("FF002E")(/XXX/)}${chalk.hex("70FF00")(/XXX/)}${chalk.hex("0066FF")(/XXX/)}  Workspaces © 2025 Tricolor Software -> https://tcsw.uk`,
            ];
            yield [` ${chalk.hex("FF002E")(/XXX/)}${chalk.hex("70FF00")(/XXX/)}${chalk.hex("0066FF")(/XXX/)}`];
            yield [`--------------------------------------------------------------------------`];
            yield [`Connecting to the instance console...`];

            for await (const [data] of on(consoleEventEmitter, "output")) {
                yield data;
            }
        }),
});

export type TRPCRouter = typeof router;

instance.subSystems.tRPC.registeredRouters.push({
    basePath: "/app/uk.tcsw.console",
    router: router,
    createContext: createTRPCContext(instance),
});

const consoleLog = console.log;
global.console.log = (...data: any[]): void => {
    consoleEventEmitter.emit("output", data);
    consoleLog(...data);
};
