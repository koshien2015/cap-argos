import Link from "next/link";
import { ReactNode } from "react";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div id="container">
      <div
        style={{
          backgroundColor: "gray",
          color: "white",
          padding: 8,
          display: "flex",
          gap: 8,
        }}
      >
        {/* <div>
          <Link href={`/`} style={{ color: "white", textDecoration: "none" }}>
            1球分析一覧
          </Link>
        </div> */}
        <div>
          <Link
            href={`/`}
            style={{ color: "white", textDecoration: "none" }}
          >
            動画から解析
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
};
