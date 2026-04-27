import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerRpm } from "@electron-forge/maker-rpm";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    osxSign: {},
    icon: "../assets/uk.ewsgit.files.app",
  },
  makers: [
    new MakerSquirrel(
      {
        authors: "Ewsgit",
      },
      ["win32"],
    ),
    new MakerZIP({}, ["darwin", "win32", "linux"]),
    new MakerDeb({}, ["linux"]),
    new MakerRpm({}, ["linux"]),
  ],
};

export default config;
