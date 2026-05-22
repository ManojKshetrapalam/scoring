import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../theme.dart';

class MatchCenterView extends StatefulWidget {
  final int matchId;
  final String tournamentName;
  const MatchCenterView(
      {Key? key, required this.matchId, required this.tournamentName})
      : super(key: key);

  @override
  State<MatchCenterView> createState() => _MatchCenterViewState();
}

class _MatchCenterViewState extends State<MatchCenterView> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _matchData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInitialState();

    // Subscribe to live score update websocket
    _apiService.initSocket(widget.matchId);
    _apiService.scoreStream.listen((event) {
      if (mounted) {
        setState(() {
          // Merge websocket broadcast into local state
          if (_matchData != null && _matchData!['score'] != null) {
            final score = _matchData!['score'] as Map<String, dynamic>;
            score['runs'] = event['runs'] ?? score['runs'];
            score['wickets'] = event['wickets'] ?? score['wickets'];
            score['overs'] = event['overs'] ?? score['overs'];
            score['balls'] = event['balls'] ?? score['balls'];
            score['commentary'] = event['commentary'] ?? score['commentary'];
            score['striker'] = event['striker'] ?? score['striker'];
            score['bowler'] = event['bowler'] ?? score['bowler'];
          }
        });
      }
    });
  }

  Future<void> _loadInitialState() async {
    setState(() => _isLoading = true);
    final details = await _apiService.getTournamentDetails(1); // Fetch template
    if (details != null) {
      final fixtures =
          List<Map<String, dynamic>>.from(details['fixtures'] ?? []);
      for (var f in fixtures) {
        if (f['id'] == widget.matchId) {
          setState(() {
            _matchData = f;
            _isLoading = false;
          });
          return;
        }
      }
      setState(() {
        _matchData = fixtures.first;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _apiService.leaveMatch(widget.matchId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
            child: CircularProgressIndicator(color: SportsTheme.accentNeon)),
      );
    }

    if (_matchData == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Match Details')),
        body: const Center(child: Text('Match data was not resolved.')),
      );
    }

    final isLive = _matchData!['status'] == 'Live';
    final score = _matchData!['score'] as Map<String, dynamic>? ?? {};
    final hasScore = score.isNotEmpty;

    final runs = score['runs'] ?? 0;
    final wickets = score['wickets'] ?? 0;
    final overs = score['overs'] ?? '0.0';
    final battingTeam = score['batting_team'] ?? _matchData!['team_a'];
    final bowlingTeam = battingTeam == _matchData!['team_a']
        ? _matchData!['team_b']
        : _matchData!['team_a'];

    final lastBalls = List<dynamic>.from(score['balls'] ?? []);
    final commentary = List<String>.from(score['commentary'] ?? []);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.tournamentName,
                style: const TextStyle(
                    fontSize: 10, color: SportsTheme.accentNeon)),
            Text('${_matchData!['team_a']} vs ${_matchData!['team_b']}',
                style:
                    const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Premium scoreboard banner
            Container(
              padding: const EdgeInsets.all(20.0),
              decoration: const BoxDecoration(
                color: SportsTheme.bgSecondary,
                border:
                    Border(bottom: BorderSide(color: SportsTheme.borderNavy)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        battingTeam.toString().toUpperCase(),
                        style: const TextStyle(
                            color: SportsTheme.accentNeon,
                            fontWeight: FontWeight.bold,
                            fontSize: 13),
                      ),
                      if (isLive) ...[
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'LIVE CENTER',
                              style: TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10),
                            )
                          ],
                        )
                      ] else ...[
                        Text(
                          _matchData!['status'].toString().toUpperCase(),
                          style: const TextStyle(
                              color: SportsTheme.textSecondary,
                              fontSize: 10,
                              fontWeight: FontWeight.bold),
                        ),
                      ]
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Big Runs & Overs
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '$runs-$wickets',
                            style: GoogleFonts.orbitron(
                              fontSize: 48,
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'runs',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: SportsTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Overs: $overs',
                            style: GoogleFonts.orbitron(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            'CRR: ${(double.parse(overs) > 0 ? (runs / double.parse(overs)) : 0.0).toStringAsFixed(2)}',
                            style: const TextStyle(
                                color: SportsTheme.textSecondary, fontSize: 11),
                          ),
                        ],
                      )
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Ball Ticker (Recent balls)
                  Row(
                    children: [
                      const Text(
                        'Recent balls: ',
                        style: TextStyle(
                            color: SportsTheme.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SizedBox(
                          height: 28,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: lastBalls.length,
                            itemBuilder: (context, bIndex) {
                              final item = lastBalls[bIndex];
                              return Container(
                                margin: const EdgeInsets.only(right: 6),
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: item.toString() == 'W'
                                      ? Colors.redAccent.withOpacity(0.15)
                                      : (item.toString() == '6'
                                          ? SportsTheme.accentNeon
                                              .withOpacity(0.15)
                                          : Colors.white10),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: item.toString() == 'W'
                                          ? Colors.redAccent
                                          : (item.toString() == '6'
                                              ? SportsTheme.accentNeon
                                              : Colors.white24)),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  item.toString(),
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: item.toString() == 'W'
                                          ? Colors.redAccent
                                          : (item.toString() == '6'
                                              ? SportsTheme.accentNeon
                                              : Colors.white)),
                                ),
                              );
                            },
                          ),
                        ),
                      )
                    ],
                  ),
                ],
              ),
            ),

            // Partnership and Striker Card
            if (hasScore) ...[
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: SportsTheme.bgSecondary,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SportsTheme.borderNavy),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('ACTIVE STRIKER',
                                    style: TextStyle(
                                        color: SportsTheme.textSecondary,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(
                                  score['striker'] ?? 'Vikram Malhotra',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(
                            height: 30,
                            child: VerticalDivider(
                                color: SportsTheme.borderNavy, thickness: 1),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('BOWLING FOR $bowlingTeam',
                                    style: const TextStyle(
                                        color: SportsTheme.textSecondary,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                Text(
                                  score['bowler'] ?? 'Aditya Sen',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ),
            ],

            // Venue and detail card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: SportsTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: SportsTheme.borderNavy),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.location_on_outlined,
                        color: SportsTheme.accentNeon, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('VENUE & TYPE',
                              style: TextStyle(
                                  color: SportsTheme.textSecondary,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold)),
                          const SizedBox(height: 2),
                          Text(
                            '${_matchData!['venue']} (${_matchData!['match_type']})',
                            style: const TextStyle(
                                fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Commentary marquee header
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: Text(
                'Live Ball-by-Ball Commentary',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),

            // Commentary listing
            commentary.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                    child: Center(
                      child: Text(
                        'Commentary channel is empty. Awaiting first ball delivery.',
                        style: TextStyle(
                            color: SportsTheme.textSecondary, fontSize: 12),
                      ),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    itemCount: commentary.length,
                    itemBuilder: (context, cIndex) {
                      final item = commentary[cIndex];
                      final isWicket = item.contains('[WICKET!]');
                      final isBoundary =
                          item.contains('SIX') || item.contains('4 run');

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8.0),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isWicket
                              ? Colors.redAccent.withOpacity(0.05)
                              : (isBoundary
                                  ? SportsTheme.accentNeon.withOpacity(0.04)
                                  : SportsTheme.bgSecondary),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: isWicket
                                  ? Colors.redAccent.withOpacity(0.3)
                                  : (isBoundary
                                      ? SportsTheme.accentNeon.withOpacity(0.3)
                                      : SportsTheme.borderNavy),
                              width: 1.0),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 4),
                              decoration: BoxDecoration(
                                color: isWicket
                                    ? Colors.redAccent
                                    : (isBoundary
                                        ? SportsTheme.accentNeon
                                        : Colors.white10),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                item.split(':').first,
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isWicket || isBoundary
                                        ? Colors.black
                                        : Colors.white,
                                    fontSize: 10),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                item.substring(item.indexOf(':') + 1).trim(),
                                style:
                                    const TextStyle(fontSize: 12, height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}
