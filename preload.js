const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  on: (channel, callback) => {
    ipcRenderer.on(channel, callback);
  },
  send: (channel, args) => {
    ipcRenderer.send(channel, args);
  },
  getWindowSize: () => ipcRenderer.invoke('get-window-size'),
  onWindowResize: (callback) => {
    ipcRenderer.on('window-resized', (_, size) => callback(size));
    // クリーンアップ関数を返す
    return () => {
      ipcRenderer.removeAllListeners('window-resized');
    };
  },

  readVideoAsDataURL: async (filePath) => {
    try {
      const base64Data = await ipcRenderer.invoke("read-video-file", filePath);
      return `data:video/mp4;base64,${base64Data}`;
    } catch (error) {
      throw new Error(`Failed to read video file: ${error.message}`);
    }
  },

  motionTrace: async (filePath) => {
    try {
      const base64Data = await ipcRenderer.invoke("motion-trace", filePath);
      return `data:video/mp4;base64,${base64Data}`;
    } catch (error) {
      throw new Error(`Failed to read video file: ${error.message}`);
    }
  },
});

contextBridge.exposeInMainWorld("webUtils", webUtils);
