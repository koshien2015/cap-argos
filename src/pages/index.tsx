"use client";
import Link from "next/link";
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
  return <>
  <Link href={`/scene/sample`}>サンプル解析ページ</Link>
  </>;
};
export default Home;
