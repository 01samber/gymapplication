import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/trainer_service.dart';

final trainerServiceProvider = Provider<TrainerService>((ref) {
  return TrainerService();
});

final trainerClientsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.watch(trainerServiceProvider);
  return service.getMyClients();
});

final trainerSessionCountsProvider = FutureProvider<Map<String, int>>((ref) async {
  final service = ref.watch(trainerServiceProvider);
  return service.getSessionCountsByClient();
});

final trainerTodayScheduleProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.watch(trainerServiceProvider);
  return service.getTodaySchedule();
});

final trainerRevenueProvider = FutureProvider<double>((ref) async {
  final service = ref.watch(trainerServiceProvider);
  return service.getRevenue();
});

final trainerTimeSpentProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(trainerServiceProvider);
  return service.getTimeSpentMinutes();
});

final trainerOfferingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.watch(trainerServiceProvider);
  return service.getMyOfferings();
});
