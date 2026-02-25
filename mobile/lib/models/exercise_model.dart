class Exercise {
  final String id;
  final String name;
  final String? description;
  final String muscleGroup;
  final List<String>? secondaryMuscles;
  final String equipment;
  final String? imageUrl;
  final String? videoUrl;
  final List<String>? instructions;
  final List<String>? tips;
  final int difficulty;
  final bool isCardio;
  final bool isActive;

  Exercise({
    required this.id,
    required this.name,
    this.description,
    required this.muscleGroup,
    this.secondaryMuscles,
    required this.equipment,
    this.imageUrl,
    this.videoUrl,
    this.instructions,
    this.tips,
    required this.difficulty,
    this.isCardio = false,
    this.isActive = true,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      muscleGroup: json['muscle_group'] as String,
      secondaryMuscles: json['secondary_muscles'] != null
          ? List<String>.from(json['secondary_muscles'])
          : null,
      equipment: json['equipment'] as String,
      imageUrl: json['image_url'] as String?,
      videoUrl: json['video_url'] as String?,
      instructions: json['instructions'] != null
          ? List<String>.from(json['instructions'])
          : null,
      tips: json['tips'] != null ? List<String>.from(json['tips']) : null,
      difficulty: json['difficulty'] as int? ?? 1,
      isCardio: json['is_cardio'] as bool? ?? false,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  String get difficultyLabel {
    switch (difficulty) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Easy';
      case 3:
        return 'Intermediate';
      case 4:
        return 'Advanced';
      case 5:
        return 'Expert';
      default:
        return 'Unknown';
    }
  }

  String get formattedMuscleGroup {
    return muscleGroup.replaceAll('_', ' ').toUpperCase();
  }

  String get formattedEquipment {
    return equipment.replaceAll('_', ' ');
  }
}

class ExerciseLog {
  final String id;
  final String sessionId;
  final String exerciseId;
  final String? workoutExerciseId;
  final int setNumber;
  final int? repsTarget;
  final int? repsCompleted;
  final double? weightKg;
  final int? durationMinutes;
  final double? distanceKm;
  final int? caloriesBurned;
  final bool isCompleted;
  final String? notes;
  final DateTime? completedAt;
  final Exercise? exercise;

  ExerciseLog({
    required this.id,
    required this.sessionId,
    required this.exerciseId,
    this.workoutExerciseId,
    required this.setNumber,
    this.repsTarget,
    this.repsCompleted,
    this.weightKg,
    this.durationMinutes,
    this.distanceKm,
    this.caloriesBurned,
    this.isCompleted = false,
    this.notes,
    this.completedAt,
    this.exercise,
  });

  factory ExerciseLog.fromJson(Map<String, dynamic> json, {Exercise? exercise}) {
    return ExerciseLog(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      exerciseId: json['exercise_id'] as String,
      workoutExerciseId: json['workout_exercise_id'] as String?,
      setNumber: json['set_number'] as int? ?? 1,
      repsTarget: json['reps_target'] as int?,
      repsCompleted: json['reps_completed'] as int?,
      weightKg: (json['weight_kg'] as num?)?.toDouble(),
      durationMinutes: json['duration_minutes'] as int?,
      distanceKm: (json['distance_km'] as num?)?.toDouble(),
      caloriesBurned: json['calories_burned'] as int?,
      isCompleted: json['is_completed'] as bool? ?? false,
      notes: json['notes'] as String?,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : null,
      exercise: exercise,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      'exercise_id': exerciseId,
      'workout_exercise_id': workoutExerciseId,
      'set_number': setNumber,
      'reps_target': repsTarget,
      'reps_completed': repsCompleted,
      'weight_kg': weightKg,
      'duration_minutes': durationMinutes,
      'distance_km': distanceKm,
      'calories_burned': caloriesBurned,
      'is_completed': isCompleted,
      'notes': notes,
      'completed_at': completedAt?.toIso8601String(),
    };
  }

  ExerciseLog copyWith({
    int? repsCompleted,
    double? weightKg,
    int? durationMinutes,
    bool? isCompleted,
    DateTime? completedAt,
  }) {
    return ExerciseLog(
      id: id,
      sessionId: sessionId,
      exerciseId: exerciseId,
      workoutExerciseId: workoutExerciseId,
      setNumber: setNumber,
      repsTarget: repsTarget,
      repsCompleted: repsCompleted ?? this.repsCompleted,
      weightKg: weightKg ?? this.weightKg,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      distanceKm: distanceKm,
      caloriesBurned: caloriesBurned,
      isCompleted: isCompleted ?? this.isCompleted,
      notes: notes,
      completedAt: completedAt ?? this.completedAt,
      exercise: exercise,
    );
  }
}
