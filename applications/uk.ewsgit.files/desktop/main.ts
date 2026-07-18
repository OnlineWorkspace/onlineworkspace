import { createDesktopApplication } from "@onlineworkspace/desktop";

await createDesktopApplication({
  id: "uk.ewsgit.files",
  displayName: "Files",
  enforceLogin: true,
  startPageUrl: "",
  developmentStartPageUrl: "http://127.0.0.1:5175",
});
