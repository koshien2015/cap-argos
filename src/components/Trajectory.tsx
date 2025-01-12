import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image } from "react-konva";
import Konva from "konva";
import { FaPlay, FaPause } from "react-icons/fa";

type VideoState = {
  playing: boolean;
  currentTime: number;
};

const Trajectory: FC<{
  filePath: string;
}> = ({ filePath }) => {
  const imageRef = useRef<Konva.Image>(null);
  const [size, setSize] = useState({ width: 50, height: 50 });
  const [src, setSrc] = useState<string>("");
  const [videoState, setVideoState] = useState<VideoState>({
    playing: false,
    currentTime: 0,
  });
  const stageRef = useRef(null);

  const videoElement: HTMLVideoElement = useMemo(() => {
    const element = document.createElement("video");
    element.src = src;
    return element;
  }, [src]);

  useEffect(() => {
    const f = async () => {
      const url = await window.electronAPI.readVideoAsDataURL(filePath);
      setSrc(url);
    };
    f();
    return () => {};
  }, [filePath]);

  useEffect(() => {
    const onload = function () {
      setSize({
        width: (videoElement.videoWidth * 400) / videoElement.videoHeight,
        height: 400,
      });
    };
    videoElement.addEventListener("loadedmetadata", onload);
    videoElement.addEventListener("loadeddata", onload);
    videoElement.addEventListener("playing", () => {
      setVideoState({
        playing: true,
        currentTime: videoElement.currentTime,
      });
    });
    videoElement.addEventListener("ended", () => {
      setVideoState({
        playing: false,
        currentTime: 0,
      });
    });
    return () => {
      videoElement.removeEventListener("loadedmetadata", onload);
    };
  }, [videoElement, setVideoState]);

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
  }, [videoElement, imageRef]);

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
        {videoState.playing ? <FaPause /> : <FaPlay />}
      </button>
    </>
  );
};

export default Trajectory;
