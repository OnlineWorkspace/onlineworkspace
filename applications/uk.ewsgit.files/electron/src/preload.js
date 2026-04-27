const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize_window: () => ipcRenderer.send("minimize_window"),
  maximize_window: () => ipcRenderer.send("maximize_window"),
  close_window: () => ipcRenderer.send("close_window"),
  fs: {
    readdir: (path, options) => ipcRenderer.invoke("fs:readdir", [path, options]),
  },
  files: {
    get_entry: (path, thumbnailSize) => ipcRenderer.invoke("files:get_entry", [path, thumbnailSize]),
    open_in_default_application: (path) => ipcRenderer.invoke("files:open_in_default_application", [path]),
  },
});

localStorage.setItem("onlineworkspace_workspace_no_app_navigation_rail", "true");
localStorage.setItem("onlineworkspace_workspace_desktop_platform", ipcRenderer.invoke("files:os_platform"));
localStorage.setItem("onlineworkspace_workspace_desktop_app", "true");

document.addEventListener("DOMContentLoaded", () => {
  const elem = document.createElement("style");

  elem.innerHTML = `:root { background-color: transparent !important; }`;

  document.body.appendChild(elem);

  document.head.querySelector("title").innerText = "OW Files";
  document.body.style.overflow = "hidden";
  document.body.style.boxShadow = "1px 0px #646464 inset, 0 0 1px 0px #646464";
  document.body.style.border = "1px solid #646464";
  document.body.style.borderRadius = "10px";
});
