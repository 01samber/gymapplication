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

/// Current user's subscription (for clients only). Used to control PT/Sessions visibility.
/// - Nutrition Plan (with_dietitian): No PT - hide Sessions tab
/// - Premium: All platforms - show Sessions
final clientSubscriptionProvider = FutureProvider<SubscriptionPlan>((ref) async {
  final user = ref.watch(authStateProvider).valueOrNull;
  if (user == null) return SubscriptionPlan.unknown;

  try {
    final row = await Supabase.instance.client
        .from('subscriptions')
        .select('subscription_type')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
    return _parsePlan(row?['subscription_type'] as String?);
  } catch (_) {
    return SubscriptionPlan.unknown;
  }
});

/// True if client has PT access (Sessions tab visible): with_pt or premium
final clientHasPtAccessProvider = Provider<bool>((ref) {
  final plan = ref.watch(clientSubscriptionProvider).valueOrNull;
  return plan == SubscriptionPlan.withPt || plan == SubscriptionPlan.premium;
});
