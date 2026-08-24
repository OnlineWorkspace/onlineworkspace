# Notes

Files App

- Sidebar
  AppTitle
  Favorites
  Shares
  Storage Remaining (for current path)
- PaneContainer
  - Pane
    - new FilesystemInterface()
      - connectors
        - Desktop
        - Server Backend
        - SSHFS via Server Backend / Desktop
      - methods
        - readDirectory(path: str, { attributes: str[] })
        - readDirectoryItemCount(path: str)
        - readFile(path: str): Buffer | undefined
        - writeFile(path: str, content: Buffer): Promise<bool>
        - getThumbnail(path: str): Buffer | undefined
    - PaneContext( filesystemInterface )
    - ActionBar
      - Forward
      - Backward
      - Refresh
      - PathBar
      - SearchBar
      - ViewTypeSelector -> FilesystemInterface.viewType (ensure that only viewTypes supported by the filesystemInterface can be selected.)
    - View
      Details
      Grid
      Carousel
    - StatusBar
      - FilesystemInterface.actions.progress()
      - FilesystemInterface.getDirectoryItemCount()
- OnrollFlow
  - Tutorial
