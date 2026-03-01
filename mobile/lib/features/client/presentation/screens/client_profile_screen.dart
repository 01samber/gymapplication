import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/fitness_theme.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../auth/providers/subscription_provider.dart';

/// Client profile and settings screen
class ClientProfileScreen extends ConsumerStatefulWidget {
  const ClientProfileScreen({super.key});

  @override
  ConsumerState<ClientProfileScreen> createState() => _ClientProfileScreenState();
}

class _ClientProfileScreenState extends ConsumerState<ClientProfileScreen> {
  bool _renewalDialogShown = false;

  @override
  Widget build(BuildContext context) {
    final userProfile = ref.watch(currentUserProfileProvider);
    final subData = ref.watch(clientSubscriptionDataProvider);

    // Show renewal notification once when expiring soon (last 5 days)
    subData.whenData((data) {
      if (data != null &&
          data.isExpiringSoon &&
          !_renewalDialogShown &&
          mounted) {
        _renewalDialogShown = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _showRenewalNotification(context, data);
        });
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: FitnessColors.black,
        elevation: 0,
        actions: [
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: FitnessColors.blackCard,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.settings_outlined, size: 22, color: FitnessColors.gray),
            ),
            onPressed: () {},
          ),
        ],
      ),
      body: userProfile.when(
        data: (profile) => SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Profile header
              _buildProfileHeader(context, profile),
              const SizedBox(height: 24),

              // Subscription info
              _buildSubscriptionCard(context, ref),
              const SizedBox(height: 24),

              // Menu items
              _buildMenuSection(context, ref),
              const SizedBox(height: 24),

              // Logout button
              _buildLogoutButton(context, ref),
              const SizedBox(height: 40),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, dynamic profile) {
    final name = profile?.fullName ?? 'User';
    final email = profile?.email ?? '';
    final initials = profile?.initials ?? '?';

    return Column(
      children: [
        // Avatar
        Stack(
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: FitnessColors.primaryColor1.withOpacity(0.1),
              child: Text(
                initials,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: FitnessColors.primaryColor1,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: FitnessColors.primaryColor1,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(
                  Icons.camera_alt,
                  size: 16,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          name,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          email,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: FitnessColors.gray,
              ),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () {
            // Edit profile
          },
          icon: const Icon(Icons.edit, size: 18),
          label: const Text('Edit Profile'),
        ),
      ],
    );
  }

  Widget _buildSubscriptionCard(BuildContext context, WidgetRef ref) {
    final subAsync = ref.watch(clientSubscriptionDataProvider);

    return subAsync.when(
      data: (data) {
        if (data == null || !data.isActive) {
          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
            color: FitnessColors.blackCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.credit_card_off,
                        color: FitnessColors.gray, size: 24),
                    const SizedBox(width: 12),
                    Text(
                      'No active subscription',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Contact the gym to subscribe or renew.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: FitnessColors.gray,
                      ),
                ),
              ],
            ),
          );
        }

        final renewalDate = data.endDate != null
            ? DateTime.tryParse(data.endDate!)
            : null;
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        String renewalText = 'No renewal date';
        if (renewalDate != null) {
          final m = renewalDate.month - 1;
          renewalText =
              'Renews on ${months[m]} ${renewalDate.day}, ${renewalDate.year}';
        }
        double progressValue = 0;
        if (data.startDate != null && data.endDate != null) {
          final start = DateTime.parse(data.startDate!);
          final end = DateTime.parse(data.endDate!);
          final now = DateTime.now();
          final total = end.difference(start).inDays;
          final used = now.difference(start).inDays;
          if (total > 0) {
            progressValue = (used.clamp(0, total) / total).clamp(0.0, 1.0);
          }
        }

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: FitnessColors.primaryGradient,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    data.planLabel,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Active',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildSubscriptionStat(
                    context,
                    '${data.daysRemaining}',
                    'Days Left',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              LinearProgressIndicator(
                value: progressValue,
                backgroundColor: Colors.white.withOpacity(0.3),
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 8),
              Text(
                renewalText,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withOpacity(0.8),
                    ),
              ),
            ],
          ),
        );
      },
      loading: () => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
            color: FitnessColors.blackCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Text('Loading subscription...'),
          ],
        ),
      ),
      error: (e, _) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
            color: FitnessColors.blackCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white),
        ),
        child: Text('Could not load subscription: $e'),
      ),
    );
  }

  Widget _buildSubscriptionStat(
      BuildContext context, String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withOpacity(0.8),
              ),
        ),
      ],
    );
  }

  Widget _buildMenuSection(BuildContext context, WidgetRef ref) {
    final menuItems = [
      _MenuItem(
        icon: Icons.person_outline,
        title: 'Personal Information',
        onTap: () {},
      ),
      _MenuItem(
        icon: Icons.monitor_weight_outlined,
        title: 'Body Composition',
        subtitle: 'InBody analysis & segmental breakdown',
        iconColor: Colors.teal,
        onTap: () => context.push(AppRoutes.clientBodyComposition),
      ),
      _MenuItem(
        icon: Icons.restaurant_outlined,
        title: 'Diet Plans',
        subtitle: 'View your personalized nutrition plans',
        iconColor: Colors.green,
        onTap: () => context.push(AppRoutes.clientDietPlans),
      ),
      _MenuItem(
        icon: Icons.edit_note_outlined,
        title: 'Meal Log',
        subtitle: 'Track your daily food intake',
        iconColor: Colors.orange,
        onTap: () => context.push(AppRoutes.clientMealLog),
      ),
      _MenuItem(
        icon: Icons.fitness_center,
        title: 'Fitness Goals',
        onTap: () {},
      ),
      _MenuItem(
        icon: Icons.history,
        title: 'Workout History',
        onTap: () {},
      ),
      _MenuItem(
        icon: Icons.notifications_outlined,
        title: 'Notifications',
        onTap: () {},
      ),
      _MenuItem(
        icon: Icons.payment,
        title: 'Payment History',
        onTap: () {},
      ),
      _MenuItem(
        icon: Icons.help_outline,
        title: 'Help & Support',
        onTap: () {},
      ),
      _MenuItem(
        icon: Icons.privacy_tip_outlined,
        title: 'Privacy Policy',
        onTap: () {},
      ),
    ];

    return Container(
      decoration: BoxDecoration(
        color: FitnessColors.blackCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: menuItems.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final isLast = index == menuItems.length - 1;

          return Column(
            children: [
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color:
                        (item.iconColor ?? FitnessColors.primaryColor1).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(item.icon,
                      color: item.iconColor ?? FitnessColors.primaryColor1, size: 20),
                ),
                title: Text(
                  item.title,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: FitnessColors.white,
                        fontWeight: FontWeight.w500,
                      ),
                ),
                subtitle: item.subtitle != null
                    ? Text(
                        item.subtitle!,
                        style: TextStyle(
                          color: FitnessColors.grayLight,
                          fontSize: 12,
                        ),
                      )
                    : null,
                trailing: Icon(Icons.chevron_right, color: FitnessColors.grayLight),
                onTap: item.onTap,
              ),
              if (!isLast)
                Divider(
                  height: 1,
                  indent: 56,
                  endIndent: 16,
                  color: FitnessColors.gray.withOpacity(0.3),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => _showLogoutDialog(context, ref),
        style: OutlinedButton.styleFrom(
          foregroundColor: FitnessColors.secondaryColor1,
          side: const BorderSide(color: FitnessColors.secondaryColor1),
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
        icon: const Icon(Icons.logout),
        label: const Text('Log Out'),
      ),
    );
  }

  void _showRenewalNotification(BuildContext context, ClientSubscriptionData data) {
    final amount = data.priceUsd != null && data.priceUsd! > 0
        ? '\$${data.priceUsd!.toStringAsFixed(0)}'
        : 'the standard rate';
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.notifications_active, color: FitnessColors.primaryColor1, size: 48),
        title: const Text('Subscription expiring soon'),
        content: Text(
          'Your ${data.planLabel} subscription ends in ${data.daysRemaining} day${data.daysRemaining == 1 ? '' : 's'}.\n\n'
          'Renewal amount: $amount/month\n\n'
          'Visit the gym desk to renew with cash, card, or other payment method.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            style: FilledButton.styleFrom(backgroundColor: FitnessColors.primaryColor1),
            child: const Text('I\'ll renew'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authNotifierProvider.notifier).signOut();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: FitnessColors.secondaryColor1,
            ),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Color? iconColor;
  final VoidCallback onTap;

  _MenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.iconColor,
    required this.onTap,
  });
}
