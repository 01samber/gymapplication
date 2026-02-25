class BodyCompositionModel {
  final String id;
  final String clientId;
  final String? recordedById;
  final DateTime measurementDate;

  // Basic measurements
  final double? heightCm;
  final double? weightKg;
  final int? age;
  final String? gender;

  // Body composition analysis
  final double? totalBodyWaterL;
  final double? proteinKg;
  final double? mineralsKg;
  final double? bodyFatMassKg;

  // Muscle-fat analysis
  final double? skeletalMuscleMassKg;

  // Obesity analysis
  final double? bmi;
  final double? percentBodyFat;

  // Segmental lean analysis
  final double? leftArmLeanKg;
  final double? leftArmLeanPercent;
  final double? rightArmLeanKg;
  final double? rightArmLeanPercent;
  final double? trunkLeanKg;
  final double? trunkLeanPercent;
  final double? leftLegLeanKg;
  final double? leftLegLeanPercent;
  final double? rightLegLeanKg;
  final double? rightLegLeanPercent;

  // Segmental fat analysis
  final double? leftArmFatKg;
  final double? leftArmFatPercent;
  final double? rightArmFatKg;
  final double? rightArmFatPercent;
  final double? trunkFatKg;
  final double? trunkFatPercent;
  final double? leftLegFatKg;
  final double? leftLegFatPercent;
  final double? rightLegFatKg;
  final double? rightLegFatPercent;

  // Research parameters
  final double? fatFreeMassKg;
  final int? basalMetabolicRate;
  final double? waistHipRatio;
  final int? visceralFatLevel;
  final int? metabolicAge;

  // Weight control
  final double? targetWeightKg;
  final double? weightControlKg;
  final double? fatControlKg;
  final double? muscleControlKg;

  final String? notes;
  final DateTime createdAt;

  BodyCompositionModel({
    required this.id,
    required this.clientId,
    this.recordedById,
    required this.measurementDate,
    this.heightCm,
    this.weightKg,
    this.age,
    this.gender,
    this.totalBodyWaterL,
    this.proteinKg,
    this.mineralsKg,
    this.bodyFatMassKg,
    this.skeletalMuscleMassKg,
    this.bmi,
    this.percentBodyFat,
    this.leftArmLeanKg,
    this.leftArmLeanPercent,
    this.rightArmLeanKg,
    this.rightArmLeanPercent,
    this.trunkLeanKg,
    this.trunkLeanPercent,
    this.leftLegLeanKg,
    this.leftLegLeanPercent,
    this.rightLegLeanKg,
    this.rightLegLeanPercent,
    this.leftArmFatKg,
    this.leftArmFatPercent,
    this.rightArmFatKg,
    this.rightArmFatPercent,
    this.trunkFatKg,
    this.trunkFatPercent,
    this.leftLegFatKg,
    this.leftLegFatPercent,
    this.rightLegFatKg,
    this.rightLegFatPercent,
    this.fatFreeMassKg,
    this.basalMetabolicRate,
    this.waistHipRatio,
    this.visceralFatLevel,
    this.metabolicAge,
    this.targetWeightKg,
    this.weightControlKg,
    this.fatControlKg,
    this.muscleControlKg,
    this.notes,
    required this.createdAt,
  });

  factory BodyCompositionModel.fromJson(Map<String, dynamic> json) {
    return BodyCompositionModel(
      id: json['id'],
      clientId: json['client_id'],
      recordedById: json['recorded_by_id'],
      measurementDate: DateTime.parse(json['measurement_date']),
      heightCm: json['height_cm']?.toDouble(),
      weightKg: json['weight_kg']?.toDouble(),
      age: json['age'],
      gender: json['gender'],
      totalBodyWaterL: json['total_body_water_l']?.toDouble(),
      proteinKg: json['protein_kg']?.toDouble(),
      mineralsKg: json['minerals_kg']?.toDouble(),
      bodyFatMassKg: json['body_fat_mass_kg']?.toDouble(),
      skeletalMuscleMassKg: json['skeletal_muscle_mass_kg']?.toDouble(),
      bmi: json['bmi']?.toDouble(),
      percentBodyFat: json['percent_body_fat']?.toDouble(),
      leftArmLeanKg: json['left_arm_lean_kg']?.toDouble(),
      leftArmLeanPercent: json['left_arm_lean_percent']?.toDouble(),
      rightArmLeanKg: json['right_arm_lean_kg']?.toDouble(),
      rightArmLeanPercent: json['right_arm_lean_percent']?.toDouble(),
      trunkLeanKg: json['trunk_lean_kg']?.toDouble(),
      trunkLeanPercent: json['trunk_lean_percent']?.toDouble(),
      leftLegLeanKg: json['left_leg_lean_kg']?.toDouble(),
      leftLegLeanPercent: json['left_leg_lean_percent']?.toDouble(),
      rightLegLeanKg: json['right_leg_lean_kg']?.toDouble(),
      rightLegLeanPercent: json['right_leg_lean_percent']?.toDouble(),
      leftArmFatKg: json['left_arm_fat_kg']?.toDouble(),
      leftArmFatPercent: json['left_arm_fat_percent']?.toDouble(),
      rightArmFatKg: json['right_arm_fat_kg']?.toDouble(),
      rightArmFatPercent: json['right_arm_fat_percent']?.toDouble(),
      trunkFatKg: json['trunk_fat_kg']?.toDouble(),
      trunkFatPercent: json['trunk_fat_percent']?.toDouble(),
      leftLegFatKg: json['left_leg_fat_kg']?.toDouble(),
      leftLegFatPercent: json['left_leg_fat_percent']?.toDouble(),
      rightLegFatKg: json['right_leg_fat_kg']?.toDouble(),
      rightLegFatPercent: json['right_leg_fat_percent']?.toDouble(),
      fatFreeMassKg: json['fat_free_mass_kg']?.toDouble(),
      basalMetabolicRate: json['basal_metabolic_rate'],
      waistHipRatio: json['waist_hip_ratio']?.toDouble(),
      visceralFatLevel: json['visceral_fat_level'],
      metabolicAge: json['metabolic_age'],
      targetWeightKg: json['target_weight_kg']?.toDouble(),
      weightControlKg: json['weight_control_kg']?.toDouble(),
      fatControlKg: json['fat_control_kg']?.toDouble(),
      muscleControlKg: json['muscle_control_kg']?.toDouble(),
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client_id': clientId,
      'recorded_by_id': recordedById,
      'measurement_date': measurementDate.toIso8601String(),
      'height_cm': heightCm,
      'weight_kg': weightKg,
      'age': age,
      'gender': gender,
      'total_body_water_l': totalBodyWaterL,
      'protein_kg': proteinKg,
      'minerals_kg': mineralsKg,
      'body_fat_mass_kg': bodyFatMassKg,
      'skeletal_muscle_mass_kg': skeletalMuscleMassKg,
      'bmi': bmi,
      'percent_body_fat': percentBodyFat,
      'left_arm_lean_kg': leftArmLeanKg,
      'left_arm_lean_percent': leftArmLeanPercent,
      'right_arm_lean_kg': rightArmLeanKg,
      'right_arm_lean_percent': rightArmLeanPercent,
      'trunk_lean_kg': trunkLeanKg,
      'trunk_lean_percent': trunkLeanPercent,
      'left_leg_lean_kg': leftLegLeanKg,
      'left_leg_lean_percent': leftLegLeanPercent,
      'right_leg_lean_kg': rightLegLeanKg,
      'right_leg_lean_percent': rightLegLeanPercent,
      'left_arm_fat_kg': leftArmFatKg,
      'left_arm_fat_percent': leftArmFatPercent,
      'right_arm_fat_kg': rightArmFatKg,
      'right_arm_fat_percent': rightArmFatPercent,
      'trunk_fat_kg': trunkFatKg,
      'trunk_fat_percent': trunkFatPercent,
      'left_leg_fat_kg': leftLegFatKg,
      'left_leg_fat_percent': leftLegFatPercent,
      'right_leg_fat_kg': rightLegFatKg,
      'right_leg_fat_percent': rightLegFatPercent,
      'fat_free_mass_kg': fatFreeMassKg,
      'basal_metabolic_rate': basalMetabolicRate,
      'waist_hip_ratio': waistHipRatio,
      'visceral_fat_level': visceralFatLevel,
      'metabolic_age': metabolicAge,
      'target_weight_kg': targetWeightKg,
      'weight_control_kg': weightControlKg,
      'fat_control_kg': fatControlKg,
      'muscle_control_kg': muscleControlKg,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
    };
  }

  String getBmiCategory() {
    if (bmi == null) return 'Unknown';
    if (bmi! < 18.5) return 'Underweight';
    if (bmi! < 25) return 'Normal';
    if (bmi! < 30) return 'Overweight';
    return 'Obese';
  }

  String getBodyFatCategory() {
    if (percentBodyFat == null || gender == null) return 'Unknown';

    if (gender == 'male') {
      if (percentBodyFat! < 6) return 'Essential';
      if (percentBodyFat! < 14) return 'Athletes';
      if (percentBodyFat! < 18) return 'Fitness';
      if (percentBodyFat! < 25) return 'Average';
      return 'Obese';
    } else {
      if (percentBodyFat! < 14) return 'Essential';
      if (percentBodyFat! < 21) return 'Athletes';
      if (percentBodyFat! < 25) return 'Fitness';
      if (percentBodyFat! < 32) return 'Average';
      return 'Obese';
    }
  }
}
