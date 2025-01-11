'use client';
import { useEffect } from "react";

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
  return <></>;
};
export default Home;
