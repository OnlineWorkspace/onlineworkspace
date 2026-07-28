import FilesystemConnector from "../../../lib/filesystemConnector.ts"

export default class DesktopFilesystemInterface extends FilesystemConnector {
  connectorType = "desktop-local"
}
