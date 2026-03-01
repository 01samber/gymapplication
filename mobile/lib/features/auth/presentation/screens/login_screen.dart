import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/fitness_theme.dart';
import '../../../../core/widgets/icon_box.dart';
import '../../providers/auth_provider.dart';

/// Login - Black / Yellow / Green theme
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      await ref.read(authNotifierProvider.notifier).signIn(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_getErrorMessage(e)),
            backgroundColor: const Color(0xFFE74C3C),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _getErrorMessage(Object error) {
    final m = error.toString().toLowerCase();
    if (m.contains('pending')) return 'Registration awaiting approval.';
    if (m.contains('rejected')) return 'Registration rejected. Contact the gym.';
    if (m.contains('invalid password')) return 'Incorrect password.';
    if (m.contains('register first') || m.contains('no account')) return 'No account found. Ask your gym to add you.';
    if (m.contains('invalid') || m.contains('credentials')) return 'Invalid email or password.';
    if (m.contains('email not confirmed')) return 'Verify your email first.';
    return 'Login failed. Try again.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FitnessColors.black,
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    FitnessColors.green.withOpacity(0.08),
                    Colors.transparent,
                    FitnessColors.yellow.withOpacity(0.04),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 32),
                    Center(
                      child: Container(
                        decoration: BoxDecoration(
                          boxShadow: [
                            BoxShadow(
                              color: FitnessColors.green.withOpacity(0.35),
                              blurRadius: 24,
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                        child: IconBox(
                          icon: const Icon(Icons.fitness_center_rounded, color: FitnessColors.white, size: 32),
                          style: IconBoxStyle.green,
                          size: 72,
                        ),
                      ),
                    ),
                    const SizedBox(height: 36),
                    Text(
                      'Welcome Back',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: FitnessColors.white,
                            letterSpacing: -0.5,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in with your gym credentials',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: FitnessColors.grayLight,
                            fontSize: 15,
                          ),
                    ),
                    const SizedBox(height: 44),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(color: FitnessColors.white, fontSize: 16),
                      decoration: InputDecoration(
                    labelText: 'Email',
                    labelStyle: const TextStyle(color: FitnessColors.grayLight),
                    hintText: 'Enter your email',
                    hintStyle: TextStyle(color: FitnessColors.gray.withOpacity(0.7)),
                    prefixIcon: Padding(
                      padding: const EdgeInsets.only(left: 16, right: 12),
                      child: Icon(Icons.mail_outline_rounded, color: FitnessColors.yellow, size: 22),
                    ),
                    filled: true,
                    fillColor: FitnessColors.blackCard,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: FitnessColors.gray.withOpacity(0.3)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: FitnessColors.green, width: 2),
                    ),
                  ),
                      validator: (v) => v == null || v.isEmpty ? 'Enter your email' : (!v.contains('@') ? 'Valid email required' : null),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      style: const TextStyle(color: FitnessColors.white, fontSize: 16),
                  onFieldSubmitted: (_) => _handleLogin(),
                  decoration: InputDecoration(
                    labelText: 'Password',
                    labelStyle: const TextStyle(color: FitnessColors.grayLight),
                    hintText: 'Enter your password',
                    hintStyle: TextStyle(color: FitnessColors.gray.withOpacity(0.7)),
                    prefixIcon: Padding(
                      padding: const EdgeInsets.only(left: 16, right: 12),
                      child: Icon(Icons.lock_outline_rounded, color: FitnessColors.yellow, size: 22),
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        color: FitnessColors.yellow,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    filled: true,
                    fillColor: FitnessColors.blackCard,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: FitnessColors.gray.withOpacity(0.3)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: FitnessColors.green, width: 2),
                    ),
                  ),
                      validator: (v) => v == null || v.isEmpty ? 'Enter your password' : null,
                    ),
                    const SizedBox(height: 12),
                    Align(
                  alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => _showForgotPasswordDialog(),
                        child: Text('Forgot Password?', style: TextStyle(color: FitnessColors.yellow, fontWeight: FontWeight.w500)),
                      ),
                    ),
                    const SizedBox(height: 36),
                    ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: FitnessColors.green,
                    foregroundColor: FitnessColors.white,
                    elevation: 0,
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(color: FitnessColors.white, strokeWidth: 2),
                            )
                          : const Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(height: 48),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showForgotPasswordDialog() {
    final c = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: FitnessColors.blackCard,
        title: Text('Reset Password', style: TextStyle(color: FitnessColors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Enter your email for a reset link.', style: TextStyle(color: FitnessColors.grayLight)),
            const SizedBox(height: 16),
            TextField(
              controller: c,
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(color: FitnessColors.white),
              decoration: InputDecoration(
                labelText: 'Email',
                fillColor: FitnessColors.black,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: TextStyle(color: FitnessColors.gray))),
          ElevatedButton(
            onPressed: () async {
              if (c.text.isEmpty) return;
              try {
                await ref.read(authNotifierProvider.notifier).resetPassword(c.text.trim());
                if (mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: const Text('Reset email sent!'), backgroundColor: FitnessColors.green),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error: $e'), backgroundColor: const Color(0xFFE74C3C)),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: FitnessColors.green),
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }
}
