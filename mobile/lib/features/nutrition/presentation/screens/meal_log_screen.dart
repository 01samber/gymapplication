import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/nutrition_provider.dart';
import '../../models/nutrition_models.dart';
import '../widgets/add_meal_dialog.dart';

class MealLogScreen extends ConsumerStatefulWidget {
  const MealLogScreen({super.key});

  @override
  ConsumerState<MealLogScreen> createState() => _MealLogScreenState();
}

class _MealLogScreenState extends ConsumerState<MealLogScreen> {
  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(mealLogsNotifierProvider);
    final notifier = ref.read(mealLogsNotifierProvider.notifier);
    final activePlanAsync = ref.watch(activeDietPlanProvider);
    final dailyTotals = ref.watch(dailyTotalsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Meal Log',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today, color: Colors.white),
            onPressed: () => _selectDate(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () => notifier.refresh(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Date selector
          _buildDateHeader(context, notifier),

          // Daily summary
          activePlanAsync.when(
            data: (plan) => _buildDailySummary(context, dailyTotals, plan),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Meal logs list
          Expanded(
            child: logsAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: Colors.orange),
              ),
              error: (error, stack) =>
                  _buildErrorState(context, error.toString()),
              data: (logs) {
                if (logs.isEmpty) {
                  return _buildEmptyState(context);
                }

                // Group by meal type
                final mealTypes = [
                  'breakfast',
                  'morning_snack',
                  'lunch',
                  'afternoon_snack',
                  'dinner',
                  'evening_snack'
                ];

                return RefreshIndicator(
                  onRefresh: () async => notifier.refresh(),
                  color: Colors.orange,
                  backgroundColor: const Color(0xFF1A1F26),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: mealTypes.length,
                    itemBuilder: (context, index) {
                      final mealType = mealTypes[index];
                      final mealLogs =
                          logs.where((l) => l.mealType == mealType).toList();

                      return _buildMealTypeSection(context, mealType, mealLogs);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddMealDialog(context),
        backgroundColor: Colors.orange,
        icon: const Icon(Icons.add),
        label: const Text('Log Meal'),
      ),
    );
  }

  Widget _buildDateHeader(BuildContext context, MealLogsNotifier notifier) {
    final date = notifier.selectedDate;
    final isToday = _isToday(date);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: const Color(0xFF1A1F26),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left, color: Colors.white),
            onPressed: () {
              notifier.setDate(date.subtract(const Duration(days: 1)));
            },
          ),
          GestureDetector(
            onTap: () => _selectDate(context),
            child: Column(
              children: [
                Text(
                  isToday ? 'Today' : _formatDate(date),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (!isToday)
                  Text(
                    _formatWeekday(date),
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right, color: Colors.white),
            onPressed: () {
              if (!isToday) {
                notifier.setDate(date.add(const Duration(days: 1)));
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDailySummary(
      BuildContext context, Map<String, num> totals, DietPlanModel? plan) {
    final targetCalories = plan?.dailyCaloriesTarget ?? 2000;
    final targetProtein = plan?.dailyProteinG ?? 150;
    final targetCarbs = plan?.dailyCarbsG ?? 200;
    final targetFat = plan?.dailyFatG ?? 65;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.orange[900]!.withOpacity(0.6),
            Colors.deepOrange[900]!.withOpacity(0.4),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Daily Summary',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          // Calories progress
          _buildProgressBar(
            'Calories',
            totals['calories'] as int,
            targetCalories,
            'kcal',
            Colors.orange,
          ),
          const SizedBox(height: 12),

          // Macros row
          Row(
            children: [
              Expanded(
                child: _buildMacroProgress(
                  'Protein',
                  (totals['protein'] as double).toInt(),
                  targetProtein,
                  Colors.red,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildMacroProgress(
                  'Carbs',
                  (totals['carbs'] as double).toInt(),
                  targetCarbs,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildMacroProgress(
                  'Fat',
                  (totals['fat'] as double).toInt(),
                  targetFat,
                  Colors.yellow,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar(
      String label, int current, int target, String unit, Color color) {
    final progress = (current / target).clamp(0.0, 1.0);
    final percentage = (progress * 100).toInt();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
            Text(
              '$current / $target $unit',
              style: TextStyle(
                  color: color, fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Stack(
          children: [
            Container(
              height: 10,
              decoration: BoxDecoration(
                color: Colors.white12,
                borderRadius: BorderRadius.circular(5),
              ),
            ),
            FractionallySizedBox(
              widthFactor: progress,
              child: Container(
                height: 10,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [color.withOpacity(0.7), color],
                  ),
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          '$percentage% of daily goal',
          style: const TextStyle(color: Colors.white60, fontSize: 10),
        ),
      ],
    );
  }

  Widget _buildMacroProgress(
      String label, int current, int target, Color color) {
    final progress = (current / target).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white60, fontSize: 10),
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 40,
            width: 40,
            child: Stack(
              children: [
                CircularProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.white12,
                  valueColor: AlwaysStoppedAnimation(color),
                  strokeWidth: 4,
                ),
                Center(
                  child: Text(
                    '${(progress * 100).toInt()}%',
                    style: TextStyle(
                      color: color,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$current/${target}g',
            style: const TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildMealTypeSection(
      BuildContext context, String mealType, List<MealLogModel> logs) {
    final mealLabel = _getMealTypeLabel(mealType);
    final hasLogs = logs.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F26),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getMealColor(mealType).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getMealIcon(mealType),
                    color: _getMealColor(mealType),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    mealLabel,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
                if (hasLogs)
                  Text(
                    '${logs.fold<int>(0, (sum, log) => sum + log.totalCalories)} kcal',
                    style: TextStyle(
                      color: Colors.orange[300],
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                IconButton(
                  icon: const Icon(Icons.add, color: Colors.white60, size: 20),
                  onPressed: () =>
                      _showAddMealDialog(context, mealType: mealType),
                ),
              ],
            ),
          ),

          // Logged items
          if (hasLogs) ...logs.map((log) => _buildLogEntry(context, log)),

          if (!hasLogs)
            const Padding(
              padding: EdgeInsets.only(left: 12, bottom: 12),
              child: Text(
                'No meals logged',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLogEntry(BuildContext context, MealLogModel log) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...log.items.map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${item.displayName} (${item.quantity} ${item.unit})',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12),
                      ),
                    ),
                    Text(
                      '${item.calories} kcal',
                      style:
                          const TextStyle(color: Colors.white54, fontSize: 11),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'P: ${log.totalProteinG.toStringAsFixed(0)}g • C: ${log.totalCarbsG.toStringAsFixed(0)}g • F: ${log.totalFatG.toStringAsFixed(0)}g',
                style: const TextStyle(color: Colors.white38, fontSize: 10),
              ),
              GestureDetector(
                onTap: () => _confirmDeleteLog(context, log),
                child: const Icon(Icons.delete_outline,
                    color: Colors.red, size: 18),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.edit_note_outlined,
                size: 64,
                color: Colors.orange,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Meals Logged',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Start tracking your meals to stay on top of your nutrition goals.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white60,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showAddMealDialog(context),
              icon: const Icon(Icons.add),
              label: const Text('Log Your First Meal'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    final notifier = ref.read(mealLogsNotifierProvider.notifier);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'Unable to Load Meal Logs',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white60),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => notifier.refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    final notifier = ref.read(mealLogsNotifierProvider.notifier);
    final currentDate = notifier.selectedDate;

    final picked = await showDatePicker(
      context: context,
      initialDate: currentDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Colors.orange,
              onPrimary: Colors.white,
              surface: Color(0xFF1A1F26),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      notifier.setDate(picked);
    }
  }

  void _showAddMealDialog(BuildContext context, {String? mealType}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddMealDialog(
        initialMealType: mealType,
        onMealAdded: () {
          ref.read(mealLogsNotifierProvider.notifier).refresh();
        },
      ),
    );
  }

  void _confirmDeleteLog(BuildContext context, MealLogModel log) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1F26),
        title: const Text('Delete Meal Log',
            style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to delete this meal log?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(mealLogsNotifierProvider.notifier).deleteMealLog(log.id);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatWeekday(DateTime date) {
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    return weekdays[date.weekday - 1];
  }

  String _getMealTypeLabel(String mealType) {
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

  IconData _getMealIcon(String mealType) {
    switch (mealType) {
      case 'breakfast':
        return Icons.free_breakfast;
      case 'morning_snack':
        return Icons.apple;
      case 'lunch':
        return Icons.lunch_dining;
      case 'afternoon_snack':
        return Icons.cookie;
      case 'dinner':
        return Icons.dinner_dining;
      case 'evening_snack':
        return Icons.nightlight;
      default:
        return Icons.restaurant;
    }
  }

  Color _getMealColor(String mealType) {
    switch (mealType) {
      case 'breakfast':
        return Colors.orange;
      case 'morning_snack':
        return Colors.green;
      case 'lunch':
        return Colors.blue;
      case 'afternoon_snack':
        return Colors.purple;
      case 'dinner':
        return Colors.red;
      case 'evening_snack':
        return Colors.indigo;
      default:
        return Colors.grey;
    }
  }
}
