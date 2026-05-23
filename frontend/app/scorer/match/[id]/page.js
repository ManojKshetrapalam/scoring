"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ScorerMatchConsole from "../../../../components/scorer/ScorerMatchConsole";

export default function ScorerMatchPage() {
  const params = useParams();
  const router = useRouter();
  const fixtureId = params?.id?.toString();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("scorer-token");
    if (!token) {
      router.replace("/scorer");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready || !fixtureId) {
    return <p className="text-sm text-subtext">Loading match console…</p>;
  }

  return <ScorerMatchConsole fixtureId={fixtureId} />;
}
