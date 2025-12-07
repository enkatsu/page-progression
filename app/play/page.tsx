"use client";

import dynamic from "next/dynamic";

const PlayPageContent = dynamic(() => import("./PlayPageContent"), {
  ssr: false,
  loading: () => (
    <main className="w-screen h-screen overflow-hidden bg-black" />
  ),
});

export default function PlayPage() {
  return <PlayPageContent />;
}
