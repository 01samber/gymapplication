import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/fitness_theme.dart';
import '../../../auth/providers/auth_provider.dart';

/// Trainer profile - fitness app style
class TrainerProfileScreen extends ConsumerWidget {
  const TrainerProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfile = ref.watch(currentUserProfileProvider);

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
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        child: Column(
          children: [
            // Profile header
            _buildProfileHeader(context),
            const SizedBox(height: 24),

            // Stats
            _buildStatsRow(context),
            const SizedBox(height: 24),

            // Menu items
            _buildMenuSection(context, ref),
            const SizedBox(height: 24),

            // Logout
            _buildLogoutButton(context, ref),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context) {
    return Column(
      children: [
        CircleAvatar(
          radius: 52,
          backgroundColor: FitnessColors.primaryColor1.withOpacity(0.2),
          child: Text(
            'AK',
            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: FitnessColors.primaryColor1,
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Coach Ahmad Khalil',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: FitnessColors.white,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'Strength & Conditioning Specialist',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: FitnessColors.gray,
              ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.star_rounded, color: FitnessColors.primaryColor1, size: 20),
            const SizedBox(width: 4),
            Text(
              '4.9',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: FitnessColors.white,
                  ),
            ),
            Text(
              ' (127 reviews)',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: FitnessColors.gray,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.edit, size: 18),
          label: const Text('Edit Profile'),
        ),
      ],
    );
  }

  Widget _buildStatsRow(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _statCard(context, Icons.people, '12', 'Active Clients')),
        const SizedBox(width: 12),
        Expanded(child: _statCard(context, Icons.event_available, '324', 'Total Sessions')),
        const SizedBox(width: 12),
        Expanded(child: _statCard(context, Icons.work_history, '5', 'Years Exp.')),
      ],
    );
  }

  Widget _statCard(BuildContext context, IconData icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: FitnessColors.blackCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FitnessColors.green.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: FitnessColors.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: FitnessColors.white, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: FitnessColors.white,
                ),
          ),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: FitnessColors.gray,
                  fontSize: 11,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSection(BuildContext context, WidgetRef ref) {
    final menuItems = [
      {'icon': Icons.person_outline, 'title': 'Personal Information'},
      {'icon': Icons.school_outlined, 'title': 'Certifications'},
      {'icon': Icons.schedule, 'title': 'Availability Settings'},
      {'icon': Icons.attach_money, 'title': 'Earnings'},
      {'icon': Icons.notifications_outlined, 'title': 'Notifications'},
      {'icon': Icons.help_outline, 'title': 'Help & Support'},
    ];

    return Container(
      decoration: BoxDecoration(
        color: FitnessColors.blackCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FitnessColors.green.withOpacity(0.3)),
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
                    color: FitnessColors.primaryColor1.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    item['icon'] as IconData,
                    color: FitnessColors.primaryColor1,
                    size: 20,
                  ),
                ),
                title: Text(
                  item['title'] as String,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: FitnessColors.white,
                        fontWeight: FontWeight.w500,
                      ),
                ),
                trailing: Icon(Icons.chevron_right, color: FitnessColors.grayLight),
                onTap: () {},
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
        onPressed: () {
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
        },
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
}
