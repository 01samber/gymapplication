import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/fitness_theme.dart';
import '../../../../core/widgets/icon_box.dart';
import '../../providers/auth_provider.dart';

/// Splash - Black / Yellow / Green theme
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  Timer? _timeoutTimer;

  @override
  void initState() {
    super.initState();
    _timeoutTimer = Timer(const Duration(seconds: 5), () {
      if (!mounted) return;
      final authState = ref.read(authStateProvider);
      if (authState.isLoading) context.go(AppRoutes.login);
    });
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FitnessColors.black,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconBox(
              icon: const Icon(Icons.fitness_center_rounded, color: FitnessColors.white, size: 48),
              style: IconBoxStyle.green,
              size: 100,
            ),
            const SizedBox(height: 28),
            ShaderMask(
              shaderCallback: (bounds) => FitnessColors.primaryGradient.createShader(bounds),
              child: Text(
                'SWEAT BOX',
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      color: FitnessColors.white,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 4,
                    ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'GYM',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: FitnessColors.yellow,
                    letterSpacing: 8,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
