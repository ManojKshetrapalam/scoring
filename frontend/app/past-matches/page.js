"use client";

import PastMatchList from "../../components/PastMatchList";

export default function PastMatchesPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display">Past Matches</h1>
        <p className="text-sm text-subtext">
          All completed tournament and friendly matches. Open a match for the full scorecard and man of the match.
        </p>
      </header>
      <PastMatchList title="All completed matches" />
    </div>
  );
}
