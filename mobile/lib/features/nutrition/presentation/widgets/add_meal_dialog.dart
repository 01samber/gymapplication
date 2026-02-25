import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/nutrition_provider.dart';
import '../../models/nutrition_models.dart';

class AddMealDialog extends ConsumerStatefulWidget {
  final String? initialMealType;
  final VoidCallback onMealAdded;

  const AddMealDialog({
    super.key,
    this.initialMealType,
    required this.onMealAdded,
  });

  @override
  ConsumerState<AddMealDialog> createState() => _AddMealDialogState();
}

class _AddMealDialogState extends ConsumerState<AddMealDialog> {
  late String _selectedMealType;
  final _searchController = TextEditingController();
  final _notesController = TextEditingController();
  final List<_MealItem> _items = [];
  bool _isLoading = false;
  bool _isSearching = false;
  List<FoodModel> _searchResults = [];

  final _mealTypes = [
    ('breakfast', 'Breakfast'),
    ('morning_snack', 'Morning Snack'),
    ('lunch', 'Lunch'),
    ('afternoon_snack', 'Afternoon Snack'),
    ('dinner', 'Dinner'),
    ('evening_snack', 'Evening Snack'),
  ];

  @override
  void initState() {
    super.initState();
    _selectedMealType = widget.initialMealType ?? 'breakfast';
  }

  @override
  void dispose() {
    _searchController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _searchFoods(String query) async {
    if (query.length < 2) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);

    try {
      final service = ref.read(nutritionServiceProvider);
      final results = await service.searchFoods(query);
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (e) {
      setState(() => _isSearching = false);
    }
  }

  void _addFoodItem(FoodModel food) {
    setState(() {
      _items.add(_MealItem(
        food: food,
        quantity: 1,
        unit: food.servingUnit,
      ));
      _searchController.clear();
      _searchResults = [];
    });
  }

  void _addCustomItem() {
    final customName = _searchController.text.trim();
    if (customName.isEmpty) return;

    showDialog(
      context: context,
      builder: (context) => _CustomFoodDialog(
        foodName: customName,
        onAdd: (item) {
          setState(() {
            _items.add(item);
            _searchController.clear();
            _searchResults = [];
          });
        },
      ),
    );
  }

  void _removeItem(int index) {
    setState(() {
      _items.removeAt(index);
    });
  }

  void _updateQuantity(int index, double quantity) {
    setState(() {
      _items[index] = _items[index].copyWith(quantity: quantity);
    });
  }

  Future<void> _submitMeal() async {
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one food item')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final notifier = ref.read(mealLogsNotifierProvider.notifier);
      await notifier.logMeal(
        mealType: _selectedMealType,
        items: _items.map((item) => item.toJson()).toList(),
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
      );
      widget.onMealAdded();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Meal logged successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to log meal: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  int get _totalCalories {
    return _items.fold<int>(0, (sum, item) {
      final cals = item.food?.caloriesPerServing ?? item.customCalories ?? 0;
      return sum + (cals * item.quantity).round();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1F26),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white30,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Log Meal',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Meal type selector
                  const Text(
                    'Meal Type',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _mealTypes.map((type) {
                      final isSelected = _selectedMealType == type.$1;
                      return ChoiceChip(
                        label: Text(type.$2),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedMealType = type.$1);
                          }
                        },
                        backgroundColor: const Color(0xFF0D1117),
                        selectedColor: Colors.orange,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : Colors.white70,
                          fontSize: 12,
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 20),

                  // Food search
                  const Text(
                    'Search Food',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _searchController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search foods or enter custom...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      prefixIcon:
                          const Icon(Icons.search, color: Colors.white54),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.add, color: Colors.orange),
                              onPressed: _addCustomItem,
                              tooltip: 'Add custom food',
                            )
                          : null,
                      filled: true,
                      fillColor: const Color(0xFF0D1117),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onChanged: (value) {
                      _searchFoods(value);
                    },
                  ),

                  // Search results
                  if (_isSearching)
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(
                        child: CircularProgressIndicator(color: Colors.orange),
                      ),
                    )
                  else if (_searchResults.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      constraints: const BoxConstraints(maxHeight: 200),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D1117),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _searchResults.length,
                        itemBuilder: (context, index) {
                          final food = _searchResults[index];
                          return ListTile(
                            title: Text(
                              food.name,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 14),
                            ),
                            subtitle: Text(
                              '${food.caloriesPerServing.toStringAsFixed(0)} kcal per ${food.servingSize} ${food.servingUnit}',
                              style: const TextStyle(
                                  color: Colors.white54, fontSize: 11),
                            ),
                            trailing:
                                const Icon(Icons.add, color: Colors.orange),
                            onTap: () => _addFoodItem(food),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 20),

                  // Added items
                  if (_items.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Added Items',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        Text(
                          'Total: $_totalCalories kcal',
                          style: const TextStyle(
                            color: Colors.orange,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...List.generate(_items.length, (index) {
                      final item = _items[index];
                      final cals = item.food?.caloriesPerServing ??
                          item.customCalories ??
                          0;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0D1117),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.food?.name ??
                                        item.customName ??
                                        'Unknown',
                                    style: const TextStyle(
                                        color: Colors.white, fontSize: 14),
                                  ),
                                  Text(
                                    '${(cals * item.quantity).toStringAsFixed(0)} kcal',
                                    style: const TextStyle(
                                        color: Colors.orange, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove,
                                      color: Colors.white54, size: 20),
                                  onPressed: item.quantity > 0.5
                                      ? () => _updateQuantity(
                                          index, item.quantity - 0.5)
                                      : null,
                                ),
                                Text(
                                  '${item.quantity}',
                                  style: const TextStyle(
                                      color: Colors.white, fontSize: 14),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add,
                                      color: Colors.white54, size: 20),
                                  onPressed: () => _updateQuantity(
                                      index, item.quantity + 0.5),
                                ),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline,
                                  color: Colors.red, size: 20),
                              onPressed: () => _removeItem(index),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],

                  const SizedBox(height: 16),

                  // Notes
                  const Text(
                    'Notes (optional)',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesController,
                    style: const TextStyle(color: Colors.white),
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'Add any notes...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      filled: true,
                      fillColor: const Color(0xFF0D1117),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),

          // Submit button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFF1A1F26),
              border: Border(top: BorderSide(color: Colors.white12)),
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitMeal,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Log Meal',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MealItem {
  final FoodModel? food;
  final String? customName;
  final int? customCalories;
  final int? customProtein;
  final int? customCarbs;
  final int? customFat;
  final double quantity;
  final String unit;

  _MealItem({
    this.food,
    this.customName,
    this.customCalories,
    this.customProtein,
    this.customCarbs,
    this.customFat,
    required this.quantity,
    required this.unit,
  });

  _MealItem copyWith({
    FoodModel? food,
    String? customName,
    int? customCalories,
    int? customProtein,
    int? customCarbs,
    int? customFat,
    double? quantity,
    String? unit,
  }) {
    return _MealItem(
      food: food ?? this.food,
      customName: customName ?? this.customName,
      customCalories: customCalories ?? this.customCalories,
      customProtein: customProtein ?? this.customProtein,
      customCarbs: customCarbs ?? this.customCarbs,
      customFat: customFat ?? this.customFat,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
    );
  }

  Map<String, dynamic> toJson() {
    if (food != null) {
      return {
        'food_id': food!.id,
        'quantity': quantity,
        'unit': unit,
      };
    } else {
      return {
        'custom_food_name': customName,
        'quantity': quantity,
        'unit': unit,
        'calories': customCalories,
        'protein_g': customProtein,
        'carbs_g': customCarbs,
        'fat_g': customFat,
      };
    }
  }
}

class _CustomFoodDialog extends StatefulWidget {
  final String foodName;
  final Function(_MealItem) onAdd;

  const _CustomFoodDialog({
    required this.foodName,
    required this.onAdd,
  });

  @override
  State<_CustomFoodDialog> createState() => _CustomFoodDialogState();
}

class _CustomFoodDialogState extends State<_CustomFoodDialog> {
  final _caloriesController = TextEditingController();
  final _proteinController = TextEditingController();
  final _carbsController = TextEditingController();
  final _fatController = TextEditingController();

  @override
  void dispose() {
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF1A1F26),
      title: Text(
        'Add "${widget.foodName}"',
        style: const TextStyle(color: Colors.white),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildTextField(_caloriesController, 'Calories', 'kcal'),
            const SizedBox(height: 12),
            _buildTextField(_proteinController, 'Protein', 'g'),
            const SizedBox(height: 12),
            _buildTextField(_carbsController, 'Carbs', 'g'),
            const SizedBox(height: 12),
            _buildTextField(_fatController, 'Fat', 'g'),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            final calories = int.tryParse(_caloriesController.text) ?? 0;
            final protein = int.tryParse(_proteinController.text) ?? 0;
            final carbs = int.tryParse(_carbsController.text) ?? 0;
            final fat = int.tryParse(_fatController.text) ?? 0;

            widget.onAdd(_MealItem(
              customName: widget.foodName,
              customCalories: calories,
              customProtein: protein,
              customCarbs: carbs,
              customFat: fat,
              quantity: 1,
              unit: 'serving',
            ));
            Navigator.pop(context);
          },
          style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
          child: const Text('Add'),
        ),
      ],
    );
  }

  Widget _buildTextField(
      TextEditingController controller, String label, String suffix) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white54),
        suffixText: suffix,
        suffixStyle: const TextStyle(color: Colors.white38),
        filled: true,
        fillColor: const Color(0xFF0D1117),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
