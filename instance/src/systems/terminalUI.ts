import type { Instance } from "../index.ts";
import System from "../system.ts";
import { createCliRenderer, Text } from "@opentui/core";
import ffi from "node:ffi";

export default class TerminalUISystem extends System {
  constructor(instance: Instance) {
    super("terminal_ui", instance);
  }

  override async startup(): Promise<boolean> {
    if (!process.stdout) return false;

    await super.startup();

    try {
      const renderer = await createCliRenderer({
        exitOnCtrlC: true,
      });

      renderer.root.add(
        Text({
          content: "Hello, OpenTUI!",
          fg: "#00FF00",
        }),
      );
    } catch (err) {
      console.error(err);
    }

    return true;
  }
}
