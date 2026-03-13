"use client";

import dynamic from "next/dynamic";

const KnitGame = dynamic(() => import("./KnitGame"), { ssr: false });

export default function Home() {
  return (
    <main className="h-dvh w-full overflow-hidden">
      <KnitGame />
    </main>
  );
}
