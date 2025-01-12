const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.title = "Cap-Argos(投球動作解析アプリケーション)";

  win.on("resize", () => {
    const [width, height] = win.getSize();
    win.webContents.send("window-resized", { width, height });
  });

  // 現在のウインドウサイズを取得するハンドラー
  ipcMain.handle("get-window-size", () => {
    const [width, height] = win.getSize();
    return { width, height };
  });

  ipcMain.handle("read-video-file", async (event, filePath) => {
    try {
      const buffer = await fs.readFile(filePath);
      return buffer.toString("base64");
    } catch (error) {
      throw new Error(`Failed to read video file: ${error.message}`);
    }
  });

  if (app.isPackaged) {
    const serve = (await import("electron-serve")).default;
    const appServe = serve({
      directory: path.join(__dirname, "../out"),
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
