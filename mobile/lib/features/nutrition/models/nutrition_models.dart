// Food model
class FoodModel {
  final String id;
  final String name;
  final String? brand;
  final String category;
  final double servingSize;
  final String servingUnit;
  final double caloriesPerServing;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double? fiberG;
  final double? sugarG;
  final double? sodiumMg;
  final bool isVerified;
  final DateTime createdAt;

  FoodModel({
    required this.id,
    required this.name,
    this.brand,
    required this.category,
    required this.servingSize,
    required this.servingUnit,
    required this.caloriesPerServing,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.fiberG,
    this.sugarG,
    this.sodiumMg,
    required this.isVerified,
    required this.createdAt,
  });

  factory FoodModel.fromJson(Map<String, dynamic> json) {
    return FoodModel(
      id: json['id'],
      name: json['name'],
      brand: json['brand'],
      category: json['category'],
      servingSize: json['serving_size']?.toDouble() ?? 100,
      servingUnit: json['serving_unit'] ?? 'g',
      caloriesPerServing: json['calories_per_serving']?.toDouble() ?? 0,
      proteinG: json['protein_g']?.toDouble() ?? 0,
      carbsG: json['carbs_g']?.toDouble() ?? 0,
      fatG: json['fat_g']?.toDouble() ?? 0,
      fiberG: json['fiber_g']?.toDouble(),
      sugarG: json['sugar_g']?.toDouble(),
      sodiumMg: json['sodium_mg']?.toDouble(),
      isVerified: json['is_verified'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'brand': brand,
      'category': category,
      'serving_size': servingSize,
      'serving_unit': servingUnit,
      'calories_per_serving': caloriesPerServing,
      'protein_g': proteinG,
      'carbs_g': carbsG,
      'fat_g': fatG,
      'fiber_g': fiberG,
      'sugar_g': sugarG,
      'sodium_mg': sodiumMg,
      'is_verified': isVerified,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

// Diet Plan model
class DietPlanModel {
  final String id;
  final String clientId;
  final String? dietitianId;
  final String name;
  final String? description;
  final String planType; // 'weekly' or 'monthly'
  final int targetCalories;
  final int targetProteinG;
  final int targetCarbsG;
  final int targetFatG;
  final DateTime startDate;
  final DateTime? endDate;
  final String status;
  final String? notes;
  final List<String> cheatDays; // Array of date strings (YYYY-MM-DD) for cheat days
  final List<DietPlanMealModel> meals;
  final DateTime createdAt;

  DietPlanModel({
    required this.id,
    required this.clientId,
    this.dietitianId,
    required this.name,
    this.description,
    required this.planType,
    required this.targetCalories,
    required this.targetProteinG,
    required this.targetCarbsG,
    required this.targetFatG,
    required this.startDate,
    this.endDate,
    required this.status,
    this.notes,
    required this.cheatDays,
    required this.meals,
    required this.createdAt,
  });

  factory DietPlanModel.fromJson(Map<String, dynamic> json) {
    final mealsJson = json['meals'] as List<dynamic>? ?? [];
    final cheatDaysJson = json['cheat_days'] as List<dynamic>? ?? [];
    return DietPlanModel(
      id: json['id'],
      clientId: json['client_id'],
      dietitianId: json['dietitian_id'],
      name: json['name'],
      description: json['description'],
      planType: json['plan_type'] ?? 'weekly',
      targetCalories: json['target_calories'] ?? 2000,
      targetProteinG: json['target_protein_g'] ?? 150,
      targetCarbsG: json['target_carbs_g'] ?? 200,
      targetFatG: json['target_fat_g'] ?? 65,
      startDate: DateTime.parse(json['start_date']),
      endDate:
          json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
      status: json['status'] ?? 'active',
      notes: json['notes'],
      cheatDays: cheatDaysJson.map((d) => d.toString()).toList(),
      meals: mealsJson.map((m) => DietPlanMealModel.fromJson(m)).toList(),
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  bool get isActive => status == 'active';
  bool get isWeekly => planType == 'weekly';
  bool get isMonthly => planType == 'monthly';
  
  // Backwards compatibility aliases
  int get dailyCaloriesTarget => targetCalories;
  int get dailyProteinG => targetProteinG;
  int get dailyCarbsG => targetCarbsG;
  int get dailyFatG => targetFatG;
  String? get specialNotes => notes;
  
  /// Get the number of days in this plan
  int get daysCount {
    if (endDate == null) return 7;
    return endDate!.difference(startDate).inDays + 1;
  }
  
  /// Check if a given date is a cheat day
  bool isCheatDay(DateTime date) {
    final dateStr = date.toIso8601String().split('T')[0];
    return cheatDays.contains(dateStr);
  }
  
  /// Get meals for a specific day number (1-based)
  List<DietPlanMealModel> getMealsForDay(int dayNumber) {
    return meals.where((m) => m.dayNumber == dayNumber).toList();
  }
  
  /// Calculate total nutrition for a specific day
  Map<String, double> getDayTotals(int dayNumber) {
    final dayMeals = getMealsForDay(dayNumber);
    double calories = 0, protein = 0, carbs = 0, fat = 0;
    for (final meal in dayMeals) {
      calories += meal.totalCalories;
      protein += meal.totalProteinG;
      carbs += meal.totalCarbsG;
      fat += meal.totalFatG;
    }
    return {
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
    };
  }
}

// Diet Plan Meal model
class DietPlanMealModel {
  final String id;
  final String dietPlanId;
  final String mealType;
  final String name;
  final String? notes;
  final String? scheduledTime;
  final int dayNumber; // Day 1, 2, 3... for the plan
  final String? specificDate;
  final int totalCalories;
  final double totalProteinG;
  final double totalCarbsG;
  final double totalFatG;
  final List<DietPlanMealItemModel> items;

  DietPlanMealModel({
    required this.id,
    required this.dietPlanId,
    required this.mealType,
    required this.name,
    this.notes,
    this.scheduledTime,
    required this.dayNumber,
    this.specificDate,
    required this.totalCalories,
    required this.totalProteinG,
    required this.totalCarbsG,
    required this.totalFatG,
    required this.items,
  });

  factory DietPlanMealModel.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    
    // Calculate totals from items if not provided
    int calcCalories = json['total_calories'] ?? 0;
    double calcProtein = json['total_protein_g']?.toDouble() ?? 0;
    double calcCarbs = json['total_carbs_g']?.toDouble() ?? 0;
    double calcFat = json['total_fat_g']?.toDouble() ?? 0;
    
    if (itemsJson.isNotEmpty && calcCalories == 0) {
      for (final item in itemsJson) {
        calcCalories += (item['calories'] as int?) ?? 0;
        calcProtein += (item['protein_g'] as num?)?.toDouble() ?? 0;
        calcCarbs += (item['carbs_g'] as num?)?.toDouble() ?? 0;
        calcFat += (item['fat_g'] as num?)?.toDouble() ?? 0;
      }
    }
    
    return DietPlanMealModel(
      id: json['id'],
      dietPlanId: json['plan_id'] ?? json['diet_plan_id'] ?? '',
      mealType: json['meal_type'] ?? 'breakfast',
      name: json['name'] ?? '',
      notes: json['notes'],
      scheduledTime: json['scheduled_time'],
      dayNumber: json['day_number'] ?? 1,
      specificDate: json['specific_date'],
      totalCalories: calcCalories,
      totalProteinG: calcProtein,
      totalCarbsG: calcCarbs,
      totalFatG: calcFat,
      items: itemsJson.map((i) => DietPlanMealItemModel.fromJson(i)).toList(),
    );
  }

  String get mealTypeDisplay {
    switch (mealType) {
      case 'breakfast':
        return 'Breakfast';
      case 'morning_snack':
        return 'Morning Snack';
      case 'lunch':
        return 'Lunch';
      case 'afternoon_snack':
        return 'Afternoon Snack';
      case 'dinner':
        return 'Dinner';
      case 'evening_snack':
        return 'Evening Snack';
      default:
        return mealType;
    }
  }
}

// Diet Plan Meal Item model
class DietPlanMealItemModel {
  final String id;
  final String mealId;
  final String? foodId;
  final FoodModel? food;
  final String? customItemName; // For custom food items not in database
  final double quantity;
  final String unit;
  final String? notes;
  final int calories;
  final double proteinG;
  final double carbsG;
  final double fatG;

  DietPlanMealItemModel({
    required this.id,
    required this.mealId,
    this.foodId,
    this.food,
    this.customItemName,
    required this.quantity,
    required this.unit,
    this.notes,
    required this.calories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  factory DietPlanMealItemModel.fromJson(Map<String, dynamic> json) {
    return DietPlanMealItemModel(
      id: json['id'],
      mealId: json['meal_id'],
      foodId: json['food_id'],
      food: json['food'] != null ? FoodModel.fromJson(json['food']) : null,
      customItemName: json['custom_item_name'],
      quantity: json['quantity']?.toDouble() ?? 1,
      unit: json['unit'] ?? 'serving',
      notes: json['notes'],
      calories: json['calories'] ?? 0,
      proteinG: json['protein_g']?.toDouble() ?? 0,
      carbsG: json['carbs_g']?.toDouble() ?? 0,
      fatG: json['fat_g']?.toDouble() ?? 0,
    );
  }

  /// Get the display name for this item
  String get displayName => food?.name ?? customItemName ?? 'Unknown food';
}

// Meal Log model
class MealLogModel {
  final String id;
  final String clientId;
  final DateTime logDate;
  final String mealType;
  final String status;
  final String? notes;
  final int totalCalories;
  final double totalProteinG;
  final double totalCarbsG;
  final double totalFatG;
  final List<MealLogItemModel> items;
  final DateTime createdAt;

  MealLogModel({
    required this.id,
    required this.clientId,
    required this.logDate,
    required this.mealType,
    required this.status,
    this.notes,
    required this.totalCalories,
    required this.totalProteinG,
    required this.totalCarbsG,
    required this.totalFatG,
    required this.items,
    required this.createdAt,
  });

  factory MealLogModel.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    return MealLogModel(
      id: json['id'],
      clientId: json['client_id'],
      logDate: DateTime.parse(json['log_date']),
      mealType: json['meal_type'],
      status: json['status'] ?? 'logged',
      notes: json['notes'],
      totalCalories: json['total_calories'] ?? 0,
      totalProteinG: json['total_protein_g']?.toDouble() ?? 0,
      totalCarbsG: json['total_carbs_g']?.toDouble() ?? 0,
      totalFatG: json['total_fat_g']?.toDouble() ?? 0,
      items: itemsJson.map((i) => MealLogItemModel.fromJson(i)).toList(),
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  String get mealTypeDisplay {
    switch (mealType) {
      case 'breakfast':
        return 'Breakfast';
      case 'morning_snack':
        return 'Morning Snack';
      case 'lunch':
        return 'Lunch';
      case 'afternoon_snack':
        return 'Afternoon Snack';
      case 'dinner':
        return 'Dinner';
      case 'evening_snack':
        return 'Evening Snack';
      default:
        return mealType;
    }
  }
}

// Meal Log Item model
class MealLogItemModel {
  final String id;
  final String mealLogId;
  final String? foodId;
  final FoodModel? food;
  final String? customFoodName;
  final double quantity;
  final String unit;
  final int calories;
  final double proteinG;
  final double carbsG;
  final double fatG;

  MealLogItemModel({
    required this.id,
    required this.mealLogId,
    this.foodId,
    this.food,
    this.customFoodName,
    required this.quantity,
    required this.unit,
    required this.calories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  factory MealLogItemModel.fromJson(Map<String, dynamic> json) {
    return MealLogItemModel(
      id: json['id'],
      mealLogId: json['meal_log_id'],
      foodId: json['food_id'],
      food: json['food'] != null ? FoodModel.fromJson(json['food']) : null,
      customFoodName: json['custom_food_name'],
      quantity: json['quantity']?.toDouble() ?? 1,
      unit: json['unit'] ?? 'serving',
      calories: json['calories'] ?? 0,
      proteinG: json['protein_g']?.toDouble() ?? 0,
      carbsG: json['carbs_g']?.toDouble() ?? 0,
      fatG: json['fat_g']?.toDouble() ?? 0,
    );
  }

  String get displayName => food?.name ?? customFoodName ?? 'Unknown food';
}

// Meal Commitment model (for tracking client meal completion)
class MealCommitmentModel {
  final String id;
  final String clientId;
  final String planId;
  final String mealId;
  final DateTime commitmentDate;
  final bool isCommitted;
  final DateTime? committedAt;
  final String? notes;

  MealCommitmentModel({
    required this.id,
    required this.clientId,
    required this.planId,
    required this.mealId,
    required this.commitmentDate,
    required this.isCommitted,
    this.committedAt,
    this.notes,
  });

  factory MealCommitmentModel.fromJson(Map<String, dynamic> json) {
    return MealCommitmentModel(
      id: json['id'],
      clientId: json['client_id'],
      planId: json['plan_id'],
      mealId: json['meal_id'],
      commitmentDate: DateTime.parse(json['commitment_date']),
      isCommitted: json['is_committed'] ?? false,
      committedAt: json['committed_at'] != null 
          ? DateTime.parse(json['committed_at']) 
          : null,
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client_id': clientId,
      'plan_id': planId,
      'meal_id': mealId,
      'commitment_date': commitmentDate.toIso8601String().split('T')[0],
      'is_committed': isCommitted,
      'committed_at': committedAt?.toIso8601String(),
      'notes': notes,
    };
  }
}

// Daily Plan Tracking model
class DailyPlanTrackingModel {
  final String id;
  final String clientId;
  final String planId;
  final DateTime trackingDate;
  final int totalCaloriesConsumed;
  final double totalProteinG;
  final double totalCarbsG;
  final double totalFatG;
  final int mealsCompleted;
  final int totalMeals;
  final double completionPercentage;
  final bool isCheatDay;
  final String? notes;

  DailyPlanTrackingModel({
    required this.id,
    required this.clientId,
    required this.planId,
    required this.trackingDate,
    required this.totalCaloriesConsumed,
    required this.totalProteinG,
    required this.totalCarbsG,
    required this.totalFatG,
    required this.mealsCompleted,
    required this.totalMeals,
    required this.completionPercentage,
    required this.isCheatDay,
    this.notes,
  });

  factory DailyPlanTrackingModel.fromJson(Map<String, dynamic> json) {
    return DailyPlanTrackingModel(
      id: json['id'],
      clientId: json['client_id'],
      planId: json['plan_id'],
      trackingDate: DateTime.parse(json['tracking_date']),
      totalCaloriesConsumed: json['total_calories_consumed'] ?? 0,
      totalProteinG: json['total_protein_g']?.toDouble() ?? 0,
      totalCarbsG: json['total_carbs_g']?.toDouble() ?? 0,
      totalFatG: json['total_fat_g']?.toDouble() ?? 0,
      mealsCompleted: json['meals_completed'] ?? 0,
      totalMeals: json['total_meals'] ?? 0,
      completionPercentage: json['completion_percentage']?.toDouble() ?? 0,
      isCheatDay: json['is_cheat_day'] ?? false,
      notes: json['notes'],
    );
  }
}
