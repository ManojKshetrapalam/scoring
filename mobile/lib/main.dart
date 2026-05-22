import 'package:flutter/material.dart';
import 'theme.dart';
import 'views/login_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GeventsCricketApp());
}

class GeventsCricketApp extends StatelessWidget {
  const GeventsCricketApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gevents Unlimited Cricket',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: SportsTheme.darkTheme,
      theme: SportsTheme.darkTheme,
      home: const LoginView(),
    );
  }
}
