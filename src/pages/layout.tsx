import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cap-Argos(投球動作解析アプリケーション)",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
