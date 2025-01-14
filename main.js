const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const electronServe = require("./electronServe");

let loadURL = async () => {};

const initFunction = async () => {
  const serve = electronServe;
  loadURL = serve({
    directory: "out",
    isCorsEnabled: true,
  });
  console.log("electron-serve loaded");
};

const getPath = async (path_, file) => {
	try {
		const result = await fs.stat(path_);

		if (result.isFile()) {
			return path_;
		}

		if (result.isDirectory()) {
			return getPath(path.join(path_, `${file}.html`));
		}
	} catch {}
};

const handler = async (request, callback) => {
  const options = {
		isCorsEnabled: true,
		scheme: 'app',
		hostname: '-',
		file: 'index',
    directory: path.resolve(app.getAppPath(), "out"),
	};
  const indexPath = path.join(options.directory, `${options.file}.html`);
  const filePath = path.join(
    options.directory,
    decodeURIComponent(new URL(request.url).pathname)
  );

  const relativePath = path.relative(options.directory, filePath);
  const isSafe =
    !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

  if (!isSafe) {
    callback({ error: FILE_NOT_FOUND });
    return;
  }

  const finalPath = await getPath(filePath, options.file);
  console.log(filePath, finalPath);
  const fileExtension = path.extname(filePath);

  if (
    !finalPath &&
    fileExtension &&
    fileExtension !== ".html" &&
    fileExtension !== ".asar"
  ) {
    callback({ error: FILE_NOT_FOUND });
    return;
  }

  callback({
    path: finalPath || indexPath,
  });
};

initFunction();

app.whenReady().then(async () => {
  console.log("app is Ready");
  createWindow();
  session.defaultSession.protocol.registerFileProtocol("app", handler);
});

const createWindow = async () => {
  await app.whenReady();
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
      // @ts-ignore
      throw new Error(`Failed to read video file: ${error.message}`);
    }
  });

  if (app.isPackaged) {
    await loadURL(win);
  } else {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
    win.webContents.on("did-fail-load", (e, code, desc) => {
      win.webContents.reloadIgnoringCache();
    });
  }
};
