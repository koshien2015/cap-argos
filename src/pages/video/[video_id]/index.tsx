import { useVideos } from "@/hooks/useVideos";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect } from "react";
const Trajectory = dynamic(() => import("@/components/Trajectory"), {
  ssr: false,
});

const Home = () => {
  const router = useRouter();
  const { loadPoseData, poseData } = useVideos();
  useEffect(() => {
    if (!router.isReady || !router.query.video_id) return;
    loadPoseData(Number(router.query.video_id));
  }, [router]);

  if(poseData.length === 0) return <div>Loading...</div>;
  return <Trajectory filePath={poseData?.[0].filepath} poseData={poseData}/>;
};

export default Home;
