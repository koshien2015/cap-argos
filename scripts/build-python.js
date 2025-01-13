const { exec } = require('child_process');
const { platform } = require('os');
const path = require('path');
const fs = require('fs');

const PYTHON_SRC_DIR = path.join(__dirname, '../src/engine');
const PYTHON_DIST_DIR = path.join(__dirname, '../python/dist');
const TARGET_PLATFORM = process.env.PLATFORM || platform();

// PyInstallerのオプション設定
const getPyinstallerCommand = () => {
  const commonOpts = [
    '--clean',
    '--onefile',
    '--name analyzer',
    `--distpath ${PYTHON_DIST_DIR}`,
    '--noconsole',
  ];

  // プラットフォーム固有の設定
  const platformOpts = {
    win32: [
      '--add-data "resources;resources"',  // Windowsの場合のパス区切り文字
    ],
    darwin: [
      '--add-data "resources:resources"',  // Macの場合のパス区切り文字
    ],
  };

  const scriptPath = path.join(PYTHON_SRC_DIR, 'core.py');
  const opts = [...commonOpts, ...(platformOpts[TARGET_PLATFORM] || [])];
  
  return `python -m PyInstaller ${opts.join(' ')} "${scriptPath}"`;
};

// ビルド実行
const buildPython = async () => {
  console.log(`Building Python executable for ${TARGET_PLATFORM}...`);

  // distディレクトリの作成
  if (!fs.existsSync(PYTHON_DIST_DIR)) {
    fs.mkdirSync(PYTHON_DIST_DIR, { recursive: true });
  }

  try {
    const command = getPyinstallerCommand();
    await new Promise((resolve, reject) => {
      exec(command, { cwd: PYTHON_SRC_DIR }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Build error: ${error}`);
          reject(error);
          return;
        }
        console.log(stdout);
        if (stderr) console.error(stderr);
        resolve();
      });
    });

    console.log('Python build completed successfully!');
  } catch (error) {
    console.error('Failed to build Python executable:', error);
    process.exit(1);
  }
};

buildPython();