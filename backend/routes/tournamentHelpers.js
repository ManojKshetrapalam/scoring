export function sanitizePlayers(players = []) {
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error("Each team must include at least one player.");
  }

  let captainAssigned = false;
  let wicketKeeperAssigned = false;

  return players
    .map((player, index) => {
      const normalized = {
        id: player.id ? Number(player.id) : null,
        name: String(player.name || "").trim(),
        jerseyNumber: player.jerseyNumber ?? player.jersey_number ?? null,
        battingStyle: player.battingStyle || player.batting_style || null,
        bowlingStyle: player.bowlingStyle || player.bowling_style || null,
        isCaptain: Boolean(player.isCaptain || player.is_captain),
        isViceCaptain: Boolean(player.isViceCaptain || player.is_vice_captain),
        isWicketKeeper: Boolean(player.isWicketKeeper || player.is_wicket_keeper),
      };

      if (!normalized.name) {
        throw new Error(`Player ${index + 1} is missing a name.`);
      }

      if (normalized.isCaptain && !captainAssigned) {
        captainAssigned = true;
      } else if (normalized.isCaptain) {
        normalized.isCaptain = false;
      }

      if (normalized.isWicketKeeper && !wicketKeeperAssigned) {
        wicketKeeperAssigned = true;
      } else if (normalized.isWicketKeeper) {
        normalized.isWicketKeeper = false;
      }

      return normalized;
    })
    .map((player, index, list) => {
      if (!captainAssigned && index === 0) {
        player.isCaptain = true;
        captainAssigned = true;
      }
      if (!wicketKeeperAssigned && index === 0) {
        player.isWicketKeeper = true;
        wicketKeeperAssigned = true;
      }
      return player;
    });
}
