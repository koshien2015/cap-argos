import { spawn } from "child_process";
import { NextRequest } from "next/server";
import { join } from "path";

export async function POST(req: NextRequest) {
  const body = await req.json()
  try {
    // 実行ファイルのパスを取得
    const executablePath =
      process.env.NODE_ENV === "development"
        ? "python"
        : join(process.resourcesPath, "motion_trace.exe");
    // Windowsではスペースを含むパスも正しく扱えるように配列で指定
    const args =
      process.env.NODE_ENV === "development"
        ? ["src/engine/core.py", `--input`, body.input]
        : [`--input`, body.input];
    const options = {
      // シェルを使用しない（セキュリティ上推奨）
      shell: false,
      // 作業ディレクトリを指定
      //cwd: app.getPath("userData"),
      // 環境変数を継承
      env: { ...process.env },
    };
    const currentProcess = spawn(executablePath, args, options);
    return new Promise((resolve, reject) => {
      // 標準出力のログ
      currentProcess.stdout.on("data", (data) => {
        console.log(`Analysis output: ${data}`);
      });

      // エラー出力のログ
      currentProcess.stderr.on("data", (data) => {
        console.error(`Analysis error: ${data}`);
      });

      currentProcess.on("close", (code) => {
        if (code === 0) {
          resolve(
            new Response(JSON.stringify({ message: "Analysis completed" }), {
              status: 200,
            })
          );
          return;
        } else {
          reject(new Error(`Analysis process exited with code ${code}`));
        }
      });

      // プロセスのエラーハンドリング
      process.on("error", (err) => {
        reject(new Error(`Failed to start analysis process: ${err.message}`));
      });
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        status: 500,
        error: (error as unknown as Error).message,
      }),
      {
        status: 500,
      }
    );
  }
}
