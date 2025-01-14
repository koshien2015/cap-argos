import { useCallback, useState } from "react";

export type Video = {
  video_id: string;
  pose_count: number;
  max_frame: number;
  filepath: string;
};

export type PoseData = {
    video_id: number;
    filepath: string;
    frame_number: number;
    pose_id: number;
    x: number;
    y: number;
    person_index: number | null;
    marker_group_id: number;
    keypoints: string;
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [poseData, setPoseData] = useState<PoseData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadVideos = useCallback(async () => {
    setIsLoaded(false);
    const res = await fetch("/api/videos", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const data = await res.json();
      setVideos(data);
      setIsLoaded(true);
    }
  }, []);

  const loadPoseData = useCallback(async (video_id: number) => {
    setIsLoaded(false);
    const res = await fetch(`/api/poses?video_id=${video_id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const data:PoseData[] = await res.json();
      setPoseData(data);
      setIsLoaded(true);
    }
  }, []);

  return { videos, loadVideos, loadPoseData, poseData, isLoaded };
};
