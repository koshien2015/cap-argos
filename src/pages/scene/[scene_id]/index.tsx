import dynamic from "next/dynamic";
const Trajectory = dynamic(() => import("@/components/Trajectory"), {
  ssr: false,
});

const Home = () => {
  return <Trajectory />;
};
export default Home;