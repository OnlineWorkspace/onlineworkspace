
// @ts-ignore BrowserWindow does exist but is not yet in Deno's types
const win = new Deno.BrowserWindow({
  title: "Settings",
  width: 420,
  height: 320,
  transparentTitlebar: true,
});

win.navigate("https://localhost/auth/app/flow?redirect=/app/uk.ewsgit.files/")

/*
  if ((await session.defaultSession.cookies.get({ url: "https://localhost" })).length === 0) {
    await window.loadURL("https://localhost/?redirect=/app/uk.ewsgit.files/");
  } else {
    await window.loadURL("https://localhost/app/uk.ewsgit.files");
  }
*/
