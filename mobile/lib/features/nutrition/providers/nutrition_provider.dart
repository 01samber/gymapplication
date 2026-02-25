import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/nutrition_models.dart';
import '../services/nutrition_service.dart';

final nutritionServiceProvider = Provider((ref) => NutritionService());

// Diet Plans providers
final dietPlansProvider = FutureProvider<List<DietPlanModel>>((ref) async {
  final service = ref.watch(nutritionServiceProvider);
  return service.getMyDietPlans();
});

final activeDietPlanProvider = FutureProvider<DietPlanModel?>((ref) async {
  final service = ref.watch(nutritionServiceProvider);
  return service.getActiveDietPlan();
});

// Meal logs provider with date filter
final mealLogsDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

final mealLogsProvider = FutureProvider<List<MealLogModel>>((ref) async {
  final service = ref.watch(nutritionServiceProvider);
  final date = ref.watch(mealLogsDateProvider);
  return service.getMyMealLogs(date: date);
});

// Food search provider
final foodSearchQueryProvider = StateProvider<String>((ref) => '');

final foodSearchResultsProvider = FutureProvider<List<FoodModel>>((ref) async {
  final service = ref.watch(nutritionServiceProvider);
  final query = ref.watch(foodSearchQueryProvider);
  if (query.length < 2) return [];
  return service.searchFoods(query);
});

// Diet Plans Notifier
class DietPlansNotifier extends StateNotifier<AsyncValue<List<DietPlanModel>>> {
  final NutritionService _service;

  DietPlansNotifier(this._service) : super(const AsyncValue.loading()) {
    loadPlans();
  }

  Future<void> loadPlans() async {
    state = const AsyncValue.loading();
    try {
      final plans = await _service.getMyDietPlans();
      state = AsyncValue.data(plans);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() async {
    await loadPlans();
  }
}

final dietPlansNotifierProvider =
    StateNotifierProvider<DietPlansNotifier, AsyncValue<List<DietPlanModel>>>(
        (ref) {
  final service = ref.watch(nutritionServiceProvider);
  return DietPlansNotifier(service);
});

// Meal Logs Notifier
class MealLogsNotifier extends StateNotifier<AsyncValue<List<MealLogModel>>> {
  final NutritionService _service;
  DateTime _selectedDate;

  MealLogsNotifier(this._service)
      : _selectedDate = DateTime.now(),
        super(const AsyncValue.loading()) {
    loadLogs();
  }

  DateTime get selectedDate => _selectedDate;

  Future<void> loadLogs() async {
    state = const AsyncValue.loading();
    try {
      final logs = await _service.getMyMealLogs(date: _selectedDate);
      state = AsyncValue.data(logs);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> setDate(DateTime date) async {
    _selectedDate = date;
    await loadLogs();
  }

  Future<void> logMeal({
    required String mealType,
    required List<Map<String, dynamic>> items,
    String? notes,
  }) async {
    try {
      await _service.logMeal(
        mealType: mealType,
        items: items,
        notes: notes,
        logDate: _selectedDate,
      );
      await loadLogs();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteMealLog(String logId) async {
    try {
      await _service.deleteMealLog(logId);
      await loadLogs();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> refresh() async {
    await loadLogs();
  }
}

final mealLogsNotifierProvider =
    StateNotifierProvider<MealLogsNotifier, AsyncValue<List<MealLogModel>>>(
        (ref) {
  final service = ref.watch(nutritionServiceProvider);
  return MealLogsNotifier(service);
});

// Daily totals from meal logs
final dailyTotalsProvider = Provider<Map<String, num>>((ref) {
  final logsAsync = ref.watch(mealLogsNotifierProvider);

  return logsAsync.maybeWhen(
    data: (logs) {
      int totalCalories = 0;
      double totalProtein = 0;
      double totalCarbs = 0;
      double totalFat = 0;

      for (final log in logs) {
        totalCalories += log.totalCalories;
        totalProtein += log.totalProteinG;
        totalCarbs += log.totalCarbsG;
        totalFat += log.totalFatG;
      }

      return {
        'calories': totalCalories,
        'protein': totalProtein,
        'carbs': totalCarbs,
        'fat': totalFat,
      };
    },
    orElse: () => {
      'calories': 0,
      'protein': 0.0,
      'carbs': 0.0,
      'fat': 0.0,
    },
  );
});
