import { Suspense } from "react";
import { ConnectTikTokClient } from "./_components/ConnectTikTokClient";

export default async function ConnectTikTokPage() {
  return (
    <Suspense fallback={<div className="p-space-8 text-center text-muted-foreground">Loading...</div>}>
      <ConnectTikTokClient />
    </Suspense>
  );
}

