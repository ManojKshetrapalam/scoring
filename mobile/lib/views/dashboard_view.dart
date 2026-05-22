import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../theme.dart';
import 'login_view.dart';
import 'match_center_view.dart';
import 'scorer_view.dart';
import 'team_mgmt_view.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({Key? key}) : super(key: key);

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView>
    with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  List<Map<String, dynamic>> _tournaments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final data = await _apiService.getTournaments();
    setState(() {
      _tournaments = data;
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _handleLogout() {
    _apiService.authToken = null;
    _apiService.userRole = null;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginView()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = _apiService.userRole ?? 'audience';
    final isAdminOrScorer = role == 'admin' || role == 'scorer';
    final isManager = role == 'manager' || role == 'admin';

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            RichText(
              text: TextSpan(
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                children: const [
                  TextSpan(
                    text: 'g',
                    style: TextStyle(
                      color: Color(0xFF863BC1),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextSpan(text: 'Events'),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFF863BC1),
                borderRadius: BorderRadius.circular(3),
              ),
              child: Text(
                'CRICKET',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
        actions: [
          // Display User Role Tag
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            decoration: BoxDecoration(
              color: role == 'admin'
                  ? Colors.redAccent.withOpacity(0.15)
                  : (role == 'scorer'
                      ? SportsTheme.accentNeon.withOpacity(0.15)
                      : Colors.white10),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: role == 'admin'
                      ? Colors.redAccent
                      : (role == 'scorer'
                          ? SportsTheme.accentNeon
                          : Colors.white24)),
            ),
            alignment: Alignment.center,
            child: Text(
              role.toUpperCase(),
              style: TextStyle(
                  color: role == 'admin'
                      ? Colors.redAccent
                      : (role == 'scorer'
                          ? SportsTheme.accentNeon
                          : Colors.white),
                  fontSize: 9,
                  fontWeight: FontWeight.bold),
            ),
          ),
          IconButton(
            onPressed: _handleLogout,
            icon: const Icon(Icons.logout, size: 18),
            tooltip: 'Sign Out',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: SportsTheme.accentNeon,
          labelColor: SportsTheme.accentNeon,
          unselectedLabelColor: SportsTheme.textSecondary,
          labelStyle:
              const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          tabs: const [
            Tab(text: 'TOURNAMENTS'),
            Tab(text: 'STANDINGS'),
            Tab(text: 'LEADERBOARD'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: SportsTheme.accentNeon))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildTournamentsTab(isAdminOrScorer, isManager),
                _buildStandingsTab(),
                _buildLeaderboardTab(),
              ],
            ),
    );
  }

  // --- TAB 1: TOURNAMENTS & FIXTURES ---
  Widget _buildTournamentsTab(bool showScorer, bool showManager) {
    if (_tournaments.isEmpty) {
      return const Center(child: Text('No active tournaments found.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: _tournaments.length,
      itemBuilder: (context, index) {
        final t = _tournaments[index];
        final fixtures = List<Map<String, dynamic>>.from(t['fixtures'] ?? []);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Tournament Banner
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: SportsTheme.bgSecondary,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
                border: Border.all(color: SportsTheme.borderNavy),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: SportsTheme.accentNeon.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          t['format'].toString().toUpperCase(),
                          style: const TextStyle(
                              color: SportsTheme.accentNeon,
                              fontSize: 9,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      Text(
                        t['status'],
                        style: const TextStyle(
                            color: Colors.green,
                            fontSize: 11,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    t['name'],
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on,
                          size: 12, color: SportsTheme.textSecondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          t['location'],
                          style: const TextStyle(
                              color: SportsTheme.textSecondary, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Matches inside tournament
            Container(
              margin: const EdgeInsets.only(bottom: 20.0),
              decoration: BoxDecoration(
                color: SportsTheme.bgPrimary,
                borderRadius:
                    const BorderRadius.vertical(bottom: Radius.circular(12)),
                border: Border.all(color: SportsTheme.borderNavy),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: fixtures.length,
                separatorBuilder: (_, __) =>
                    const Divider(color: SportsTheme.borderNavy, height: 1),
                itemBuilder: (context, fIndex) {
                  final f = fixtures[fIndex];
                  final isLive = f['status'] == 'Live';

                  return InkWell(
                    onTap: () {
                      Navigator.of(context)
                          .push(
                            MaterialPageRoute(
                              builder: (_) => MatchCenterView(
                                  matchId: f['id'], tournamentName: t['name']),
                            ),
                          )
                          .then((_) => _loadData());
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                f['match_type'].toUpperCase(),
                                style: const TextStyle(
                                    color: SportsTheme.textSecondary,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold),
                              ),
                              if (isLive) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 5,
                                        height: 5,
                                        decoration: const BoxDecoration(
                                            color: Colors.white,
                                            shape: BoxShape.circle),
                                      ),
                                      const SizedBox(width: 4),
                                      const Text('LIVE',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 8,
                                              fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                )
                              ] else ...[
                                Text(
                                  f['status'].toUpperCase(),
                                  style: TextStyle(
                                      color: f['status'] == 'Upcoming'
                                          ? SportsTheme.accentNeon
                                          : SportsTheme.textSecondary,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold),
                                )
                              ]
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              Expanded(
                                child: Text(
                                  f['team_a'],
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13),
                                ),
                              ),
                              const Text('VS',
                                  style: TextStyle(
                                      color: SportsTheme.accentNeon,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 12)),
                              Expanded(
                                child: Text(
                                  f['team_b'],
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13),
                                ),
                              ),
                            ],
                          ),

                          // Quick scoring summaries
                          if (isLive && f['score'] != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: SportsTheme.bgSecondary,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '${f['score']['runs']}-${f['score']['wickets']} (${f['score']['overs']} Ov)',
                                style: GoogleFonts.orbitron(
                                    color: SportsTheme.accentNeon,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],

                          // Dynamic buttons depending on role
                          if (isLive && showScorer) ...[
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context)
                                    .push(
                                      MaterialPageRoute(
                                        builder: (_) => ScorerView(
                                            matchId: f['id'],
                                            teamA: f['team_a'],
                                            teamB: f['team_b']),
                                      ),
                                    )
                                    .then((_) => _loadData());
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: SportsTheme.accentNeon,
                                padding: const EdgeInsets.symmetric(
                                    vertical: 8, horizontal: 16),
                              ),
                              icon: const Icon(Icons.sports,
                                  size: 14, color: Colors.black),
                              label: const Text('SCORE MATCH',
                                  style: TextStyle(fontSize: 11)),
                            ),
                          ],

                          if (showManager) ...[
                            const SizedBox(height: 8),
                            TextButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                      builder: (_) =>
                                          TeamMgmtView(teamName: f['team_a'])),
                                );
                              },
                              icon: const Icon(Icons.people, size: 14),
                              label: const Text('ROSTER MANAGER',
                                  style: TextStyle(fontSize: 11)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  // --- TAB 2: STANDINGS TABLE ---
  Widget _buildStandingsTab() {
    if (_tournaments.isEmpty) return const SizedBox();
    final t =
        _tournaments.first; // Load first tournament standings as core model
    final standings = List<Map<String, dynamic>>.from(t['standings'] ?? []);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t['name'].toString().toUpperCase(),
            style: const TextStyle(
                color: SportsTheme.accentNeon,
                fontSize: 11,
                fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Points standings & NRR',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: SportsTheme.bgSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: SportsTheme.borderNavy),
            ),
            child: DataTable(
              columnSpacing: 10,
              horizontalMargin: 12,
              columns: const [
                DataColumn(
                    label: Text('TEAM',
                        style: TextStyle(
                            fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(
                    label: Text('P',
                        style: TextStyle(
                            fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(
                    label: Text('W',
                        style: TextStyle(
                            fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(
                    label: Text('NRR',
                        style: TextStyle(
                            fontSize: 10, fontWeight: FontWeight.bold))),
                DataColumn(
                    label: Text('PTS',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: SportsTheme.accentNeon))),
              ],
              rows: standings.map((s) {
                return DataRow(cells: [
                  DataCell(Text(
                    s['team'],
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 11),
                  )),
                  DataCell(Text(s['played'].toString(),
                      style: const TextStyle(fontSize: 11))),
                  DataCell(Text(s['won'].toString(),
                      style: const TextStyle(fontSize: 11))),
                  DataCell(Text(s['nrr'].toString(),
                      style: const TextStyle(
                          fontSize: 11, color: SportsTheme.textSecondary))),
                  DataCell(Text(s['points'].toString(),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: SportsTheme.accentNeon,
                          fontSize: 12))),
                ]);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  // --- TAB 3: LEADERBOARD CAPS ---
  Widget _buildLeaderboardTab() {
    if (_tournaments.isEmpty) return const SizedBox();
    final t = _tournaments.first;
    final caps = t['caps'] as Map<String, dynamic>;
    final orange = List<Map<String, dynamic>>.from(caps['orange'] ?? []);
    final purple = List<Map<String, dynamic>>.from(caps['purple'] ?? []);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Orange Cap Header
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                    color: SportsTheme.accentOrange, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(
                'ORANGE CAP LEADERBOARD',
                style: GoogleFonts.orbitron(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: SportsTheme.accentOrange),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: orange.length,
            itemBuilder: (context, index) {
              final player = orange[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: SportsTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: SportsTheme.borderNavy),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(player['name'],
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13)),
                        Text(player['team'],
                            style: const TextStyle(
                                color: SportsTheme.textSecondary,
                                fontSize: 10)),
                      ],
                    ),
                    Row(
                      children: [
                        Text('${player['runs']} runs',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(width: 12),
                        Text('Avg: ${player['avg']}',
                            style: const TextStyle(
                                color: SportsTheme.textSecondary,
                                fontSize: 10)),
                      ],
                    )
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 24),

          // Purple Cap Header
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                    color: SportsTheme.accentPurple, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(
                'PURPLE CAP LEADERBOARD',
                style: GoogleFonts.orbitron(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: SportsTheme.accentPurple),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: purple.length,
            itemBuilder: (context, index) {
              final player = purple[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: SportsTheme.bgSecondary,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: SportsTheme.borderNavy),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(player['name'],
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13)),
                        Text(player['team'],
                            style: const TextStyle(
                                color: SportsTheme.textSecondary,
                                fontSize: 10)),
                      ],
                    ),
                    Row(
                      children: [
                        Text('${player['wickets']} wkts',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13)),
                        const SizedBox(width: 12),
                        Text('Econ: ${player['econ']}',
                            style: const TextStyle(
                                color: SportsTheme.textSecondary,
                                fontSize: 10)),
                      ],
                    )
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
