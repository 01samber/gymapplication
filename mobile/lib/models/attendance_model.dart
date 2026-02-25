class Attendance {
  final String id;
  final String clientId;
  final DateTime checkInTime;
  final DateTime? checkOutTime;
  final int? durationMinutes;
  final String? notes;

  Attendance({
    required this.id,
    required this.clientId,
    required this.checkInTime,
    this.checkOutTime,
    this.durationMinutes,
    this.notes,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'] as String,
      clientId: json['client_id'] as String,
      checkInTime: DateTime.parse(json['check_in_time'] as String),
      checkOutTime: json['check_out_time'] != null
          ? DateTime.parse(json['check_out_time'] as String)
          : null,
      durationMinutes: json['duration_minutes'] as int?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'client_id': clientId,
      'check_in_time': checkInTime.toIso8601String(),
      'check_out_time': checkOutTime?.toIso8601String(),
      'duration_minutes': durationMinutes,
      'notes': notes,
    };
  }

  bool get isActive => checkOutTime == null;

  String get formattedCheckIn {
    final hour = checkInTime.hour;
    final minute = checkInTime.minute.toString().padLeft(2, '0');
    final amPm = hour >= 12 ? 'PM' : 'AM';
    final hour12 = hour % 12 == 0 ? 12 : hour % 12;
    return '$hour12:$minute $amPm';
  }

  String get formattedCheckOut {
    if (checkOutTime == null) return '-';
    final hour = checkOutTime!.hour;
    final minute = checkOutTime!.minute.toString().padLeft(2, '0');
    final amPm = hour >= 12 ? 'PM' : 'AM';
    final hour12 = hour % 12 == 0 ? 12 : hour % 12;
    return '$hour12:$minute $amPm';
  }

  String get formattedDuration {
    if (durationMinutes == null) return '-';
    final hours = durationMinutes! ~/ 60;
    final mins = durationMinutes! % 60;
    if (hours > 0) return '${hours}h ${mins}m';
    return '${mins}m';
  }

  String get currentDuration {
    if (checkOutTime != null) return formattedDuration;
    final diff = DateTime.now().difference(checkInTime);
    final hours = diff.inHours;
    final mins = diff.inMinutes % 60;
    if (hours > 0) return '${hours}h ${mins}m';
    return '${mins}m';
  }
}

class WorkoutSession {
  final String id;
  final String clientId;
  final String? attendanceId;
  final String? workoutDayId;
  final DateTime sessionDate;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final String? notes;
  final int? rating;
  final List<dynamic>? exerciseLogs;

  WorkoutSession({
    required this.id,
    required this.clientId,
    this.attendanceId,
    this.workoutDayId,
    required this.sessionDate,
    this.startedAt,
    this.completedAt,
    this.notes,
    this.rating,
    this.exerciseLogs,
  });

  factory WorkoutSession.fromJson(Map<String, dynamic> json) {
    return WorkoutSession(
      id: json['id'] as String,
      clientId: json['client_id'] as String,
      attendanceId: json['attendance_id'] as String?,
      workoutDayId: json['workout_day_id'] as String?,
      sessionDate: DateTime.parse(json['session_date'] as String),
      startedAt: json['started_at'] != null
          ? DateTime.parse(json['started_at'] as String)
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : null,
      notes: json['notes'] as String?,
      rating: json['rating'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'client_id': clientId,
      'attendance_id': attendanceId,
      'workout_day_id': workoutDayId,
      'session_date': sessionDate.toIso8601String().split('T')[0],
      'started_at': startedAt?.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
      'notes': notes,
      'rating': rating,
    };
  }

  bool get isCompleted => completedAt != null;
  bool get isActive => startedAt != null && completedAt == null;
}
