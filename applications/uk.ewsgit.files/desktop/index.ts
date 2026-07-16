import { createDesktopApplication } from "@onlineworkspace/desktop"

await createDesktopApplication({
  id: "uk.ewsgit.files",
  displayName: "Files",
  enforceLogin: true,
  startPageUrl: "",
  developmentStartPageUrl: "http://localhost:5175"
})
