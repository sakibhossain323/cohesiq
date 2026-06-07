import { Suspense } from "react";
import { ConnectYouTubeClient } from "./_components/ConnectYouTubeClient";

export default async function ConnectYouTubePage() {
  return (
    <Suspense fallback={<div className="p-space-8 text-center text-muted-foreground">Loading...</div>}>
      <ConnectYouTubeClient />
    </Suspense>
  );
}
