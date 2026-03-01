import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../providers/auth_provider.dart';

/// Subscription plan type from DB
enum SubscriptionPlan {
  normalGym,
  withPt,
  withDietitian,
  premium,
  openGym,
  unknown,
}

SubscriptionPlan _parsePlan(String? v) {
  if (v == null) return SubscriptionPlan.unknown;
  switch (v.toLowerCase()) {
    case 'with_pt':
      return SubscriptionPlan.withPt;
    case 'with_dietitian':
      return SubscriptionPlan.withDietitian;
    case 'premium':
      return SubscriptionPlan.premium;
    case 'normal_gym':
      return SubscriptionPlan.normalGym;
    case 'open_gym':
      return SubscriptionPlan.openGym;
    default:
      return SubscriptionPlan.unknown;
  }
}

String _planLabel(SubscriptionPlan plan) {
  switch (plan) {
    case SubscriptionPlan.openGym:
      return 'Open Gym';
    case SubscriptionPlan.normalGym:
      return 'Normal Gym';
    case SubscriptionPlan.withPt:
      return 'PT Package';
    case SubscriptionPlan.withDietitian:
      return 'Nutrition Plan';
    case SubscriptionPlan.premium:
      return 'Premium';
    default:
      return 'Unknown';
  }
}

/// Full subscription data for client profile (days left, end date, price, etc.)
class ClientSubscriptionData {
  final SubscriptionPlan plan;
  final String? startDate;
  final String? endDate;
  final String status;
  final int daysRemaining;
  final double? priceUsd;

  ClientSubscriptionData({
    required this.plan,
    this.startDate,
    this.endDate,
    required this.status,
    required this.daysRemaining,
    this.priceUsd,
  });

  String get planLabel => _planLabel(plan);
  bool get isActive => status == 'active';
  bool get isExpiringSoon => isActive && daysRemaining <= 5 && daysRemaining >= 0;
}

/// Current user's full subscription (for client profile display)
final clientSubscriptionDataProvider =
    FutureProvider<ClientSubscriptionData?>((ref) async {
  final user = ref.watch(authStateProvider).valueOrNull;
  if (user == null) return null;

  try {
    final row = await Supabase.instance.client
        .from('subscriptions')
        .select('subscription_type, start_date, end_date, status, price_usd')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
    if (row == null) return null;
    final endDate = row['end_date'] as String?;
    int daysRemaining = 0;
    if (endDate != null) {
      final end = DateTime.parse(endDate);
      final now = DateTime.now();
      now.copyWith(hour: 0, minute: 0, second: 0, millisecond: 0);
      daysRemaining =
          end.difference(DateTime(now.year, now.month, now.day)).inDays;
      if (daysRemaining < 0) daysRemaining = 0;
    }
    final priceUsd = row['price_usd'];
    return ClientSubscriptionData(
      plan: _parsePlan(row['subscription_type'] as String?),
      startDate: row['start_date'] as String?,
      endDate: endDate,
      status: (row['status'] as String?) ?? 'active',
      daysRemaining: daysRemaining,
      priceUsd: priceUsd != null ? (priceUsd as num).toDouble() : null,
    );
  } catch (_) {
    return null;
  }
});

/// Current user's subscription (for clients only). Used to control PT/Sessions visibility.
final clientSubscriptionProvider = FutureProvider<SubscriptionPlan>((ref) async {
  final data = await ref.watch(clientSubscriptionDataProvider.future);
  return data?.plan ?? SubscriptionPlan.unknown;
});

/// True if client has PT access (Sessions tab visible): with_pt or premium
final clientHasPtAccessProvider = Provider<bool>((ref) {
  final plan = ref.watch(clientSubscriptionProvider).valueOrNull;
  return plan == SubscriptionPlan.withPt || plan == SubscriptionPlan.premium;
});
