-- =====================================================
-- INITIAL FOOD DATABASE FOR SWEATBOX GYM
-- Comprehensive list of foods with nutritional values
-- Based on standard nutritional databases
-- =====================================================

-- First, make sure the foods table exists and run DIETITIAN_SCHEMA.sql first
-- This script populates the foods table with initial data

-- =====================================================
-- PROTEINS
-- =====================================================
INSERT INTO foods (name, brand, category, serving_size, serving_unit, calories_per_serving, protein_g, carbs_g, fat_g, fiber_g, is_verified) VALUES
-- Poultry
('Chicken Breast (Grilled)', NULL, 'protein', 100, 'g', 165, 31, 0, 3.6, 0, true),
('Chicken Breast (Roasted)', NULL, 'protein', 100, 'g', 197, 30, 0, 7.7, 0, true),
('Chicken Thigh (Skinless)', NULL, 'protein', 100, 'g', 209, 26, 0, 10.9, 0, true),
('Turkey Breast', NULL, 'protein', 100, 'g', 135, 30, 0, 0.7, 0, true),
('Ground Turkey (93% Lean)', NULL, 'protein', 100, 'g', 170, 21, 0, 9, 0, true),

-- Beef
('Beef Sirloin (Lean)', NULL, 'protein', 100, 'g', 183, 27, 0, 7.6, 0, true),
('Ground Beef (90% Lean)', NULL, 'protein', 100, 'g', 176, 26, 0, 7.5, 0, true),
('Ground Beef (85% Lean)', NULL, 'protein', 100, 'g', 215, 26, 0, 11.8, 0, true),
('Beef Tenderloin', NULL, 'protein', 100, 'g', 218, 26, 0, 12, 0, true),
('Beef Ribeye', NULL, 'protein', 100, 'g', 291, 24, 0, 21, 0, true),

-- Fish & Seafood
('Salmon (Atlantic, Wild)', NULL, 'protein', 100, 'g', 182, 25, 0, 8.1, 0, true),
('Salmon (Atlantic, Farmed)', NULL, 'protein', 100, 'g', 208, 20, 0, 13.4, 0, true),
('Tuna (Fresh)', NULL, 'protein', 100, 'g', 144, 30, 0, 1.6, 0, true),
('Tuna (Canned in Water)', NULL, 'protein', 100, 'g', 116, 26, 0, 0.8, 0, true),
('Tilapia', NULL, 'protein', 100, 'g', 128, 26, 0, 2.7, 0, true),
('Cod', NULL, 'protein', 100, 'g', 82, 18, 0, 0.7, 0, true),
('Shrimp', NULL, 'protein', 100, 'g', 99, 24, 0.2, 0.3, 0, true),
('Lobster', NULL, 'protein', 100, 'g', 89, 19, 0.5, 0.9, 0, true),

-- Eggs & Dairy Protein
('Whole Egg', NULL, 'protein', 50, 'g', 72, 6, 0.4, 5, 0, true),
('Egg White', NULL, 'protein', 33, 'g', 17, 3.6, 0.2, 0.1, 0, true),
('Greek Yogurt (Plain, Nonfat)', NULL, 'dairy', 170, 'g', 100, 17, 6, 0.7, 0, true),
('Greek Yogurt (Plain, Full Fat)', NULL, 'dairy', 170, 'g', 190, 18, 6, 10, 0, true),
('Cottage Cheese (Low Fat)', NULL, 'dairy', 113, 'g', 81, 14, 3, 1.1, 0, true),

-- Plant Proteins
('Tofu (Firm)', NULL, 'protein', 100, 'g', 144, 17, 3, 8, 2, true),
('Tempeh', NULL, 'protein', 100, 'g', 195, 20, 8, 11, 0, true),
('Edamame', NULL, 'protein', 100, 'g', 121, 11, 9, 5, 5, true),
('Lentils (Cooked)', NULL, 'legumes', 100, 'g', 116, 9, 20, 0.4, 8, true),
('Chickpeas (Cooked)', NULL, 'legumes', 100, 'g', 164, 9, 27, 2.6, 8, true),
('Black Beans (Cooked)', NULL, 'legumes', 100, 'g', 132, 9, 24, 0.5, 8, true),

-- =====================================================
-- CARBOHYDRATES
-- =====================================================

-- Grains
('White Rice (Cooked)', NULL, 'grains', 100, 'g', 130, 2.7, 28, 0.3, 0.4, true),
('Brown Rice (Cooked)', NULL, 'grains', 100, 'g', 112, 2.6, 24, 0.9, 1.8, true),
('Quinoa (Cooked)', NULL, 'grains', 100, 'g', 120, 4.4, 21, 1.9, 2.8, true),
('Oatmeal (Cooked)', NULL, 'grains', 100, 'g', 71, 2.5, 12, 1.5, 1.7, true),
('Oats (Dry)', NULL, 'grains', 40, 'g', 152, 5.3, 27, 2.7, 4, true),
('Whole Wheat Bread', NULL, 'grains', 30, 'g', 81, 4, 14, 1.1, 1.9, true),
('White Bread', NULL, 'grains', 30, 'g', 79, 2.7, 15, 1, 0.6, true),
('Pasta (Cooked)', NULL, 'grains', 100, 'g', 131, 5, 25, 1.1, 1.8, true),
('Sweet Potato (Baked)', NULL, 'vegetable', 100, 'g', 90, 2, 21, 0.1, 3.3, true),
('Potato (Baked)', NULL, 'vegetable', 100, 'g', 93, 2.5, 21, 0.1, 2.2, true),
('Couscous (Cooked)', NULL, 'grains', 100, 'g', 112, 3.8, 23, 0.2, 1.4, true),
('Bulgur (Cooked)', NULL, 'grains', 100, 'g', 83, 3.1, 19, 0.2, 4.5, true),

-- Breakfast Cereals
('Corn Flakes', NULL, 'grains', 30, 'g', 113, 2, 25, 0.3, 0.9, true),
('Granola', NULL, 'grains', 50, 'g', 231, 5, 37, 8, 4, true),
('Bran Flakes', NULL, 'grains', 30, 'g', 96, 3, 23, 0.5, 5, true),

-- =====================================================
-- VEGETABLES
-- =====================================================
('Broccoli (Cooked)', NULL, 'vegetable', 100, 'g', 35, 2.4, 7, 0.4, 3.3, true),
('Spinach (Raw)', NULL, 'vegetable', 100, 'g', 23, 2.9, 3.6, 0.4, 2.2, true),
('Spinach (Cooked)', NULL, 'vegetable', 100, 'g', 23, 3, 3.8, 0.3, 2.4, true),
('Kale (Raw)', NULL, 'vegetable', 100, 'g', 49, 4.3, 9, 0.9, 3.6, true),
('Asparagus', NULL, 'vegetable', 100, 'g', 20, 2.2, 3.9, 0.1, 2.1, true),
('Bell Pepper (Red)', NULL, 'vegetable', 100, 'g', 31, 1, 6, 0.3, 2.1, true),
('Cucumber', NULL, 'vegetable', 100, 'g', 16, 0.7, 3.6, 0.1, 0.5, true),
('Tomato', NULL, 'vegetable', 100, 'g', 18, 0.9, 3.9, 0.2, 1.2, true),
('Carrot', NULL, 'vegetable', 100, 'g', 41, 0.9, 10, 0.2, 2.8, true),
('Cauliflower', NULL, 'vegetable', 100, 'g', 25, 1.9, 5, 0.3, 2, true),
('Zucchini', NULL, 'vegetable', 100, 'g', 17, 1.2, 3.1, 0.3, 1, true),
('Green Beans', NULL, 'vegetable', 100, 'g', 31, 1.8, 7, 0.1, 3.4, true),
('Brussels Sprouts', NULL, 'vegetable', 100, 'g', 43, 3.4, 9, 0.3, 3.8, true),
('Mushrooms (White)', NULL, 'vegetable', 100, 'g', 22, 3.1, 3.3, 0.3, 1, true),
('Onion', NULL, 'vegetable', 100, 'g', 40, 1.1, 9.3, 0.1, 1.7, true),
('Lettuce (Romaine)', NULL, 'vegetable', 100, 'g', 17, 1.2, 3.3, 0.3, 2.1, true),
('Cabbage', NULL, 'vegetable', 100, 'g', 25, 1.3, 6, 0.1, 2.5, true),
('Celery', NULL, 'vegetable', 100, 'g', 16, 0.7, 3, 0.2, 1.6, true),
('Eggplant', NULL, 'vegetable', 100, 'g', 25, 1, 6, 0.2, 3, true),

-- =====================================================
-- FRUITS
-- =====================================================
('Apple', NULL, 'fruit', 182, 'g', 95, 0.5, 25, 0.3, 4.4, true),
('Banana', NULL, 'fruit', 118, 'g', 105, 1.3, 27, 0.4, 3.1, true),
('Orange', NULL, 'fruit', 131, 'g', 62, 1.2, 15, 0.2, 3.1, true),
('Strawberries', NULL, 'fruit', 100, 'g', 32, 0.7, 7.7, 0.3, 2, true),
('Blueberries', NULL, 'fruit', 100, 'g', 57, 0.7, 14, 0.3, 2.4, true),
('Grapes', NULL, 'fruit', 100, 'g', 69, 0.7, 18, 0.2, 0.9, true),
('Watermelon', NULL, 'fruit', 100, 'g', 30, 0.6, 7.6, 0.2, 0.4, true),
('Mango', NULL, 'fruit', 100, 'g', 60, 0.8, 15, 0.4, 1.6, true),
('Pineapple', NULL, 'fruit', 100, 'g', 50, 0.5, 13, 0.1, 1.4, true),
('Avocado', NULL, 'fruit', 100, 'g', 160, 2, 9, 15, 7, true),
('Kiwi', NULL, 'fruit', 100, 'g', 61, 1.1, 15, 0.5, 3, true),
('Peach', NULL, 'fruit', 100, 'g', 39, 0.9, 10, 0.3, 1.5, true),
('Pear', NULL, 'fruit', 100, 'g', 57, 0.4, 15, 0.1, 3.1, true),
('Grapefruit', NULL, 'fruit', 100, 'g', 42, 0.8, 11, 0.1, 1.6, true),
('Raspberries', NULL, 'fruit', 100, 'g', 52, 1.2, 12, 0.7, 6.5, true),
('Cantaloupe', NULL, 'fruit', 100, 'g', 34, 0.8, 8, 0.2, 0.9, true),

-- =====================================================
-- DAIRY
-- =====================================================
('Milk (Whole)', NULL, 'dairy', 240, 'ml', 149, 8, 12, 8, 0, true),
('Milk (2%)', NULL, 'dairy', 240, 'ml', 122, 8, 12, 5, 0, true),
('Milk (Skim)', NULL, 'dairy', 240, 'ml', 83, 8, 12, 0.2, 0, true),
('Cheddar Cheese', NULL, 'dairy', 28, 'g', 113, 7, 0.4, 9, 0, true),
('Mozzarella (Part Skim)', NULL, 'dairy', 28, 'g', 72, 7, 0.8, 4.5, 0, true),
('Parmesan Cheese', NULL, 'dairy', 28, 'g', 111, 10, 0.9, 7, 0, true),
('Feta Cheese', NULL, 'dairy', 28, 'g', 75, 4, 1.1, 6, 0, true),
('Swiss Cheese', NULL, 'dairy', 28, 'g', 108, 8, 1.5, 8, 0, true),
('Butter', NULL, 'dairy', 14, 'g', 102, 0.1, 0, 11.5, 0, true),
('Cream Cheese', NULL, 'dairy', 28, 'g', 99, 2, 1, 10, 0, true),
('Sour Cream', NULL, 'dairy', 30, 'g', 60, 0.7, 1.2, 6, 0, true),

-- =====================================================
-- FATS & OILS
-- =====================================================
('Olive Oil', NULL, 'fats', 14, 'ml', 119, 0, 0, 13.5, 0, true),
('Coconut Oil', NULL, 'fats', 14, 'ml', 121, 0, 0, 13.5, 0, true),
('Avocado Oil', NULL, 'fats', 14, 'ml', 124, 0, 0, 14, 0, true),
('Almonds', NULL, 'nuts', 28, 'g', 164, 6, 6, 14, 3.5, true),
('Walnuts', NULL, 'nuts', 28, 'g', 185, 4, 4, 18, 2, true),
('Cashews', NULL, 'nuts', 28, 'g', 157, 5, 9, 12, 0.9, true),
('Peanuts', NULL, 'nuts', 28, 'g', 161, 7, 5, 14, 2.4, true),
('Peanut Butter', NULL, 'nuts', 32, 'g', 190, 8, 6, 16, 2, true),
('Almond Butter', NULL, 'nuts', 32, 'g', 196, 7, 6, 18, 3.3, true),
('Sunflower Seeds', NULL, 'nuts', 28, 'g', 163, 5, 7, 14, 2.4, true),
('Chia Seeds', NULL, 'nuts', 28, 'g', 137, 4, 12, 9, 10, true),
('Flax Seeds', NULL, 'nuts', 28, 'g', 150, 5, 8, 12, 8, true),
('Macadamia Nuts', NULL, 'nuts', 28, 'g', 204, 2, 4, 21, 2.4, true),
('Pistachios', NULL, 'nuts', 28, 'g', 159, 6, 8, 13, 3, true),
('Brazil Nuts', NULL, 'nuts', 28, 'g', 186, 4, 3, 19, 2.1, true),

-- =====================================================
-- BEVERAGES
-- =====================================================
('Orange Juice (Fresh)', NULL, 'beverage', 240, 'ml', 112, 1.7, 26, 0.5, 0.5, true),
('Apple Juice', NULL, 'beverage', 240, 'ml', 114, 0.2, 28, 0.3, 0.2, true),
('Coconut Water', NULL, 'beverage', 240, 'ml', 46, 1.7, 9, 0.5, 2.6, true),
('Almond Milk (Unsweetened)', NULL, 'beverage', 240, 'ml', 30, 1, 1, 2.5, 0.5, true),
('Oat Milk', NULL, 'beverage', 240, 'ml', 120, 3, 16, 5, 2, true),
('Soy Milk (Unsweetened)', NULL, 'beverage', 240, 'ml', 80, 7, 4, 4, 1, true),
('Protein Shake (Whey)', NULL, 'beverage', 300, 'ml', 120, 24, 3, 1, 0, true),

-- =====================================================
-- SNACKS & TREATS (For Logging Purposes)
-- =====================================================
('Dark Chocolate (70%)', NULL, 'snack', 28, 'g', 170, 2, 13, 12, 3, true),
('Milk Chocolate', NULL, 'snack', 28, 'g', 153, 2, 17, 9, 1, true),
('Protein Bar (Average)', NULL, 'snack', 60, 'g', 200, 20, 22, 6, 3, true),
('Granola Bar', NULL, 'snack', 35, 'g', 140, 2, 25, 4, 1, true),
('Rice Cakes', NULL, 'snack', 9, 'g', 35, 0.7, 7, 0.3, 0.4, true),
('Popcorn (Air-Popped)', NULL, 'snack', 30, 'g', 120, 4, 24, 1.2, 4.5, true),
('Hummus', NULL, 'snack', 30, 'g', 54, 2, 5, 3, 1, true),
('Trail Mix', NULL, 'snack', 40, 'g', 200, 6, 17, 13, 2, true),

-- =====================================================
-- CONDIMENTS & SAUCES
-- =====================================================
('Honey', NULL, 'condiment', 21, 'g', 64, 0.1, 17, 0, 0, true),
('Maple Syrup', NULL, 'condiment', 20, 'g', 52, 0, 13, 0, 0, true),
('Ketchup', NULL, 'condiment', 17, 'g', 19, 0.2, 4.8, 0, 0.1, true),
('Mustard', NULL, 'condiment', 5, 'g', 3, 0.2, 0.3, 0.2, 0.2, true),
('Mayonnaise', NULL, 'condiment', 14, 'g', 94, 0.1, 0.1, 10, 0, true),
('Soy Sauce', NULL, 'condiment', 16, 'g', 9, 1.3, 0.8, 0, 0.1, true),
('Balsamic Vinegar', NULL, 'condiment', 16, 'g', 14, 0.1, 2.7, 0, 0, true),
('Salsa', NULL, 'condiment', 30, 'g', 10, 0.5, 2, 0, 0.5, true),
('Guacamole', NULL, 'condiment', 30, 'g', 50, 0.6, 3, 4, 2, true),
('Tahini', NULL, 'condiment', 15, 'g', 89, 2.6, 3, 8, 1.4, true),

-- =====================================================
-- PREPARED/COMMON MEALS
-- =====================================================
('Grilled Chicken Salad', NULL, 'prepared', 350, 'g', 350, 35, 15, 18, 5, true),
('Caesar Salad (with Chicken)', NULL, 'prepared', 300, 'g', 420, 28, 18, 28, 4, true),
('Chicken Rice Bowl', NULL, 'prepared', 400, 'g', 480, 35, 55, 12, 3, true),
('Beef Stir Fry', NULL, 'prepared', 350, 'g', 400, 30, 25, 20, 4, true),
('Salmon with Vegetables', NULL, 'prepared', 350, 'g', 380, 32, 15, 22, 5, true),
('Turkey Sandwich', NULL, 'prepared', 250, 'g', 350, 25, 35, 12, 3, true),
('Tuna Salad Sandwich', NULL, 'prepared', 250, 'g', 400, 20, 38, 18, 2, true),
('Vegetable Soup', NULL, 'prepared', 250, 'ml', 80, 3, 15, 1, 3, true),
('Chicken Soup', NULL, 'prepared', 250, 'ml', 150, 12, 12, 6, 1, true),
('Overnight Oats', NULL, 'prepared', 250, 'g', 350, 12, 50, 10, 6, true),
('Smoothie Bowl (Fruit)', NULL, 'prepared', 300, 'g', 280, 8, 55, 5, 8, true),
('Protein Smoothie', NULL, 'prepared', 400, 'ml', 250, 25, 30, 5, 4, true),
('Veggie Omelet', NULL, 'prepared', 200, 'g', 250, 18, 5, 18, 2, true),
('Avocado Toast', NULL, 'prepared', 150, 'g', 280, 8, 25, 18, 7, true)
ON CONFLICT (id) DO NOTHING;

-- Add comment to indicate database seeding
COMMENT ON TABLE foods IS 'Food database with nutritional information. Initially seeded with common foods for gym and fitness tracking.';
