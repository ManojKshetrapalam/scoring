import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function MatchScorecard() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('scorecard');

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    fetch(`/scoring/api/matches/${id}`)
      .then(res => res.json())
      .then(json => setMatch(json.data));

    // Real-time updates
    const socket = io({ path: '/scoring/socket.io' });
    socket.emit('join_match', id);

    socket.on('score_update', (data) => {
      setMatch(data);
    });

    return () => socket.disconnect();
  }, [id]);

  if (!match) return <div className="p-8 text-center text-subtext">Loading live scorecard...</div>;

  const { liveData, currentInningsState, strikerCard, nonStrikerCard, bowlerCard } = match;

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans text-text">
      {/* Header Summary */}
      <div className="bg-card rounded-xl p-6 mb-6 border border-border shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-display font-bold">{match.team1Name} vs {match.team2Name}</h1>
          <span className="bg-accent px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {liveData.current.phase.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <div className="text-4xl font-bold">
            {currentInningsState?.runs || 0}/{currentInningsState?.wickets || 0}
          </div>
          <div className="text-lg text-subtext">
            ({currentInningsState?.overs || 0} Over)
          </div>
        </div>
        {match.targetRuns && (
          <p className="mt-2 text-accent text-sm">Target: {match.targetRuns}</p>
        )}
      </div>

      {/* Current Batter/Bowler Mini Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-subtext border-b border-border">
                <th className="text-left pb-2">Batsman</th>
                <th className="pb-2">R</th>
                <th className="pb-2">B</th>
                <th className="pb-2">4s</th>
                <th className="pb-2">6s</th>
                <th className="pb-2 text-right">SR</th>
              </tr>
            </thead>
            <tbody>
              {[strikerCard, nonStrikerCard].map((b, i) => b && (
                <tr key={b.playerId} className={i === 0 ? "font-bold text-accent" : ""}>
                  <td className="py-2">{b.name}{i === 0 ? '*' : ''}</td>
                  <td className="text-center">{b.runs}</td>
                  <td className="text-center">{b.balls}</td>
                  <td className="text-center">{b.fours}</td>
                  <td className="text-center">{b.sixes}</td>
                  <td className="text-right">{b.strikeRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-subtext border-b border-border">
                <th className="text-left pb-2">Bowler</th>
                <th className="pb-2">O</th>
                <th className="pb-2">M</th>
                <th className="pb-2">R</th>
                <th className="pb-2">W</th>
                <th className="pb-2 text-right">ECO</th>
              </tr>
            </thead>
            <tbody>
              {bowlerCard && (
                <tr>
                  <td className="py-2">{bowlerCard.name}</td>
                  <td className="text-center">{bowlerCard.overs}</td>
                  <td className="text-center">{bowlerCard.maidens}</td>
                  <td className="text-center">{bowlerCard.runs}</td>
                  <td className="text-center">{bowlerCard.wickets}</td>
                  <td className="text-right">{bowlerCard.economy}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {['Scorecard', 'Commentary'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-6 py-2 font-bold ${activeTab === tab.toLowerCase() ? "border-b-2 border-accent text-accent" : "text-subtext"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Full Detailed Scorecard */}
      {activeTab === 'scorecard' && (
        <div className="space-y-8">
          {[1, 2].map(num => {
            const innings = match[`innings${num}`];
            if (!innings) return null;
            return (
              <div key={num} className="bg-card rounded-lg overflow-hidden border border-border">
                <div className="bg-border/30 px-4 py-2 font-bold flex justify-between">
                  <span>Innings {num}</span>
                  <span>{innings.runs}/{innings.wickets} ({innings.overs})</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {innings.batsmen.map(b => (
                      <tr key={b.playerId} className="border-b border-border/50">
                        <td className="p-3 w-1/3">{b.name}</td>
                        <td className="p-3 text-subtext italic">{b.status === 'out' ? b.dismissal?.type : b.status}</td>
                        <td className="p-3 font-bold text-right">{b.runs} ({b.balls})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}