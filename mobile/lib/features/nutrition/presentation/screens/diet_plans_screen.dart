import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/nutrition_provider.dart';
import '../../models/nutrition_models.dart';
import '../../services/nutrition_service.dart';

class DietPlansScreen extends ConsumerStatefulWidget {
  const DietPlansScreen({super.key});

  @override
  ConsumerState<DietPlansScreen> createState() => _DietPlansScreenState();
}

class _DietPlansScreenState extends ConsumerState<DietPlansScreen> {
  int _selectedDay = 1;
  DietPlanModel? _selectedPlan;
  Map<String, bool> _commitments = {};
  bool _loadingCommitments = false;
  final NutritionService _nutritionService = NutritionService();

  @override
  Widget build(BuildContext context) {
    final plansAsync = ref.watch(dietPlansNotifierProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'My Diet Plan',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              ref.read(dietPlansNotifierProvider.notifier).refresh();
            },
          ),
        ],
      ),
      body: plansAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Colors.green),
        ),
        error: (error, stack) =>
            _buildErrorState(context, error.toString()),
        data: (plans) {
          if (plans.isEmpty) {
            return _buildEmptyState(context);
          }

          // Find active plan
          final activePlans = plans.where((p) => p.isActive).toList();
          final pastPlans = plans.where((p) => !p.isActive).toList();

          if (_selectedPlan == null && activePlans.isNotEmpty) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              setState(() {
                _selectedPlan = activePlans.first;
              });
              _loadCommitments(activePlans.first);
            });
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(dietPlansNotifierProvider.notifier).refresh();
              if (_selectedPlan != null) {
                await _loadCommitments(_selectedPlan!);
              }
            },
            color: Colors.green,
            backgroundColor: const Color(0xFF1A1F26),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (activePlans.isNotEmpty) ...[
                  // Plan selector if multiple
                  if (plans.length > 1) _buildPlanSelector(plans),
                  
                  // Active Plan with Daily View
                  if (_selectedPlan != null) ...[
                    _buildPlanHeader(_selectedPlan!),
                    const SizedBox(height: 16),
                    _buildDaySelector(_selectedPlan!),
                    const SizedBox(height: 16),
                    _buildDaySchedule(_selectedPlan!),
                  ],
                ] else if (pastPlans.isNotEmpty) ...[
                  const Text(
                    'Past Plans',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...pastPlans.map((plan) => _buildPlanCard(context, plan)),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _loadCommitments(DietPlanModel plan) async {
    if (_loadingCommitments) return;
    setState(() => _loadingCommitments = true);
    
    try {
      final commitments = await _nutritionService.getMealCommitments(
        planId: plan.id,
        startDate: plan.startDate,
        endDate: plan.endDate,
      );
      
      final Map<String, bool> commitMap = {};
      for (final c in commitments) {
        final key = '${c.mealId}_${c.commitmentDate.toIso8601String().split('T')[0]}';
        commitMap[key] = c.isCommitted;
      }
      
      setState(() => _commitments = commitMap);
    } catch (e) {
      debugPrint('Error loading commitments: $e');
    } finally {
      setState(() => _loadingCommitments = false);
    }
  }

  Future<void> _toggleCommitment(DietPlanModel plan, DietPlanMealModel meal, DateTime date) async {
    final key = '${meal.id}_${date.toIso8601String().split('T')[0]}';
    final currentValue = _commitments[key] ?? false;
    
    // Optimistic update
    setState(() => _commitments[key] = !currentValue);
    
    try {
      await _nutritionService.toggleMealCommitment(
        planId: plan.id,
        mealId: meal.id,
        commitmentDate: date,
        isCommitted: !currentValue,
      );
    } catch (e) {
      // Revert on error
      setState(() => _commitments[key] = currentValue);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Widget _buildPlanSelector(List<DietPlanModel> plans) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: plans.map((plan) {
            final isSelected = _selectedPlan?.id == plan.id;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedPlan = plan;
                    _selectedDay = 1;
                  });
                  _loadCommitments(plan);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.green : const Color(0xFF1A1F26),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? Colors.green : Colors.white24,
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(
                        plan.name,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white70,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      if (plan.isActive) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.greenAccent.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'ACTIVE',
                            style: TextStyle(color: Colors.greenAccent, fontSize: 8),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildPlanHeader(DietPlanModel plan) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green[900]!.withOpacity(0.8),
            Colors.green[700]!.withOpacity(0.6),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.restaurant_menu, color: Colors.greenAccent, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plan.name,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${plan.planType == 'monthly' ? 'Monthly' : 'Weekly'} Plan • ${DateFormat('MMM d').format(plan.startDate)} - ${plan.endDate != null ? DateFormat('MMM d').format(plan.endDate!) : 'Ongoing'}',
                      style: const TextStyle(color: Colors.white60, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Daily Targets
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildTargetItem('Calories', '${plan.dailyCaloriesTarget}', 'kcal', Colors.orange),
              _buildTargetItem('Protein', '${plan.dailyProteinG}', 'g', Colors.red),
              _buildTargetItem('Carbs', '${plan.dailyCarbsG}', 'g', Colors.blue),
              _buildTargetItem('Fat', '${plan.dailyFatG}', 'g', Colors.yellow),
            ],
          ),
          // Cheat days indicator
          if (plan.cheatDays.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.amber.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.celebration, color: Colors.amber, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Cheat Days: ${plan.cheatDays.length}',
                      style: const TextStyle(color: Colors.amber, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDaySelector(DietPlanModel plan) {
    final totalDays = plan.daysCount;
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F26),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Select Day',
                  style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Day $_selectedDay of $totalDays',
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: totalDays,
              itemBuilder: (context, index) {
                final dayNum = index + 1;
                final date = plan.startDate.add(Duration(days: index));
                final isSelected = dayNum == _selectedDay;
                final isCheatDay = plan.isCheatDay(date);
                final isToday = DateUtils.isSameDay(date, DateTime.now());
                
                return GestureDetector(
                  onTap: () => setState(() => _selectedDay = dayNum),
                  child: Container(
                    width: 55,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? Colors.green 
                          : isCheatDay 
                              ? Colors.amber.withOpacity(0.2) 
                              : Colors.black26,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isToday ? Colors.white : Colors.transparent,
                        width: isToday ? 2 : 0,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          DateFormat('EEE').format(date),
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.white60,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${date.day}',
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (isCheatDay)
                          const Icon(Icons.celebration, color: Colors.amber, size: 12),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDaySchedule(DietPlanModel plan) {
    final dayMeals = plan.getMealsForDay(_selectedDay);
    final date = plan.startDate.add(Duration(days: _selectedDay - 1));
    final isCheatDay = plan.isCheatDay(date);
    final dayTotals = plan.getDayTotals(_selectedDay);
    
    // Define all meal slots
    final mealSlots = [
      {'type': 'breakfast', 'label': 'Breakfast', 'time': '08:00', 'icon': Icons.free_breakfast, 'color': Colors.orange},
      {'type': 'morning_snack', 'label': 'Morning Snack', 'time': '10:30', 'icon': Icons.apple, 'color': Colors.green},
      {'type': 'lunch', 'label': 'Lunch', 'time': '13:00', 'icon': Icons.lunch_dining, 'color': Colors.blue},
      {'type': 'afternoon_snack', 'label': 'Afternoon Snack', 'time': '16:00', 'icon': Icons.cookie, 'color': Colors.purple},
      {'type': 'dinner', 'label': 'Dinner', 'time': '19:00', 'icon': Icons.dinner_dining, 'color': Colors.red},
      {'type': 'evening_snack', 'label': 'Evening Snack', 'time': '21:00', 'icon': Icons.nightlight, 'color': Colors.indigo},
    ];

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F26),
        borderRadius: BorderRadius.circular(16),
        border: isCheatDay ? Border.all(color: Colors.amber.withOpacity(0.5)) : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Day Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isCheatDay ? Colors.amber.withOpacity(0.1) : Colors.black26,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Icon(
                  isCheatDay ? Icons.celebration : Icons.calendar_today,
                  color: isCheatDay ? Colors.amber : Colors.green,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    DateFormat('EEEE, MMMM d').format(date),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
                if (isCheatDay)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'CHEAT DAY',
                      style: TextStyle(color: Colors.amber, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
              ],
            ),
          ),
          
          // Day Totals
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildMiniStat('${dayTotals['calories']?.toInt() ?? 0}', 'kcal', Colors.orange),
                _buildMiniStat('${dayTotals['protein']?.toStringAsFixed(0) ?? 0}g', 'Protein', Colors.red),
                _buildMiniStat('${dayTotals['carbs']?.toStringAsFixed(0) ?? 0}g', 'Carbs', Colors.blue),
                _buildMiniStat('${dayTotals['fat']?.toStringAsFixed(0) ?? 0}g', 'Fat', Colors.yellow),
              ],
            ),
          ),
          
          const Divider(color: Colors.white12, height: 1),
          
          // Meal Slots
          ...mealSlots.map((slot) {
            final meal = dayMeals.firstWhere(
              (m) => m.mealType == slot['type'],
              orElse: () => DietPlanMealModel(
                id: '',
                dietPlanId: plan.id,
                mealType: slot['type'] as String,
                name: slot['label'] as String,
                scheduledTime: slot['time'] as String,
                dayNumber: _selectedDay,
                totalCalories: 0,
                totalProteinG: 0,
                totalCarbsG: 0,
                totalFatG: 0,
                items: [],
              ),
            );
            
            return _buildMealSlot(plan, meal, slot, date);
          }),
          
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildMealSlot(DietPlanModel plan, DietPlanMealModel meal, Map<String, dynamic> slot, DateTime date) {
    final hasItems = meal.items.isNotEmpty;
    final commitKey = '${meal.id}_${date.toIso8601String().split('T')[0]}';
    final isCommitted = _commitments[commitKey] ?? false;
    
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16),
        childrenPadding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (slot['color'] as Color).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            slot['icon'] as IconData,
            color: slot['color'] as Color,
            size: 20,
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    slot['label'] as String,
                    style: TextStyle(
                      color: hasItems ? Colors.white : Colors.white54,
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    meal.scheduledTime ?? slot['time'] as String,
                    style: const TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                ],
              ),
            ),
            if (hasItems) ...[
              Text(
                '${meal.totalCalories} kcal',
                style: TextStyle(color: Colors.orange[300], fontWeight: FontWeight.bold, fontSize: 12),
              ),
              const SizedBox(width: 12),
              // Commitment checkbox
              GestureDetector(
                onTap: () => _toggleCommitment(plan, meal, date),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: isCommitted ? Colors.green.withOpacity(0.2) : Colors.white12,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isCommitted ? Colors.green : Colors.white24,
                    ),
                  ),
                  child: Icon(
                    isCommitted ? Icons.check : Icons.circle_outlined,
                    color: isCommitted ? Colors.green : Colors.white54,
                    size: 18,
                  ),
                ),
              ),
            ],
          ],
        ),
        iconColor: Colors.white60,
        collapsedIconColor: Colors.white60,
        children: hasItems 
            ? meal.items.map((item) => _buildMealItem(item)).toList()
            : [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'No items configured for this meal',
                    style: TextStyle(color: Colors.white38, fontSize: 12),
                  ),
                ),
              ],
      ),
    );
  }

  Widget _buildMiniStat(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.white38, fontSize: 10),
        ),
      ],
    );
  }

  Widget _buildPlanCard(BuildContext context, DietPlanModel plan) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPlan = plan;
          _selectedDay = 1;
        });
        _loadCommitments(plan);
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F26),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.restaurant_menu,
                      color: Colors.green,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          plan.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${DateFormat('MMM d').format(plan.startDate)} - ${plan.endDate != null ? DateFormat('MMM d').format(plan.endDate!) : 'Ongoing'}',
                          style: const TextStyle(
                            color: Colors.white60,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      plan.status.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Daily Targets
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildTargetItem('Calories', '${plan.dailyCaloriesTarget}', 'kcal', Colors.orange),
                  _buildTargetItem('Protein', '${plan.dailyProteinG}', 'g', Colors.red),
                  _buildTargetItem('Carbs', '${plan.dailyCarbsG}', 'g', Colors.blue),
                  _buildTargetItem('Fat', '${plan.dailyFatG}', 'g', Colors.yellow),
                ],
              ),
            ),

            const SizedBox(height: 16),
            
            // Tap to view
            const Center(
              child: Text(
                'Tap to view details',
                style: TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ),
            
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildTargetItem(
      String label, String value, String unit, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 10,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                unit,
                style: TextStyle(
                  color: color.withOpacity(0.7),
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMealItem(DietPlanMealItemModel item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                  ),
                ),
                Text(
                  '${item.quantity} ${item.unit}',
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${item.calories} kcal',
                style: TextStyle(
                  color: Colors.orange[300],
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              Text(
                'P:${item.proteinG.toStringAsFixed(0)}g C:${item.carbsG.toStringAsFixed(0)}g F:${item.fatG.toStringAsFixed(0)}g',
                style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 9,
                ),
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
                color: Colors.green.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.restaurant_outlined,
                size: 64,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Diet Plans Yet',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your dietitian will create a personalized diet plan for you after your consultation.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white60,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            const Text(
              'Unable to Load Diet Plans',
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
              onPressed: () {
                ref.read(dietPlansNotifierProvider.notifier).refresh();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
