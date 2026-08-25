import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Here Be Dragons",
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        minHeight: "60vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <meta httpEquiv="refresh" content={`0; url=${basePath}/docs`} />
      <a href={`${basePath}/docs`}>Go to the Here Be Dragons docs →</a>
    </main>
  );
}
