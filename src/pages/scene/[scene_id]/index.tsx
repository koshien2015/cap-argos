import Trajectory from "@/components/Trajectory";
import dynamic from "next/dynamic";
import { useEffect } from "react";
// const Trajectory = dynamic(() => import("@/components/Trajectory"), {
//   ssr: false,
// });

const Home = () => {
  useEffect(() => {
    const f = async () => {
      await fetch("/api/initialize", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    };
    f();
  }, []);
  return <Trajectory />;
};
export default Home;