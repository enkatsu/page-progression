"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const PlaybackPageContent = dynamic(() => import("./PlaybackPageContent"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-black" />
  ),
});

function PlaybackPageWrapper() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
      <PlaybackPageContent />
    </Suspense>
  );
}

export default function PlaybackPage() {
  return <PlaybackPageWrapper />;
}
