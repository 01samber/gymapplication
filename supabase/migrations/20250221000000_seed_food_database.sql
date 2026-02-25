-- Seed food database (only if empty)
-- Skips if foods table does not exist (shadow DB)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'foods') THEN
    RETURN;
  END IF;
  IF (SELECT COUNT(*) FROM foods) = 0 THEN
    INSERT INTO foods (name, brand, category, serving_size, serving_unit, calories_per_serving, protein_g, carbs_g, fat_g, fiber_g, is_verified) VALUES
    ('Chicken Breast (Grilled)', NULL, 'protein', 100, 'g', 165, 31, 0, 3.6, 0, true),
    ('Chicken Breast (Roasted)', NULL, 'protein', 100, 'g', 197, 30, 0, 7.7, 0, true),
    ('Turkey Breast', NULL, 'protein', 100, 'g', 135, 30, 0, 0.7, 0, true),
    ('Salmon (Atlantic, Wild)', NULL, 'protein', 100, 'g', 182, 25, 0, 8.1, 0, true),
    ('Greek Yogurt (Plain, Nonfat)', NULL, 'dairy', 170, 'g', 100, 17, 6, 0.7, 0, true),
    ('White Rice (Cooked)', NULL, 'grains', 100, 'g', 130, 2.7, 28, 0.3, 0.4, true),
    ('Brown Rice (Cooked)', NULL, 'grains', 100, 'g', 112, 2.6, 24, 0.9, 1.8, true),
    ('Broccoli (Cooked)', NULL, 'vegetable', 100, 'g', 35, 2.4, 7, 0.4, 3.3, true),
    ('Apple', NULL, 'fruit', 182, 'g', 95, 0.5, 25, 0.3, 4.4, true),
    ('Banana', NULL, 'fruit', 118, 'g', 105, 1.3, 27, 0.4, 3.1, true),
    ('Milk (Whole)', NULL, 'dairy', 240, 'ml', 149, 8, 12, 8, 0, true),
    ('Olive Oil', NULL, 'fats', 14, 'ml', 119, 0, 0, 13.5, 0, true),
    ('Almonds', NULL, 'nuts', 28, 'g', 164, 6, 6, 14, 3.5, true),
    ('Orange Juice (Fresh)', NULL, 'beverage', 240, 'ml', 112, 1.7, 26, 0.5, 0.5, true),
    ('Protein Bar (Average)', NULL, 'snack', 60, 'g', 200, 20, 22, 6, 3, true),
    ('Honey', NULL, 'condiment', 21, 'g', 64, 0.1, 17, 0, 0, true),
    ('Grilled Chicken Salad', NULL, 'prepared', 350, 'g', 350, 35, 15, 18, 5, true);
  END IF;
END $$;
