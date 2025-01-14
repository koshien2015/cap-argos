const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { spawn } = require("child_process");
const { getDatabaseConnection } = require("./src/utils/database");

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
    scheme: "app",
    hostname: "-",
    file: "index",
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

  ipcMain.handle("motion-trace", async (event, args) => {
    // Pythonバッチ実行処理をここで行う
    const body = args;
    const db = await getDatabaseConnection();
    // videoテーブルにファイルパスを格納
    const result = await db
      .run("INSERT INTO video (filepath) VALUES (?)", body.input)
    const insertedRowId = result.lastInsertRowid;
    // sceneデータを作成
    await db.run("INSERT INTO scene (video_id) VALUES (?)", insertedRowId);
    try {
      // 実行ファイルのパスを取得
      const executablePath =
        process.env.NODE_ENV === "development" ? "python" : "";
      // Windowsではスペースを含むパスも正しく扱えるように配列で指定
      const args =
        process.env.NODE_ENV === "development"
          ? [
              "src/engine/core.py",
              `--input`,
              body.input,
              `--sceneId`,
              body.sceneId,
              `--videoId`,
              insertedRowId,
            ]
          : [
              `--input`,
              body.input,
              `--sceneId`,
              body.sceneId,
              `--videoId`,
              insertedRowId,
            ];
      const options = {
        // シェルを使用しない（セキュリティ上推奨）
        shell: false,
        // 作業ディレクトリを指定
        //cwd: app.getPath("userData"),
        // 環境変数を継承
        env: { ...process.env },
      };
      const currentProcess = spawn(executablePath, args, options);
      return currentProcess;
    } catch (error) {
      console.error(error);
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
