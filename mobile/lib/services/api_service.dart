import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as io;

class ApiService {
  static const String baseUrl = 'http://localhost:5001/api';
  static const String socketUrl = 'http://localhost:5001';

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  io.Socket? _socket;
  final _scoreController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get scoreStream => _scoreController.stream;
  bool isConnected = false;
  String? authToken;
  String? userRole;
  String? userPhone;

  void initSocket(int matchId) {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
    }

    _socket = io.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    _socket!.connect();

    _socket!.onConnect((_) {
      isConnected = true;
      _socket!.emit('join_match', matchId);
    });

    _socket!.onDisconnect((_) {
      isConnected = false;
    });

    _socket!.on('score_update', (data) {
      if (data is Map<String, dynamic>) {
        _scoreController.add(data);
      } else if (data is Map) {
        _scoreController.add(Map<String, dynamic>.from(data));
      } else if (data is String) {
        _scoreController.add(Map<String, dynamic>.from(jsonDecode(data)));
      }
    });
  }

  void leaveMatch(int matchId) {
    if (_socket != null && isConnected) {
      _socket!.emit('leave_match', matchId);
    }
  }

  Future<bool> requestOtp(String phone) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/request-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone}),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<bool> verifyOtp(String phone, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'otp': otp}),
      );

      if (response.statusCode != 200) {
        return false;
      }

      final data = jsonDecode(response.body);
      authToken = data['token'];
      userRole = data['user']['role'];
      userPhone = phone;
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getTournaments() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/tournaments'));
      if (response.statusCode != 200) {
        return [];
      }

      final payload = jsonDecode(response.body);
      final tournaments = List<Map<String, dynamic>>.from(payload['data'] ?? []);

      final results = await Future.wait(
        tournaments.map((tournament) => getTournamentDetails(tournament['id'] as int)),
      );

      return results.whereType<Map<String, dynamic>>().toList();
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> getTournamentDetails(int id) async {
    try {
      final responses = await Future.wait([
        http.get(Uri.parse('$baseUrl/tournaments/$id')),
        http.get(Uri.parse('$baseUrl/tournaments/$id/teams')),
        http.get(Uri.parse('$baseUrl/tournaments/$id/fixtures')),
        http.get(Uri.parse('$baseUrl/tournaments/$id/standings')),
      ]);

      if (responses.any((response) => response.statusCode != 200)) {
        return null;
      }

      final tournamentPayload = jsonDecode(responses[0].body);
      final teamsPayload = jsonDecode(responses[1].body);
      final fixturesPayload = jsonDecode(responses[2].body);
      final standingsPayload = jsonDecode(responses[3].body);

      final tournament = Map<String, dynamic>.from(tournamentPayload['data']);
      final teams = List<Map<String, dynamic>>.from(teamsPayload['data'] ?? []);
      final fixtures = List<Map<String, dynamic>>.from(fixturesPayload['data'] ?? []);

      return {
        'id': tournament['id'],
        'name': tournament['name'],
        'format': tournament['type'],
        'location': tournament['venue_details']?['ground_name'] ?? 'Venue TBD',
        'start_date': tournament['start_date'] ?? '',
        'status': tournament['status'],
        'rules': jsonEncode(tournament['rules'] ?? {}),
        'teams': teams
            .map((team) => {
                  'id': team['id'],
                  'name': team['name'],
                  'logo_initial': (team['name'] ?? 'T').toString().substring(0, 1).toUpperCase(),
                })
            .toList(),
        'standings': List<Map<String, dynamic>>.from(standingsPayload['pointsTable'] ?? []),
        'caps': {
          'orange': List<Map<String, dynamic>>.from(standingsPayload['orangeCap'] ?? []),
          'purple': List<Map<String, dynamic>>.from(standingsPayload['purpleCap'] ?? []),
        },
        'fixtures': fixtures
            .map((fixture) => {
                  'id': fixture['id'],
                  'tournament_id': fixture['tournament_id'],
                  'team_a': 'Team ${fixture['team1_id']}',
                  'team_b': 'Team ${fixture['team2_id']}',
                  'match_type': tournament['type'],
                  'status': fixture['status'],
                  'venue': fixture['ground'],
                  'date': fixture['match_date'],
                  'score': <String, dynamic>{},
                })
            .toList(),
      };
    } catch (_) {
      return null;
    }
  }

  Future<bool> submitBall(int matchId, Map<String, dynamic> ballDetails) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/matches/$matchId/ball'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(ballDetails),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<bool> undoBall(int matchId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/matches/$matchId/undo'),
        headers: {
          'Authorization': 'Bearer $authToken',
        },
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
