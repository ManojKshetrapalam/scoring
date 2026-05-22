import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../theme.dart';

class ScorerView extends StatefulWidget {
  final int matchId;
  final String teamA;
  final String teamB;
  const ScorerView(
      {Key? key,
      required this.matchId,
      required this.teamA,
      required this.teamB})
      : super(key: key);

  @override
  State<ScorerView> createState() => _ScorerViewState();
}

class _ScorerViewState extends State<ScorerView> {
  final ApiService _apiService = ApiService();

  int _runs = 0;
  int _wickets = 0;
  double _overs = 0.0;
  String _striker = "";
  String _bowler = "";
  String _battingTeam = "";

  List<int> _ballsList = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _battingTeam = widget.teamA;
  }

  Future<void> _handleScoreEvent({
    required int runs,
    required bool isWicket,
    String? extraType,
  }) async {
    setState(() => _isLoading = true);

    final payload = {
      'batsman': _striker,
      'bowler': _bowler,
      'runs': runs,
      'wicket': isWicket,
      'extras_type': extraType,
    };

    final success = await _apiService.submitBall(widget.matchId, payload);

    setState(() {
      _isLoading = false;
      if (success) {
        // Increment score locally for immediate UI reactivity
        int runsScored = runs;
        if (extraType == 'wide' || extraType == 'noball') {
          runsScored += 1;
        }
        _runs += runsScored;

        if (isWicket) {
          _wickets += 1;
        }

        if (extraType != 'wide' && extraType != 'noball') {
          // legitimate ball
          int completed = _overs.floor();
          int currentBalls = ((_overs - completed) * 10).round();
          currentBalls += 1;
          if (currentBalls >= 6) {
            completed += 1;
            currentBalls = 0;
          }
          _overs = completed + (currentBalls / 10.0);
        }

        _ballsList.insert(0, runsScored);
        if (_ballsList.length > 6) {
          _ballsList.removeLast();
        }
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:
            Text('Registered Ball! +$runs runs ${isWicket ? "[WKT]" : ""}'),
        duration: const Duration(milliseconds: 600),
        backgroundColor: SportsTheme.accentNeon,
      ),
    );
  }

  Future<void> _handleUndo() async {
    setState(() => _isLoading = true);
    final success = await _apiService.undoBall(widget.matchId);
    setState(() {
      _isLoading = false;
      if (success) {
        if (_runs > 1) _runs -= 1; // Simple approximation
        if (_ballsList.isNotEmpty) {
          _ballsList.removeAt(0);
        }
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Last ball rolled back successfully!'),
        duration: Duration(milliseconds: 600),
        backgroundColor: Colors.redAccent,
      ),
    );
  }

  void _showWicketDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: SportsTheme.bgSecondary,
          title: const Text('Nominate Wicket Style'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Bowled'),
                onTap: () {
                  Navigator.pop(context);
                  _handleScoreEvent(runs: 0, isWicket: true);
                },
              ),
              ListTile(
                title: const Text('Caught'),
                onTap: () {
                  Navigator.pop(context);
                  _handleScoreEvent(runs: 0, isWicket: true);
                },
              ),
              ListTile(
                title: const Text('Run Out'),
                onTap: () {
                  Navigator.pop(context);
                  _handleScoreEvent(runs: 1, isWicket: true);
                },
              ),
              ListTile(
                title: const Text('LBW'),
                onTap: () {
                  Navigator.pop(context);
                  _handleScoreEvent(runs: 0, isWicket: true);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showExtrasDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: SportsTheme.bgSecondary,
          title: const Text('Record Extras Delivery'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Wide (+1 Run)'),
                onTap: () {
                  Navigator.pop(context);
                  _handleScoreEvent(
                      runs: 0, isWicket: false, extraType: 'wide');
                },
              ),
              ListTile(
                title: const Text('No Ball (+1 Run)'),
                onTap: () {
                  Navigator.pop(context);
                  _handleScoreEvent(
                      runs: 0, isWicket: false, extraType: 'noball');
                },
              ),
              ListTile(
                title: const Text('Bye / Leg Bye'),
                onTap: () {
                  Navigator.pop(context);
                  _handleScoreEvent(runs: 1, isWicket: false, extraType: 'bye');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Interactive Scorer Deck'),
        actions: [
          IconButton(
            onPressed: _isLoading ? null : _handleUndo,
            icon: const Icon(Icons.undo, color: Colors.redAccent),
            tooltip: 'Rollback Last Ball',
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Current live scoreboard card
          Container(
            padding: const EdgeInsets.all(16.0),
            color: SportsTheme.bgSecondary,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _battingTeam.toUpperCase(),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: SportsTheme.accentNeon),
                    ),
                    Text(
                      'OVERS: ${_overs.toStringAsFixed(1)}',
                      style: GoogleFonts.orbitron(
                          fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$_runs-$_wickets',
                      style: GoogleFonts.orbitron(
                          fontSize: 36,
                          fontWeight: FontWeight.w500,
                          color: Colors.white),
                    ),
                    Text(
                      'Striker: $_striker\nBowler: $_bowler',
                      textAlign: TextAlign.end,
                      style: const TextStyle(
                          fontSize: 10,
                          color: SportsTheme.textSecondary,
                          height: 1.4),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Recent balls ticker
                Row(
                  children: [
                    const Text('This over: ',
                        style: TextStyle(
                            fontSize: 10, color: SportsTheme.textSecondary)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: SizedBox(
                        height: 24,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _ballsList.length,
                          itemBuilder: (context, idx) {
                            return Container(
                              margin: const EdgeInsets.only(right: 4),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white10,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _ballsList[idx].toString(),
                                style: const TextStyle(
                                    fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Striker Bowler Swapper Cards
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: SportsTheme.bgSecondary,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: SportsTheme.borderNavy),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('STRIKER',
                            style: TextStyle(
                                color: SportsTheme.textSecondary,
                                fontSize: 8,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(_striker,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: SportsTheme.bgSecondary,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: SportsTheme.borderNavy),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('BOWLER',
                            style: TextStyle(
                                color: SportsTheme.textSecondary,
                                fontSize: 8,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(_bowler,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const Spacer(),

          // MAIN TACTILE KEYPAD GRID
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Row 1: 0 (Dot), 1 Run, 2 Runs
                Row(
                  children: [
                    Expanded(
                      child: _buildTactileButton(
                        label: 'DOT BALL',
                        subLabel: '0 Runs',
                        onTap: () =>
                            _handleScoreEvent(runs: 0, isWicket: false),
                        color: SportsTheme.bgSecondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTactileButton(
                        label: '+1 RUN',
                        subLabel: 'Single',
                        onTap: () =>
                            _handleScoreEvent(runs: 1, isWicket: false),
                        color: SportsTheme.bgSecondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTactileButton(
                        label: '+2 RUNS',
                        subLabel: 'Double',
                        onTap: () =>
                            _handleScoreEvent(runs: 2, isWicket: false),
                        color: SportsTheme.bgSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Row 2: 3 Runs, 4 (Boundary), 6 (Maximal Boundary)
                Row(
                  children: [
                    Expanded(
                      child: _buildTactileButton(
                        label: '+3 RUNS',
                        subLabel: 'Triple',
                        onTap: () =>
                            _handleScoreEvent(runs: 3, isWicket: false),
                        color: SportsTheme.bgSecondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTactileButton(
                        label: 'FOUR (+4)',
                        subLabel: 'Boundary',
                        onTap: () =>
                            _handleScoreEvent(runs: 4, isWicket: false),
                        color: SportsTheme.accentNeon.withOpacity(0.1),
                        textColor: SportsTheme.accentNeon,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTactileButton(
                        label: 'SIX (+6)',
                        subLabel: 'Maximal',
                        onTap: () =>
                            _handleScoreEvent(runs: 6, isWicket: false),
                        color: SportsTheme.accentNeon.withOpacity(0.2),
                        textColor: SportsTheme.accentNeon,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Row 3: Special Drawers (Extras, Wickets)
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _showExtrasDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white10,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        icon: const Icon(Icons.add_circle_outline, size: 16),
                        label: const Text('RECORD EXTRAS'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _showWicketDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.redAccent,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        icon: const Icon(Icons.sports_cricket,
                            size: 16, color: Colors.black),
                        label: const Text('WICKET OUT!',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildTactileButton({
    required String label,
    required String subLabel,
    required VoidCallback onTap,
    required Color color,
    Color textColor = Colors.white,
  }) {
    return InkWell(
      onTap: _isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 72,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: SportsTheme.borderNavy),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 2),
            Text(
              subLabel,
              style: TextStyle(
                  fontSize: 9,
                  color: SportsTheme.textSecondary.withOpacity(0.6)),
            ),
          ],
        ),
      ),
    );
  }
}
