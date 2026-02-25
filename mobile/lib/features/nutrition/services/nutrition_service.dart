import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/nutrition_models.dart';

class NutritionService {
  final _supabase = Supabase.instance.client;

  // ===== DIET PLANS =====

  /// Get all diet plans for the current client
  Future<List<DietPlanModel>> getMyDietPlans() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final response = await _supabase
          .from('diet_plans')
          .select('''
            *,
            meals:diet_plan_meals(
              *,
              items:diet_plan_meal_items(
                *,
                food:food_id(id, name, name_ar)
              )
            )
          ''')
          .eq('client_id', user.id)
          .order('start_date', ascending: false);

      return (response as List)
          .map((json) => DietPlanModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch diet plans: $e');
    }
  }

  /// Get the currently active diet plan
  Future<DietPlanModel?> getActiveDietPlan() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final response = await _supabase
          .from('diet_plans')
          .select('''
            *,
            meals:diet_plan_meals(
              *,
              items:diet_plan_meal_items(
                *,
                food:food_id(id, name, name_ar)
              )
            )
          ''')
          .eq('client_id', user.id)
          .eq('status', 'active')
          .order('start_date', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response != null) {
        return DietPlanModel.fromJson(response);
      }
      return null;
    } catch (e) {
      throw Exception('Failed to fetch active diet plan: $e');
    }
  }

  /// Search foods in the database
  Future<List<FoodModel>> searchFoods(String query) async {
    try {
      final response = await _supabase
          .from('foods')
          .select()
          .or('name.ilike.%$query%,name_ar.ilike.%$query%')
          .limit(20);

      return (response as List)
          .map((json) => FoodModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to search foods: $e');
    }
  }

  // ===== MEAL LOGS =====

  /// Get meal logs for the current user
  Future<List<MealLogModel>> getMyMealLogs({DateTime? date}) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      var query = _supabase
          .from('meal_logs')
          .select('''
            *,
            items:meal_log_items(
              *,
              food:food_id(id, name, name_ar)
            )
          ''')
          .eq('client_id', user.id);

      if (date != null) {
        final dateStr = date.toIso8601String().split('T')[0];
        query = query.eq('meal_date', dateStr);
      }

      final response = await query.order('logged_at', ascending: false);

      return (response as List)
          .map((json) => MealLogModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch meal logs: $e');
    }
  }

  /// Log a meal for the current user
  Future<MealLogModel> logMeal({
    required String mealType,
    required List<Map<String, dynamic>> items,
    String? notes,
    DateTime? logDate,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      // Calculate totals from items
      int totalCalories = 0;
      double totalProtein = 0;
      double totalCarbs = 0;
      double totalFat = 0;

      for (final item in items) {
        totalCalories += (item['calories'] as int?) ?? 0;
        totalProtein += (item['protein_g'] as num?)?.toDouble() ?? 0;
        totalCarbs += (item['carbs_g'] as num?)?.toDouble() ?? 0;
        totalFat += (item['fat_g'] as num?)?.toDouble() ?? 0;
      }

      final mealDate = (logDate ?? DateTime.now()).toIso8601String().split('T')[0];

      // Insert the meal log
      final logResponse = await _supabase
          .from('meal_logs')
          .insert({
            'client_id': user.id,
            'meal_type': mealType,
            'meal_date': mealDate,
            'status': 'pending',
            'total_calories': totalCalories,
            'total_protein_g': totalProtein,
            'total_carbs_g': totalCarbs,
            'total_fat_g': totalFat,
            'notes': notes,
          })
          .select()
          .single();

      final logId = logResponse['id'];

      // Insert meal log items
      for (final item in items) {
        await _supabase.from('meal_log_items').insert({
          'log_id': logId,
          'food_id': item['food_id'],
          'custom_item_name': item['custom_item_name'],
          'quantity': item['quantity'] ?? 1,
          'unit': item['unit'] ?? 'serving',
          'calories': item['calories'],
          'protein_g': item['protein_g'],
          'carbs_g': item['carbs_g'],
          'fat_g': item['fat_g'],
        });
      }

      // Fetch the complete log with items
      final completeLog = await _supabase
          .from('meal_logs')
          .select('''
            *,
            items:meal_log_items(
              *,
              food:food_id(id, name, name_ar)
            )
          ''')
          .eq('id', logId)
          .single();

      return MealLogModel.fromJson(completeLog);
    } catch (e) {
      throw Exception('Failed to log meal: $e');
    }
  }

  /// Get compliance stats for a date range
  Future<Map<String, dynamic>> getComplianceStats({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final startStr = startDate.toIso8601String().split('T')[0];
      final endStr = endDate.toIso8601String().split('T')[0];

      final logs = await _supabase
          .from('meal_logs')
          .select()
          .eq('client_id', user.id)
          .gte('meal_date', startStr)
          .lte('meal_date', endStr);

      final logsList = logs as List;
      
      int totalMeals = logsList.length;
      int followedMeals = logsList.where((l) => l['status'] == 'followed').length;
      int modifiedMeals = logsList.where((l) => l['status'] == 'modified').length;
      int skippedMeals = logsList.where((l) => l['status'] == 'skipped').length;

      double complianceRate = totalMeals > 0 
          ? (followedMeals / totalMeals) * 100 
          : 0;

      return {
        'total_meals': totalMeals,
        'followed_meals': followedMeals,
        'modified_meals': modifiedMeals,
        'skipped_meals': skippedMeals,
        'compliance_rate': complianceRate,
      };
    } catch (e) {
      throw Exception('Failed to fetch compliance stats: $e');
    }
  }

  /// Delete a meal log
  Future<void> deleteMealLog(String logId) async {
    try {
      // Items will be deleted automatically via CASCADE
      await _supabase.from('meal_logs').delete().eq('id', logId);
    } catch (e) {
      throw Exception('Failed to delete meal log: $e');
    }
  }

  // ===== MEAL COMMITMENTS =====

  /// Get meal commitments for the current user and a specific plan
  Future<List<MealCommitmentModel>> getMealCommitments({
    required String planId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      var query = _supabase
          .from('meal_commitments')
          .select()
          .eq('client_id', user.id)
          .eq('plan_id', planId);

      if (startDate != null) {
        query = query.gte('commitment_date', startDate.toIso8601String().split('T')[0]);
      }
      if (endDate != null) {
        query = query.lte('commitment_date', endDate.toIso8601String().split('T')[0]);
      }

      final response = await query.order('commitment_date', ascending: true);

      return (response as List)
          .map((json) => MealCommitmentModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch meal commitments: $e');
    }
  }

  /// Toggle meal commitment (mark as completed or not)
  Future<MealCommitmentModel> toggleMealCommitment({
    required String planId,
    required String mealId,
    required DateTime commitmentDate,
    required bool isCommitted,
    String? notes,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final response = await _supabase
          .from('meal_commitments')
          .upsert({
            'client_id': user.id,
            'plan_id': planId,
            'meal_id': mealId,
            'commitment_date': commitmentDate.toIso8601String().split('T')[0],
            'is_committed': isCommitted,
            'committed_at': isCommitted ? DateTime.now().toIso8601String() : null,
            'notes': notes,
          })
          .select()
          .single();

      return MealCommitmentModel.fromJson(response);
    } catch (e) {
      throw Exception('Failed to toggle meal commitment: $e');
    }
  }

  /// Get daily tracking for the current user and a specific plan
  Future<List<DailyPlanTrackingModel>> getDailyTracking({
    required String planId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      var query = _supabase
          .from('daily_plan_tracking')
          .select()
          .eq('client_id', user.id)
          .eq('plan_id', planId);

      if (startDate != null) {
        query = query.gte('tracking_date', startDate.toIso8601String().split('T')[0]);
      }
      if (endDate != null) {
        query = query.lte('tracking_date', endDate.toIso8601String().split('T')[0]);
      }

      final response = await query.order('tracking_date', ascending: true);

      return (response as List)
          .map((json) => DailyPlanTrackingModel.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch daily tracking: $e');
    }
  }

  /// Calculate and update daily tracking for a specific date
  Future<void> updateDailyTracking({
    required String planId,
    required DateTime trackingDate,
    required int totalCaloriesConsumed,
    required double totalProteinG,
    required double totalCarbsG,
    required double totalFatG,
    required int mealsCompleted,
    required int totalMeals,
    bool? isCheatDay,
    String? notes,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final completionPercentage = totalMeals > 0 
          ? (mealsCompleted / totalMeals) * 100 
          : 0.0;

      await _supabase.from('daily_plan_tracking').upsert({
        'client_id': user.id,
        'plan_id': planId,
        'tracking_date': trackingDate.toIso8601String().split('T')[0],
        'total_calories_consumed': totalCaloriesConsumed,
        'total_protein_g': totalProteinG,
        'total_carbs_g': totalCarbsG,
        'total_fat_g': totalFatG,
        'meals_completed': mealsCompleted,
        'total_meals': totalMeals,
        'completion_percentage': completionPercentage,
        'is_cheat_day': isCheatDay ?? false,
        'notes': notes,
        'updated_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      throw Exception('Failed to update daily tracking: $e');
    }
  }
}
