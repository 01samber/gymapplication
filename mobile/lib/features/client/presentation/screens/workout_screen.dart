import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../models/exercise_model.dart';

class WorkoutScreen extends ConsumerStatefulWidget {
  const WorkoutScreen({super.key});

  @override
  ConsumerState<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends ConsumerState<WorkoutScreen> {
  final _supabase = Supabase.instance.client;
  List<Exercise> _exercises = [];
  Map<String, List<Exercise>> _groupedByEquipment = {};
  String? _activeSessionId;
  List<ExerciseLog> _sessionLogs = [];
  bool _loading = true;
  final String _selectedEquipment = 'all';
  String? _expandedEquipment;

  // Muscle group colors and icons
  final Map<String, Map<String, dynamic>> _muscleGroupStyles = {
    'chest': {'color': const Color(0xFFEF4444), 'icon': Icons.fitness_center, 'emoji': '💪'},
    'back': {'color': const Color(0xFF3B82F6), 'icon': Icons.accessibility_new, 'emoji': '🔙'},
    'shoulders': {'color': const Color(0xFFF97316), 'icon': Icons.sports_martial_arts, 'emoji': '🏋️'},
    'biceps': {'color': const Color(0xFF8B5CF6), 'icon': Icons.fitness_center, 'emoji': '💪'},
    'triceps': {'color': const Color(0xFFEC4899), 'icon': Icons.sports_gymnastics, 'emoji': '🦾'},
    'quadriceps': {'color': const Color(0xFF22C55E), 'icon': Icons.directions_walk, 'emoji': '🦵'},
    'hamstrings': {'color': const Color(0xFF14B8A6), 'icon': Icons.directions_run, 'emoji': '🦿'},
    'glutes': {'color': const Color(0xFFEAB308), 'icon': Icons.airline_seat_legroom_extra, 'emoji': '🍑'},
    'calves': {'color': const Color(0xFF84CC16), 'icon': Icons.height, 'emoji': '🦶'},
    'abs': {'color': const Color(0xFFEF4444), 'icon': Icons.sports_kabaddi, 'emoji': '🔥'},
    'obliques': {'color': const Color(0xFF06B6D4), 'icon': Icons.rotate_left, 'emoji': '↔️'},
    'cardio': {'color': const Color(0xFFF43F5E), 'icon': Icons.favorite, 'emoji': '❤️'},
  };

  final Map<String, Map<String, dynamic>> _equipmentStyles = {
    'barbell': {'icon': Icons.fitness_center, 'emoji': '🏋️', 'label': 'Barbell Station'},
    'dumbbell': {'icon': Icons.fitness_center, 'emoji': '🔩', 'label': 'Dumbbell Area'},
    'cable': {'icon': Icons.electrical_services, 'emoji': '⚡', 'label': 'Cable Machine'},
    'machine': {'icon': Icons.precision_manufacturing, 'emoji': '⚙️', 'label': 'Weight Machines'},
    'bodyweight': {'icon': Icons.self_improvement, 'emoji': '🧍', 'label': 'Bodyweight / Floor'},
    'cardio_machine': {'icon': Icons.directions_run, 'emoji': '🏃', 'label': 'Cardio Machines'},
    'other': {'icon': Icons.category, 'emoji': '🎯', 'label': 'Other Equipment'},
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Color _getMuscleColor(String muscle) {
    return (_muscleGroupStyles[muscle]?['color'] as Color?) ?? AppColors.primary;
  }

  String _getMuscleEmoji(String muscle) {
    return (_muscleGroupStyles[muscle]?['emoji'] as String?) ?? '💪';
  }

  String _getEquipmentLabel(String equipment) {
    return (_equipmentStyles[equipment]?['label'] as String?) ?? equipment;
  }

  String _getEquipmentEmoji(String equipment) {
    return (_equipmentStyles[equipment]?['emoji'] as String?) ?? '🏋️';
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final exercisesResponse = await _supabase
          .from('exercises')
          .select('id, name, description, muscle_group, equipment, difficulty, is_cardio, instructions, tips')
          .eq('is_active', true)
          .order('equipment')
          .order('muscle_group')
          .order('name');

      _exercises = (exercisesResponse as List)
          .map((e) => Exercise.fromJson(e))
          .toList();

      _groupedByEquipment = {};
      for (final ex in _exercises) {
        _groupedByEquipment.putIfAbsent(ex.equipment, () => []).add(ex);
      }

      final userId = _supabase.auth.currentUser?.id;
      if (userId != null) {
        final sessionResponse = await _supabase
            .from('workout_sessions')
            .select()
            .eq('client_id', userId)
            .isFilter('completed_at', null)
            .order('started_at', ascending: false)
            .limit(1)
            .maybeSingle();

        if (sessionResponse != null) {
          _activeSessionId = sessionResponse['id'];
          await _loadSessionLogs();
        }
      }
    } catch (e) {
      debugPrint('Error loading exercises: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadSessionLogs() async {
    if (_activeSessionId == null) return;

    try {
      final logsResponse = await _supabase
          .from('exercise_logs')
          .select()
          .eq('session_id', _activeSessionId!)
          .order('created_at');

      _sessionLogs = (logsResponse as List).map((log) {
        final exercise = _exercises.firstWhere(
          (e) => e.id == log['exercise_id'],
          orElse: () => Exercise(
            id: log['exercise_id'],
            name: 'Unknown',
            muscleGroup: 'other',
            equipment: 'other',
            difficulty: 1,
          ),
        );
        return ExerciseLog.fromJson(log, exercise: exercise);
      }).toList();

      setState(() {});
    } catch (e) {
      debugPrint('Error loading logs: $e');
    }
  }

  Future<void> _startSession() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      final response = await _supabase.from('workout_sessions').insert({
        'client_id': userId,
        'session_date': DateTime.now().toIso8601String().split('T')[0],
        'started_at': DateTime.now().toIso8601String(),
      }).select().single();

      setState(() {
        _activeSessionId = response['id'];
        _sessionLogs = [];
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Workout session started! 💪'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      debugPrint('Error starting session: $e');
    }
  }

  Future<void> _endSession() async {
    if (_activeSessionId == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Workout?'),
        content: const Text('Are you sure you want to finish this workout session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('End Workout'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _supabase.from('workout_sessions').update({
        'completed_at': DateTime.now().toIso8601String(),
      }).eq('id', _activeSessionId!);

      setState(() {
        _activeSessionId = null;
        _sessionLogs = [];
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Great workout! Session completed! 🎉'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      debugPrint('Error ending session: $e');
    }
  }

  Future<void> _addExerciseToSession(Exercise exercise) async {
    if (_activeSessionId == null) {
      await _startSession();
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddExerciseSheet(
        exercise: exercise,
        sessionId: _activeSessionId!,
        muscleColor: _getMuscleColor(exercise.muscleGroup),
        muscleEmoji: _getMuscleEmoji(exercise.muscleGroup),
        onAdded: () {
          _loadSessionLogs();
          Navigator.pop(context);
        },
      ),
    );
  }

  Future<void> _toggleExerciseComplete(ExerciseLog log) async {
    try {
      await _supabase.from('exercise_logs').update({
        'is_completed': !log.isCompleted,
        'completed_at': !log.isCompleted ? DateTime.now().toIso8601String() : null,
      }).eq('id', log.id);

      await _loadSessionLogs();
    } catch (e) {
      debugPrint('Error toggling complete: $e');
    }
  }

  void _showExerciseDetails(Exercise exercise) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ExerciseDetailSheet(
        exercise: exercise,
        muscleColor: _getMuscleColor(exercise.muscleGroup),
        muscleEmoji: _getMuscleEmoji(exercise.muscleGroup),
        onAddToWorkout: () {
          Navigator.pop(context);
          _addExerciseToSession(exercise);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredExercises = _selectedEquipment == 'all'
        ? _exercises
        : _exercises.where((e) => e.equipment == _selectedEquipment).toList();

    final filteredGrouped = <String, List<Exercise>>{};
    for (final ex in filteredExercises) {
      filteredGrouped.putIfAbsent(ex.equipment, () => []).add(ex);
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundSecondary,
      appBar: AppBar(
        title: const Text('Workout'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (_activeSessionId != null)
            TextButton.icon(
              onPressed: _endSession,
              icon: const Icon(Icons.stop, color: AppColors.error),
              label: const Text('End', style: TextStyle(color: AppColors.error)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Active Session Banner
                if (_activeSessionId != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.success.withOpacity(0.2), AppColors.success.withOpacity(0.1)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.success.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.success,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.play_arrow, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Workout in Progress',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: AppColors.success,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${_sessionLogs.where((l) => l.isCompleted).length}/${_sessionLogs.length} exercises completed',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // Session Exercises
                if (_activeSessionId != null && _sessionLogs.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 110,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: _sessionLogs.length,
                      itemBuilder: (context, index) {
                        final log = _sessionLogs[index];
                        return _SessionExerciseCard(
                          log: log,
                          muscleColor: _getMuscleColor(log.exercise?.muscleGroup ?? 'other'),
                          muscleEmoji: _getMuscleEmoji(log.exercise?.muscleGroup ?? 'other'),
                          onToggle: () => _toggleExerciseComplete(log),
                        );
                      },
                    ),
                  ),
                ],

                const SizedBox(height: 16),

                // Equipment/Machine List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filteredGrouped.keys.length,
                    itemBuilder: (context, index) {
                      final equipment = filteredGrouped.keys.elementAt(index);
                      final exercises = filteredGrouped[equipment]!;
                      final isExpanded = _expandedEquipment == equipment;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Equipment Header
                            InkWell(
                              onTap: () {
                                setState(() {
                                  _expandedEquipment = isExpanded ? null : equipment;
                                });
                              },
                              borderRadius: BorderRadius.circular(20),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    // Equipment Icon
                                    Container(
                                      width: 56,
                                      height: 56,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: [
                                            AppColors.primary,
                                            AppColors.primary.withOpacity(0.7),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Center(
                                        child: Text(
                                          _getEquipmentEmoji(equipment),
                                          style: const TextStyle(fontSize: 28),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    // Equipment Info
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _getEquipmentLabel(equipment),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 17,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '${exercises.length} exercises',
                                            style: const TextStyle(
                                              color: AppColors.textSecondary,
                                              fontSize: 13,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          // Muscle groups chips
                                          Wrap(
                                            spacing: 6,
                                            runSpacing: 4,
                                            children: [...{...exercises.map((e) => e.muscleGroup)}]
                                                .take(4)
                                                .map((mg) => Container(
                                                      padding: const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 4,
                                                      ),
                                                      decoration: BoxDecoration(
                                                        color: _getMuscleColor(mg).withOpacity(0.15),
                                                        borderRadius: BorderRadius.circular(8),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          Text(
                                                            _getMuscleEmoji(mg),
                                                            style: const TextStyle(fontSize: 10),
                                                          ),
                                                          const SizedBox(width: 4),
                                                          Text(
                                                            mg.replaceAll('_', ' ').toUpperCase(),
                                                            style: TextStyle(
                                                              fontSize: 9,
                                                              color: _getMuscleColor(mg),
                                                              fontWeight: FontWeight.w600,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ))
                                                .toList(),
                                          ),
                                        ],
                                      ),
                                    ),
                                    // Expand Icon
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: isExpanded ? AppColors.primary.withOpacity(0.1) : AppColors.backgroundSecondary,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                        color: isExpanded ? AppColors.primary : AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Exercises List (when expanded)
                            if (isExpanded)
                              Column(
                                children: exercises.map((exercise) {
                                  final muscleColor = _getMuscleColor(exercise.muscleGroup);
                                  return InkWell(
                                    onTap: () => _showExerciseDetails(exercise),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        border: Border(
                                          top: BorderSide(
                                            color: AppColors.border,
                                            width: 0.5,
                                          ),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          // Exercise Icon with Muscle Color
                                          Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                begin: Alignment.topLeft,
                                                end: Alignment.bottomRight,
                                                colors: [
                                                  muscleColor,
                                                  muscleColor.withOpacity(0.7),
                                                ],
                                              ),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Center(
                                              child: Text(
                                                _getMuscleEmoji(exercise.muscleGroup),
                                                style: const TextStyle(fontSize: 22),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          // Exercise Info
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  exercise.name,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 15,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 3,
                                                      ),
                                                      decoration: BoxDecoration(
                                                        color: muscleColor.withOpacity(0.1),
                                                        borderRadius: BorderRadius.circular(6),
                                                      ),
                                                      child: Text(
                                                        exercise.formattedMuscleGroup,
                                                        style: TextStyle(
                                                          fontSize: 10,
                                                          color: muscleColor,
                                                          fontWeight: FontWeight.w500,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 6),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 3,
                                                      ),
                                                      decoration: BoxDecoration(
                                                        color: _getDifficultyColor(exercise.difficulty).withOpacity(0.1),
                                                        borderRadius: BorderRadius.circular(6),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          ...List.generate(5, (i) => Icon(
                                                            Icons.star,
                                                            size: 10,
                                                            color: i < exercise.difficulty 
                                                                ? Colors.amber 
                                                                : Colors.grey.shade300,
                                                          )),
                                                        ],
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          // Add Button
                                          GestureDetector(
                                            onTap: () => _addExerciseToSession(exercise),
                                            child: Container(
                                              padding: const EdgeInsets.all(10),
                                              decoration: BoxDecoration(
                                                color: AppColors.primary,
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: const Icon(
                                                Icons.add,
                                                color: Colors.white,
                                                size: 20,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
      floatingActionButton: _activeSessionId == null
          ? FloatingActionButton.extended(
              onPressed: _startSession,
              backgroundColor: AppColors.primary,
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Workout'),
            )
          : null,
    );
  }

  Color _getDifficultyColor(int difficulty) {
    switch (difficulty) {
      case 1:
        return Colors.green;
      case 2:
        return Colors.blue;
      case 3:
        return Colors.orange;
      case 4:
        return Colors.deepOrange;
      case 5:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

class _SessionExerciseCard extends StatelessWidget {
  final ExerciseLog log;
  final Color muscleColor;
  final String muscleEmoji;
  final VoidCallback onToggle;

  const _SessionExerciseCard({
    required this.log,
    required this.muscleColor,
    required this.muscleEmoji,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: log.isCompleted 
            ? LinearGradient(colors: [AppColors.success.withOpacity(0.2), AppColors.success.withOpacity(0.1)])
            : LinearGradient(colors: [muscleColor.withOpacity(0.1), muscleColor.withOpacity(0.05)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: log.isCompleted ? AppColors.success.withOpacity(0.3) : muscleColor.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(muscleEmoji, style: const TextStyle(fontSize: 20)),
              const Spacer(),
              if (log.isCompleted)
                const Icon(Icons.check_circle, color: AppColors.success, size: 20),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            log.exercise?.name ?? 'Exercise',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              decoration: log.isCompleted ? TextDecoration.lineThrough : null,
              color: log.isCompleted ? AppColors.textSecondary : AppColors.textPrimary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Set ${log.setNumber}',
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
              if (log.repsTarget != null)
                Text(
                  '${log.repsCompleted ?? log.repsTarget}×',
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    fontSize: 12,
                    color: muscleColor,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ExerciseDetailSheet extends StatelessWidget {
  final Exercise exercise;
  final Color muscleColor;
  final String muscleEmoji;
  final VoidCallback onAddToWorkout;

  const _ExerciseDetailSheet({
    required this.exercise,
    required this.muscleColor,
    required this.muscleEmoji,
    required this.onAddToWorkout,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 12),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Icon Header
          Container(
            height: 160,
            width: double.infinity,
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  muscleColor,
                  muscleColor.withOpacity(0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(muscleEmoji, style: const TextStyle(fontSize: 64)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      exercise.formattedMuscleGroup,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exercise.name,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _Chip(exercise.formattedMuscleGroup, muscleColor),
                    const SizedBox(width: 8),
                    _Chip(exercise.formattedEquipment, Colors.grey),
                    const SizedBox(width: 8),
                    _Chip(exercise.difficultyLabel, Colors.orange),
                    if (exercise.isCardio) ...[
                      const SizedBox(width: 8),
                      const _Chip('Cardio', Colors.red),
                    ],
                  ],
                ),
                const SizedBox(height: 16),
                if (exercise.description != null)
                  Text(
                    exercise.description!,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                if (exercise.instructions != null && exercise.instructions!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text(
                    'How to Perform',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  const SizedBox(height: 12),
                  ...exercise.instructions!.asMap().entries.map((entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [muscleColor, muscleColor.withOpacity(0.7)],
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                child: Text(
                                  '${entry.key + 1}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                entry.value,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 14,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )),
                ],
              ],
            ),
          ),

          // Add Button
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: onAddToWorkout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: muscleColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add, color: Colors.white),
                    SizedBox(width: 8),
                    Text(
                      'Add to Workout',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;

  const _Chip(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _AddExerciseSheet extends StatefulWidget {
  final Exercise exercise;
  final String sessionId;
  final Color muscleColor;
  final String muscleEmoji;
  final VoidCallback onAdded;

  const _AddExerciseSheet({
    required this.exercise,
    required this.sessionId,
    required this.muscleColor,
    required this.muscleEmoji,
    required this.onAdded,
  });

  @override
  State<_AddExerciseSheet> createState() => _AddExerciseSheetState();
}

class _AddExerciseSheetState extends State<_AddExerciseSheet> {
  final _supabase = Supabase.instance.client;
  int _sets = 3;
  int _reps = 12;
  double _weight = 0;
  int _duration = 10;
  bool _loading = false;

  Future<void> _addExercise() async {
    setState(() => _loading = true);
    try {
      for (int i = 1; i <= _sets; i++) {
        await _supabase.from('exercise_logs').insert({
          'session_id': widget.sessionId,
          'exercise_id': widget.exercise.id,
          'set_number': i,
          'reps_target': widget.exercise.isCardio ? null : _reps,
          'weight_kg': widget.exercise.isCardio ? null : (_weight > 0 ? _weight : null),
          'duration_minutes': widget.exercise.isCardio ? _duration : null,
          'is_completed': false,
        });
      }
      widget.onAdded();
    } catch (e) {
      debugPrint('Error adding exercise: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [widget.muscleColor, widget.muscleColor.withOpacity(0.7)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Text(widget.muscleEmoji, style: const TextStyle(fontSize: 28)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.exercise.name,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.exercise.formattedMuscleGroup,
                          style: TextStyle(color: widget.muscleColor, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              if (widget.exercise.isCardio) ...[
                const Text('Duration (minutes)', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    IconButton(
                      onPressed: _duration > 1 ? () => setState(() => _duration--) : null,
                      icon: Icon(Icons.remove_circle_outline, color: widget.muscleColor),
                    ),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: widget.muscleColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          '$_duration min',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 24, 
                            fontWeight: FontWeight.bold,
                            color: widget.muscleColor,
                          ),
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => setState(() => _duration++),
                      icon: Icon(Icons.add_circle_outline, color: widget.muscleColor),
                    ),
                  ],
                ),
              ] else ...[
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Sets', style: TextStyle(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              IconButton(
                                onPressed: _sets > 1 ? () => setState(() => _sets--) : null,
                                icon: Icon(Icons.remove_circle_outline, color: widget.muscleColor),
                              ),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  decoration: BoxDecoration(
                                    color: widget.muscleColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '$_sets',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 22, 
                                      fontWeight: FontWeight.bold,
                                      color: widget.muscleColor,
                                    ),
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed: () => setState(() => _sets++),
                                icon: Icon(Icons.add_circle_outline, color: widget.muscleColor),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Reps', style: TextStyle(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              IconButton(
                                onPressed: _reps > 1 ? () => setState(() => _reps--) : null,
                                icon: Icon(Icons.remove_circle_outline, color: widget.muscleColor),
                              ),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  decoration: BoxDecoration(
                                    color: widget.muscleColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '$_reps',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 22, 
                                      fontWeight: FontWeight.bold,
                                      color: widget.muscleColor,
                                    ),
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed: () => setState(() => _reps++),
                                icon: Icon(Icons.add_circle_outline, color: widget.muscleColor),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('Weight (kg) - Optional', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                TextField(
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    hintText: '0',
                    filled: true,
                    fillColor: AppColors.backgroundSecondary,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: widget.muscleColor, width: 2),
                    ),
                  ),
                  onChanged: (v) => _weight = double.tryParse(v) ?? 0,
                ),
              ],

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading ? null : _addExercise,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: widget.muscleColor,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add, color: Colors.white),
                            SizedBox(width: 8),
                            Text('Add to Workout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
