"use client";
import { useVideos } from "@/hooks/useVideos";
import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

const Home = () => {
  const [filePath, setFilePath] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const { loadVideos, videos } = useVideos();
  
  useEffect(() => {
    const f = async () => {
      await fetch("/api/initialize", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
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
