"use client";

import Button from "../_components/Button";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/play");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-center text-2xl font-semibold">
        どの丸が押しやすい？
        <br />
        直感でタップしてみよう！
      </div>
      <Button onClick={handleStart}>スタート！</Button>
    </main>
  );
}
