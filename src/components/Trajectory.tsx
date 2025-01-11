import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Stage, Layer, Image } from "react-konva";
import Konva from "konva";
import { FaPlay, FaPause } from "react-icons/fa";
import { webUtils } from "electron";

const Trajectory = () => {
  const imageRef = useRef<Konva.Image>(null);
  const [size, setSize] = useState({ width: 50, height: 50 });
  const [src, setSrc] = useState<string>("");
  const stageRef = useRef(null);
  const [filePath, setFilePath] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const videoElement: HTMLVideoElement = useMemo(() => {
    const element = document.createElement("video");
    element.src = src;
    return element;
  }, [src]);

  // when video is loaded, we should read it size
  useEffect(() => {
    const onload = function () {
      setSize({
        width: (videoElement.videoWidth * 400) / videoElement.videoHeight,
        height: 400,
      });
    };
    videoElement.addEventListener("loadedmetadata", onload);
    videoElement.addEventListener("loadeddata", onload);
    return () => {
      videoElement.removeEventListener("loadedmetadata", onload);
    };
  }, [videoElement]);

  // use Konva.Animation to redraw a layer
  useEffect(() => {
    videoElement.pause();
    if (!imageRef.current) return;
    const layer = imageRef.current.getLayer();
    const anim = new Konva.Animation(() => {}, layer);
    anim.start();
    //clean up
    return () => {
      anim.stop();
    };
  }, [videoElement, imageRef.current]);

  const disabled = useMemo(() => {
    return isAnalyzing || !filePath || !src;
  }, [isAnalyzing, filePath, src]);

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
    <>
      <Stage ref={stageRef} width={size.width} height={size.height}>
        <Layer>
          <Image
            ref={imageRef}
            image={videoElement}
            x={0}
            y={0}
            width={size.width}
            height={size.height}
          />
        </Layer>
      </Stage>
      <button
        style={{
          border: "1px solid gray",
          borderRadius: 4,
        }}
        onClick={() => {
          videoElement.play();
        }}
      >
        <FaPlay />
      </button>
      <button
        style={{
          border: "1px solid gray",
          borderRadius: 4,
        }}
        onClick={() => {
          videoElement.pause();
        }}
      >
        <FaPause />
      </button>
      <input
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            // @ts-ignore
            setFilePath(window.webUtils.getPathForFile(file));
            const url = URL.createObjectURL(file);
            setSrc(url);
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
        }}
      >
        解析実行
      </button>
    </>
  );
};

export default Trajectory;
