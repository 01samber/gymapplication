import 'package:equatable/equatable.dart';

/// Body measurements and composition tracking
class BodyMetrics extends Equatable {
  final String id;
  final String clientId;
  final String? recordedBy;
  final DateTime measurementDate;

  // Basic metrics
  final double? weightKg;
  final double? heightCm;
  final double? bmi;

  // Body composition
  final double? bodyFatPercentage;
  final double? muscleMassKg;
  final double? waterPercentage;
  final double? boneMassKg;

  // Metabolism
  final int? bmrCalories;
  final int? visceralFatLevel;
  final int? metabolicAge;

  // Circumference measurements
  final double? chestCm;
  final double? waistCm;
  final double? hipsCm;
  final double? leftArmCm;
  final double? rightArmCm;
  final double? leftThighCm;
  final double? rightThighCm;

  final String? notes;
  final DateTime createdAt;

  const BodyMetrics({
    required this.id,
    required this.clientId,
    this.recordedBy,
    required this.measurementDate,
    this.weightKg,
    this.heightCm,
    this.bmi,
    this.bodyFatPercentage,
    this.muscleMassKg,
    this.waterPercentage,
    this.boneMassKg,
    this.bmrCalories,
    this.visceralFatLevel,
    this.metabolicAge,
    this.chestCm,
    this.waistCm,
    this.hipsCm,
    this.leftArmCm,
    this.rightArmCm,
    this.leftThighCm,
    this.rightThighCm,
    this.notes,
    required this.createdAt,
  });

  factory BodyMetrics.fromJson(Map<String, dynamic> json) {
    return BodyMetrics(
      id: json['id'] as String,
      clientId: json['client_id'] as String,
      recordedBy: json['recorded_by'] as String?,
      measurementDate: DateTime.parse(json['measurement_date'] as String),
      weightKg: (json['weight_kg'] as num?)?.toDouble(),
      heightCm: (json['height_cm'] as num?)?.toDouble(),
      bmi: (json['bmi'] as num?)?.toDouble(),
      bodyFatPercentage: (json['body_fat_percentage'] as num?)?.toDouble(),
      muscleMassKg: (json['muscle_mass_kg'] as num?)?.toDouble(),
      waterPercentage: (json['water_percentage'] as num?)?.toDouble(),
      boneMassKg: (json['bone_mass_kg'] as num?)?.toDouble(),
      bmrCalories: json['bmr_calories'] as int?,
      visceralFatLevel: json['visceral_fat_level'] as int?,
      metabolicAge: json['metabolic_age'] as int?,
      chestCm: (json['chest_cm'] as num?)?.toDouble(),
      waistCm: (json['waist_cm'] as num?)?.toDouble(),
      hipsCm: (json['hips_cm'] as num?)?.toDouble(),
      leftArmCm: (json['left_arm_cm'] as num?)?.toDouble(),
      rightArmCm: (json['right_arm_cm'] as num?)?.toDouble(),
      leftThighCm: (json['left_thigh_cm'] as num?)?.toDouble(),
      rightThighCm: (json['right_thigh_cm'] as num?)?.toDouble(),
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'client_id': clientId,
      'recorded_by': recordedBy,
      'measurement_date': measurementDate.toIso8601String().split('T').first,
      'weight_kg': weightKg,
      'height_cm': heightCm,
      'body_fat_percentage': bodyFatPercentage,
      'muscle_mass_kg': muscleMassKg,
      'water_percentage': waterPercentage,
      'bone_mass_kg': boneMassKg,
      'bmr_calories': bmrCalories,
      'visceral_fat_level': visceralFatLevel,
      'metabolic_age': metabolicAge,
      'chest_cm': chestCm,
      'waist_cm': waistCm,
      'hips_cm': hipsCm,
      'left_arm_cm': leftArmCm,
      'right_arm_cm': rightArmCm,
      'left_thigh_cm': leftThighCm,
      'right_thigh_cm': rightThighCm,
      'notes': notes,
    };
  }

  BodyMetrics copyWith({
    String? id,
    String? clientId,
    String? recordedBy,
    DateTime? measurementDate,
    double? weightKg,
    double? heightCm,
    double? bmi,
    double? bodyFatPercentage,
    double? muscleMassKg,
    double? waterPercentage,
    double? boneMassKg,
    int? bmrCalories,
    int? visceralFatLevel,
    int? metabolicAge,
    double? chestCm,
    double? waistCm,
    double? hipsCm,
    double? leftArmCm,
    double? rightArmCm,
    double? leftThighCm,
    double? rightThighCm,
    String? notes,
    DateTime? createdAt,
  }) {
    return BodyMetrics(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      recordedBy: recordedBy ?? this.recordedBy,
      measurementDate: measurementDate ?? this.measurementDate,
      weightKg: weightKg ?? this.weightKg,
      heightCm: heightCm ?? this.heightCm,
      bmi: bmi ?? this.bmi,
      bodyFatPercentage: bodyFatPercentage ?? this.bodyFatPercentage,
      muscleMassKg: muscleMassKg ?? this.muscleMassKg,
      waterPercentage: waterPercentage ?? this.waterPercentage,
      boneMassKg: boneMassKg ?? this.boneMassKg,
      bmrCalories: bmrCalories ?? this.bmrCalories,
      visceralFatLevel: visceralFatLevel ?? this.visceralFatLevel,
      metabolicAge: metabolicAge ?? this.metabolicAge,
      chestCm: chestCm ?? this.chestCm,
      waistCm: waistCm ?? this.waistCm,
      hipsCm: hipsCm ?? this.hipsCm,
      leftArmCm: leftArmCm ?? this.leftArmCm,
      rightArmCm: rightArmCm ?? this.rightArmCm,
      leftThighCm: leftThighCm ?? this.leftThighCm,
      rightThighCm: rightThighCm ?? this.rightThighCm,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// BMI category based on WHO classification
  String get bmiCategory {
    if (bmi == null) return 'Unknown';
    if (bmi! < 18.5) return 'Underweight';
    if (bmi! < 25) return 'Normal';
    if (bmi! < 30) return 'Overweight';
    return 'Obese';
  }

  /// Body fat category (varies by gender, this is a simplified version)
  String bodyFatCategory({required bool isMale}) {
    if (bodyFatPercentage == null) return 'Unknown';

    if (isMale) {
      if (bodyFatPercentage! < 6) return 'Essential';
      if (bodyFatPercentage! < 14) return 'Athletic';
      if (bodyFatPercentage! < 18) return 'Fitness';
      if (bodyFatPercentage! < 25) return 'Average';
      return 'Above Average';
    } else {
      if (bodyFatPercentage! < 14) return 'Essential';
      if (bodyFatPercentage! < 21) return 'Athletic';
      if (bodyFatPercentage! < 25) return 'Fitness';
      if (bodyFatPercentage! < 32) return 'Average';
      return 'Above Average';
    }
  }

  /// Waist-to-hip ratio (health indicator)
  double? get waistToHipRatio {
    if (waistCm == null || hipsCm == null || hipsCm == 0) return null;
    return waistCm! / hipsCm!;
  }

  @override
  List<Object?> get props => [
        id,
        clientId,
        recordedBy,
        measurementDate,
        weightKg,
        heightCm,
        bmi,
        bodyFatPercentage,
        muscleMassKg,
        waterPercentage,
        boneMassKg,
        bmrCalories,
        visceralFatLevel,
        metabolicAge,
        chestCm,
        waistCm,
        hipsCm,
        leftArmCm,
        rightArmCm,
        leftThighCm,
        rightThighCm,
        notes,
        createdAt,
      ];
}
