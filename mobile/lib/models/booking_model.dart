import 'package:equatable/equatable.dart';

/// Booking status enumeration
enum BookingStatus {
  pending,
  confirmed,
  completed,
  cancelled,
  noShow;

  static BookingStatus fromString(String value) {
    switch (value.toLowerCase().replaceAll('_', '')) {
      case 'confirmed':
        return BookingStatus.confirmed;
      case 'completed':
        return BookingStatus.completed;
      case 'cancelled':
        return BookingStatus.cancelled;
      case 'noshow':
        return BookingStatus.noShow;
      default:
        return BookingStatus.pending;
    }
  }

  String get displayName {
    switch (this) {
      case BookingStatus.pending:
        return 'Pending';
      case BookingStatus.confirmed:
        return 'Confirmed';
      case BookingStatus.completed:
        return 'Completed';
      case BookingStatus.cancelled:
        return 'Cancelled';
      case BookingStatus.noShow:
        return 'No Show';
    }
  }
}

/// PT session booking model
class Booking extends Equatable {
  final String id;
  final String clientId;
  final String trainerId;
  final DateTime scheduledDate;
  final String startTime; // HH:MM format
  final String endTime;   // HH:MM format
  final BookingStatus status;
  final String? sessionType;
  final String? notes;
  final String? clientNotes;
  final String? trainerNotes;
  final String? cancelledBy;
  final DateTime? cancelledAt;
  final String? cancellationReason;
  final bool reminderSent;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Joined data (from related tables)
  final String? clientName;
  final String? clientAvatarUrl;
  final String? trainerName;
  final String? trainerAvatarUrl;

  const Booking({
    required this.id,
    required this.clientId,
    required this.trainerId,
    required this.scheduledDate,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.sessionType,
    this.notes,
    this.clientNotes,
    this.trainerNotes,
    this.cancelledBy,
    this.cancelledAt,
    this.cancellationReason,
    this.reminderSent = false,
    required this.createdAt,
    required this.updatedAt,
    this.clientName,
    this.clientAvatarUrl,
    this.trainerName,
    this.trainerAvatarUrl,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as String,
      clientId: json['client_id'] as String,
      trainerId: json['trainer_id'] as String,
      scheduledDate: DateTime.parse(json['scheduled_date'] as String),
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      status: BookingStatus.fromString(json['status'] as String),
      sessionType: json['session_type'] as String?,
      notes: json['notes'] as String?,
      clientNotes: json['client_notes'] as String?,
      trainerNotes: json['trainer_notes'] as String?,
      cancelledBy: json['cancelled_by'] as String?,
      cancelledAt: json['cancelled_at'] != null
          ? DateTime.parse(json['cancelled_at'] as String)
          : null,
      cancellationReason: json['cancellation_reason'] as String?,
      reminderSent: json['reminder_sent'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      // Joined data
      clientName: json['client']?['full_name'] as String?,
      clientAvatarUrl: json['client']?['avatar_url'] as String?,
      trainerName: json['trainer']?['user']?['full_name'] as String?,
      trainerAvatarUrl: json['trainer']?['user']?['avatar_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'client_id': clientId,
      'trainer_id': trainerId,
      'scheduled_date': scheduledDate.toIso8601String().split('T').first,
      'start_time': startTime,
      'end_time': endTime,
      'status': status.name,
      'session_type': sessionType,
      'notes': notes,
      'client_notes': clientNotes,
      'trainer_notes': trainerNotes,
    };
  }

  Booking copyWith({
    String? id,
    String? clientId,
    String? trainerId,
    DateTime? scheduledDate,
    String? startTime,
    String? endTime,
    BookingStatus? status,
    String? sessionType,
    String? notes,
    String? clientNotes,
    String? trainerNotes,
    String? cancelledBy,
    DateTime? cancelledAt,
    String? cancellationReason,
    bool? reminderSent,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? clientName,
    String? clientAvatarUrl,
    String? trainerName,
    String? trainerAvatarUrl,
  }) {
    return Booking(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      trainerId: trainerId ?? this.trainerId,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      sessionType: sessionType ?? this.sessionType,
      notes: notes ?? this.notes,
      clientNotes: clientNotes ?? this.clientNotes,
      trainerNotes: trainerNotes ?? this.trainerNotes,
      cancelledBy: cancelledBy ?? this.cancelledBy,
      cancelledAt: cancelledAt ?? this.cancelledAt,
      cancellationReason: cancellationReason ?? this.cancellationReason,
      reminderSent: reminderSent ?? this.reminderSent,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      clientName: clientName ?? this.clientName,
      clientAvatarUrl: clientAvatarUrl ?? this.clientAvatarUrl,
      trainerName: trainerName ?? this.trainerName,
      trainerAvatarUrl: trainerAvatarUrl ?? this.trainerAvatarUrl,
    );
  }

  /// Get full DateTime for start
  DateTime get startDateTime {
    final parts = startTime.split(':');
    return DateTime(
      scheduledDate.year,
      scheduledDate.month,
      scheduledDate.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );
  }

  /// Get full DateTime for end
  DateTime get endDateTime {
    final parts = endTime.split(':');
    return DateTime(
      scheduledDate.year,
      scheduledDate.month,
      scheduledDate.day,
      int.parse(parts[0]),
      int.parse(parts[1]),
    );
  }

  /// Duration in minutes
  int get durationMinutes {
    return endDateTime.difference(startDateTime).inMinutes;
  }

  /// Check if booking is in the past
  bool get isPast => startDateTime.isBefore(DateTime.now());

  /// Check if booking is today
  bool get isToday {
    final now = DateTime.now();
    return scheduledDate.year == now.year &&
        scheduledDate.month == now.month &&
        scheduledDate.day == now.day;
  }

  /// Check if booking can be cancelled
  bool get canCancel {
    return status == BookingStatus.pending ||
        status == BookingStatus.confirmed;
  }

  @override
  List<Object?> get props => [
        id,
        clientId,
        trainerId,
        scheduledDate,
        startTime,
        endTime,
        status,
        sessionType,
        notes,
        clientNotes,
        trainerNotes,
        cancelledBy,
        cancelledAt,
        cancellationReason,
        reminderSent,
        createdAt,
        updatedAt,
      ];
}
