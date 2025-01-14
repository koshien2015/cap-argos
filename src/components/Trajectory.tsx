import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Stage, Layer, Image, Circle, Line } from "react-konva";
import Konva from "konva";
import { FaPlay, FaPause, FaAngleRight, FaAngleLeft } from "react-icons/fa";
import { PoseData } from "@/hooks/useVideos";
import { calculateAngle } from "@/hooks/calculateAngle";

type VideoState = {
  playing: boolean;
  currentTime: number;
};

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD93D",
  "#6B8E23",
  "#E0B0FF",
  "#E2725B",
  "#34495E",
  "#9DC183",
];

const Trajectory: FC<{
  filePath: string;
  poseData: PoseData[];
}> = ({ filePath, poseData }) => {
  const imageRef = useRef<Konva.Image>(null);
  const [size, setSize] = useState({ width: 50, height: 50 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [src, setSrc] = useState<string>("");
  const [videoState, setVideoState] = useState<VideoState>({
    playing: false,
    currentTime: 0,
  });
  const stageRef = useRef(null);

  const videoElement: HTMLVideoElement = useMemo(() => {
    const element = document.createElement("video");
    element.src = src;
    element.muted = true;
    return element;
  }, [src]);

  useEffect(() => {
    const f = async () => {
      //@ts-ignore
      const url = await window.electronAPI.readVideoAsDataURL(filePath);
      setSrc(url);
    };
    f();
    return () => {};
  }, [filePath]);

  useEffect(() => {
    const f = async () => {
      // @ts-ignore
      const size = await window.electronAPI.getWindowSize();
      setWindowSize(size);
    };
    f();
  }, []);

  const max_frame = useMemo(() => {
    return poseData.sort((a, b) => b.frame_number - a.frame_number)?.[0]
      .frame_number;
  }, [poseData]);

  const playAndPause = useCallback(() => {
    if (videoState.playing) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  }, [videoElement, videoState.playing]);

  useEffect(() => {
    const onload = function () {
      setSize({
        width:
          (videoElement.videoWidth * windowSize.height) /
          2 /
          videoElement.videoHeight,
        height: windowSize.height / 2,
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
    videoElement.addEventListener("pause", () => {
      setVideoState({
        playing: false,
        currentTime: videoElement.currentTime,
      });
    });
    videoElement.addEventListener("ended", () => {
      setVideoState({ ...videoState, playing: false });
    });
    videoElement.addEventListener("timeupdate", () => {
      setVideoState({
        ...videoState,
        currentTime: videoElement.currentTime,
      });
    });
    return () => {
      videoElement.removeEventListener("loadedmetadata", onload);
    };
  }, [videoElement, setVideoState, videoState, windowSize]);

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

  const currentFrame = useMemo(() => {
    return Math.floor(
      (videoState.currentTime * max_frame) / videoElement.duration
    );
  }, [videoState, videoElement, max_frame]);

  const currentPose: PoseData[] = useMemo(() => {
    return poseData.filter((pose) => pose.frame_number === currentFrame + 3);
  }, [poseData, currentFrame]);

  const returnPoints = useCallback(
    (person_id: number, keypoint_id: number) => {
      const target = currentPose.find((pose) => {
        return (
          pose.person_index === person_id &&
          Number(pose.keypoints) === keypoint_id
        );
      });
      return {
        x: target?.x,
        y: target?.y,
      };
    },
    [currentPose]
  );

  const linePoints = useMemo(() => {
    const personNumber = [0, 1, 2, 3, 4, 5, 6, 7];
    const connections = [
      [5, 6], //shoulders
      [5, 7], //left upper arm
      [7, 9], //left lower arm
      [6, 8], //right upper arm
      [8, 10], //right lower arm
      [5, 11], //left trunk
      [6, 12], //right trunk
      [11, 12], //hips
      [11, 13], //left thigh
      [13, 15], //left calf
      [12, 14], //right thigh
      [14, 16], //right calf
    ];
    const points: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      person_id: number;
    }[] = [];
    personNumber.forEach((num) => {
      connections.forEach((connection) => {
        const start = returnPoints(num, connection[0]);
        const end = returnPoints(num, connection[1]);
        if (start.x && start.y && end.x && end.y) {
          points.push({
            x1: start.x * size.width,
            y1: start.y * size.height,
            x2: end.x * size.width,
            y2: end.y * size.height,
            person_id: num,
          });
        }
      });
    });
    return points;
  }, [returnPoints, size]);

  const jointAngles = useMemo(() => {
    const personNumber = [0, 1, 2, 3, 4, 5, 6, 7];
    return personNumber.map((num) => {
      const leftShoulder = returnPoints(num, 5);
      const rightShoulder = returnPoints(num, 6);
      const leftElbow = returnPoints(num, 7);
      const rightElbow = returnPoints(num, 8);
      const leftWrist = returnPoints(num, 9);
      const rightWrist = returnPoints(num, 10);
      const rightShoulderAngle = calculateAngle(
        leftShoulder,
        rightShoulder,
        rightElbow
      );
      const leftShoulderAngle = calculateAngle(
        rightShoulder,
        leftShoulder,
        leftElbow
      );
      const rightElbowAngle = calculateAngle(
        rightWrist,
        rightElbow,
        rightShoulder
      );
      const leftElbowAngle = calculateAngle(
        leftWrist,
        leftElbow,
        leftShoulder
      );
      return {
        rightShoulderAngle,
        leftShoulderAngle,
        rightElbowAngle,
        leftElbowAngle
      }
    });
  }, [returnPoints]);

  return (
    <>
      <Stage ref={stageRef} width={size.width} height={size.height}>
        <Layer>
          <Image
            alt=""
            //opacity={0.7}
            ref={imageRef}
            image={videoElement}
            x={0}
            y={0}
            width={size.width}
            height={size.height}
          />
          {currentPose
            ?.filter((pose) => pose.person_index !== null)
            ?.map((pose, index) => (
              <Circle
                key={index}
                draggable
                onDragEnd={(e) => {
                  console.log(e.target.position());
                }}
                x={size.width * pose.x}
                y={size.height * pose.y}
                radius={6}
                fill={COLORS[pose.person_index!]}
              />
            ))}
          {currentPose
            ?.filter((pose) => pose.person_index === null)
            ?.map((pose, index) => (
              <Circle
                key={index}
                draggable
                onDragEnd={(e) => {
                  console.log(e.target.position());
                }}
                x={size.width * pose.x}
                y={size.height * pose.y}
                radius={6}
                stroke={"red"}
              />
            ))}
          {linePoints.map((line, index) => (
            <Line
              key={index}
              points={[line.x1, line.y1, line.x2, line.y2]}
              stroke={COLORS[line.person_id]}
              strokeWidth={2}
            />
          ))}
        </Layer>
      </Stage>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => {
            videoElement.currentTime =
              videoElement.currentTime - videoElement.duration / max_frame;
            setVideoState({
              ...videoState,
              currentTime: videoElement.currentTime,
            });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          <FaAngleLeft />
          1f
        </button>
        <button
          style={{
            border: "1px solid gray",
            borderRadius: 4,
          }}
          onClick={playAndPause}
        >
          {videoState.playing ? <FaPause /> : <FaPlay />}
        </button>
        <button
          onClick={() => {
            videoElement.currentTime =
              videoElement.currentTime + videoElement.duration / max_frame;
            setVideoState({
              ...videoState,
              currentTime: videoElement.currentTime,
            });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          <FaAngleRight />
          1f
        </button>
      </div>
      {currentFrame}
      {jointAngles.map((jointAngle, index) => (
        <div key={index}
          style={{
            color: COLORS[index],
          }}
        >
          <div>Right Shoulder: {jointAngle.rightShoulderAngle}</div>
          <div>Left Shoulder: {jointAngle.leftShoulderAngle}</div>
          <div>Right Elbow: {jointAngle.rightElbowAngle}</div>
          <div>Left Elbow: {jointAngle.leftElbowAngle}</div>
        </div>
      ))}
    </>
  );
};

export default Trajectory;
