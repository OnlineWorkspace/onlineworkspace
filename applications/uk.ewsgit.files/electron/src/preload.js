localStorage.setItem("onlineworkspace_workspace_no_app_navigation_rail", "true");
localStorage.setItem("onlineworkspace_workspace_desktop_app", "true");

document.addEventListener('DOMContentLoaded', () => {
  const elem = document.createElement("style");

  elem.innerHTML = `:root { background-color: transparent !important; }`;

  document.body.appendChild(elem);

  document.body.style.borderRadius = "12px";
  document.body.style.overflow = "hidden";
  document.body.style.border = "1px solid #646464";
});
