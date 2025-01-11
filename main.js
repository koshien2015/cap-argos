const { app, BrowserWindow } = require("electron");
const path = require("path");

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  win.setMenuBarVisibility(false);
  win.title = "Cap-Argos(投球動作解析アプリケーション)"

  if (app.isPackaged) {
    const serve = (await import("electron-serve")).default;
    const appServe = serve({
      directory: path.join(__dirname, "../out")
    });
    appServe(win).then(() => {
      win.loadURL("app://-");
    });
  } else {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
};

app.on("ready", createWindow);