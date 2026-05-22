import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme.dart';

class TeamMgmtView extends StatefulWidget {
  final String teamName;
  const TeamMgmtView({Key? key, required this.teamName}) : super(key: key);

  @override
  State<TeamMgmtView> createState() => _TeamMgmtViewState();
}

class _TeamMgmtViewState extends State<TeamMgmtView> {
  final List<Map<String, dynamic>> _squad = [
    {'name': 'Vikram Malhotra', 'role': 'Batsman', 'active': true},
    {'name': 'Rohan Kulkarni', 'role': 'Bowler', 'active': true},
    {'name': 'Amit Shah', 'role': 'Batsman', 'active': true},
    {'name': 'Kabir Dev', 'role': 'All-Rounder', 'active': true},
    {'name': 'Devendra Joshi', 'role': 'Wicket-Keeper', 'active': true},
    {'name': 'Sanjay Bangar', 'role': 'All-Rounder', 'active': true},
    {'name': 'Ramesh Powar', 'role': 'Bowler', 'active': true},
    {'name': 'Zaheer Khan', 'role': 'Bowler', 'active': true},
    {'name': 'Sachin Tendulkar', 'role': 'Batsman', 'active': true},
    {'name': 'Rahul Dravid', 'role': 'Batsman', 'active': true},
    {'name': 'Sourav Ganguly', 'role': 'Batsman', 'active': true},
    {'name': 'Yuvraj Singh', 'role': 'All-Rounder', 'active': false},
    {'name': 'Harbhajan Singh', 'role': 'Bowler', 'active': false},
    {'name': 'VVS Laxman', 'role': 'Batsman', 'active': false},
  ];

  final _nameController = TextEditingController();
  String _selectedRole = 'Batsman';
  String? _alertMessage;

  void _handleAddPlayer() {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() {
      _squad.add({
        'name': name,
        'role': _selectedRole,
        'active': false,
      });
      _nameController.clear();
      _alertMessage = "Added $name to the squad squad.";
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added $name successfully!'),
        backgroundColor: SportsTheme.accentNeon,
      ),
    );
  }

  void _toggleActive(int index) {
    final activeCount = _squad.where((p) => p['active'] == true).length;
    final currentlyActive = _squad[index]['active'] as bool;

    if (!currentlyActive && activeCount >= 11) {
      setState(() {
        _alertMessage = "Wicket alert! Playing XI cannot exceed exactly 11 players.";
      });
      return;
    }

    setState(() {
      _squad[index]['active'] = !currentlyActive;
      _alertMessage = null;
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _squad.where((p) => p['active'] == true).length;

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.teamName} Roster'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Active squad counter card
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: SportsTheme.bgSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: activeCount == 11 ? SportsTheme.accentNeon : Colors.orangeAccent,
                  width: 1.0
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Active Playing XI Selection',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        activeCount == 11 
                            ? 'XI Nominated successfully. Ready to deploy.'
                            : 'Nominate exactly 11 players for match validation.',
                        style: const TextStyle(color: SportsTheme.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: activeCount == 11 
                          ? SportsTheme.accentNeon.withOpacity(0.15) 
                          : Colors.orangeAccent.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '$activeCount/11',
                      style: GoogleFonts.orbitron(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: activeCount == 11 ? SportsTheme.accentNeon : Colors.orangeAccent,
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 16),

            if (_alertMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orangeAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orangeAccent.withOpacity(0.3)),
                ),
                child: Text(
                  _alertMessage!,
                  style: const TextStyle(color: Colors.orangeAccent, fontSize: 11),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Add player form
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: SportsTheme.bgSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: SportsTheme.borderNavy),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Recruit New Player to Squad', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            labelText: 'Player Full Name',
                            hintText: 'e.g. MS Dhoni',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: SportsTheme.bgPrimary,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: SportsTheme.borderNavy),
                        ),
                        child: DropdownButton<String>(
                          value: _selectedRole,
                          underline: const SizedBox(),
                          dropdownColor: SportsTheme.bgSecondary,
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          items: const [
                            DropdownMenuItem(value: 'Batsman', child: Text('Batsman')),
                            DropdownMenuItem(value: 'Bowler', child: Text('Bowler')),
                            DropdownMenuItem(value: 'All-Rounder', child: Text('All-Rounder')),
                            DropdownMenuItem(value: 'Wicket-Keeper', child: Text('Wkt-Keeper')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedRole = val);
                            }
                          },
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _handleAddPlayer,
                    child: const Text('ADD PLAYER TO SQUAD'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Roster list Header
            const Text(
              'Squad Directory',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 8),

            // Squad list builder
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _squad.length,
              itemBuilder: (context, index) {
                final player = _squad[index];
                final isActive = player['active'] as bool;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8.0),
                  color: isActive ? SportsTheme.accentNeon.withOpacity(0.04) : SportsTheme.bgSecondary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(
                      color: isActive ? SportsTheme.accentNeon : SportsTheme.borderNavy,
                      width: isActive ? 1.2 : 0.8
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    title: Text(
                      player['name'],
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        color: isActive ? Colors.white : SportsTheme.textSecondary
                      ),
                    ),
                    subtitle: Text(
                      player['role'].toString().toUpperCase(),
                      style: TextStyle(
                        fontSize: 10, 
                        fontWeight: FontWeight.bold,
                        color: isActive ? SportsTheme.accentNeon : Colors.white24
                      ),
                    ),
                    trailing: Switch(
                      value: isActive,
                      activeColor: SportsTheme.accentNeon,
                      activeTrackColor: SportsTheme.accentNeon.withOpacity(0.2),
                      inactiveThumbColor: SportsTheme.textSecondary,
                      inactiveTrackColor: Colors.white10,
                      onChanged: (_) => _toggleActive(index),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
