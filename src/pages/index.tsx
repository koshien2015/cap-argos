"use client";
import { useVideos } from "@/hooks/useVideos";
import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

const Home = () => {
  const [filePath, setFilePath] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const { loadVideos, videos, isLoaded } = useVideos();
  const [isInitializedDb, setIsInitializedDb] = useState<boolean>(false);

  useEffect(() => {
    const f = async () => {
      try {
        const res = await fetch("/api/initialize", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          alert("データベースの初期化に失敗しました");
          return;
        }
        setIsInitializedDb(true);
      } catch (error) {
        // @ts-ignore
        alert("何らかのエラーが発生しました" + error.message);
      }
        await loadVideos();
    };
    f();
  }, []);

  const disabled = useMemo(() => {
    return isAnalyzing || !filePath;
  }, [isAnalyzing, filePath]);

  const analyze = useCallback(async () => {
    const body = {
      input: filePath,
    };
    setIsAnalyzing(true);
    await fetch("/api/motion_trace", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    setIsAnalyzing(false);
  }, [filePath]);

  if (!isInitializedDb) {
    return <div>データベース初期化中...</div>;
  } else if (!isLoaded) {
    return <div>データベース読み込み中...</div>;
  }
  return (
    <div>
      {videos?.map((video) => (
        <>
          <Link href={`/video/${video.video_id}`} key={video.video_id}>
            <div>
              {video.video_id} {video.pose_count} {video.max_frame}
              {video.filepath}
            </div>
          </Link>
        </>
      ))}
      <input
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            // @ts-ignore
            setFilePath(window.webUtils.getPathForFile(file));
            //const url = URL.createObjectURL(file);
            //setSrc(url);
          }
        }}
        type="file"
        multiple={false}
        accept=".mp4,.mov"
      />
      <button
        disabled={disabled}
        onClick={async () => {
          await analyze();
          // 動画一覧を更新
          await loadVideos();
        }}
      >
        解析実行
      </button>
    </div>
  );
};
export default Home;
