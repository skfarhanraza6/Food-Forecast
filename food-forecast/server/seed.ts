import bcrypt from 'bcryptjs';
import { getDb, run, query } from './db.ts';
import { initSchema } from './schema.ts';
import { calculateBuffer, calculateConsumptionMetrics, calculateImpact } from './calculations.ts';

export async function seedDatabase(force: boolean = false): Promise<void> {
  await initSchema();

  // Check if users already exist
  const existingUsers = query<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (!force && existingUsers[0]?.count > 0) {
    // Ensure the canonical users exist with proper bcrypt hashes
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@123', salt);
    const staffHash = bcrypt.hashSync('Chef@123', salt);
    const studentHash = bcrypt.hashSync('Student@123', salt);

    run(`
      INSERT OR REPLACE INTO users (name, email, password_hash, role, hostel)
      VALUES (?, ?, ?, ?, ?)
    `, ['Dr. Rajesh Sharma', 'admin@campus.edu', adminHash, 'ADMIN', 'Central Administration']);

    run(`
      INSERT OR REPLACE INTO users (name, email, password_hash, role, hostel)
      VALUES (?, ?, ?, ?, ?)
    `, ['Chef Ramesh Kumar', 'chef.ramesh@campus.edu', staffHash, 'STAFF', 'Mess Kitchen Hall A']);

    run(`
      INSERT OR REPLACE INTO users (name, email, password_hash, role, hostel)
      VALUES (?, ?, ?, ?, ?)
    `, ['Aarav Patel', 'aarav.patel@campus.edu', studentHash, 'STUDENT', 'Hostel Block 3']);

    console.log('Verified canonical demo users in database.');
    return;
  }

  console.log('Seeding database with demo users, meals, predictions, consumption, and sustainability metrics...');

  // 1. Create Users
  const salt = bcrypt.genSaltSync(10);
  const studentHash = bcrypt.hashSync('Student@123', salt);
  const staffHash = bcrypt.hashSync('Chef@123', salt);
  const adminHash = bcrypt.hashSync('Admin@123', salt);

  const adminResult = run(`
    INSERT INTO users (name, email, password_hash, role, hostel)
    VALUES (?, ?, ?, ?, ?)
  `, ['Dr. Rajesh Sharma', 'admin@campus.edu', adminHash, 'ADMIN', 'Central Administration']);
  const adminId = adminResult.lastInsertRowid;

  const staffResult = run(`
    INSERT INTO users (name, email, password_hash, role, hostel)
    VALUES (?, ?, ?, ?, ?)
  `, ['Chef Ramesh Kumar', 'chef.ramesh@campus.edu', staffHash, 'STAFF', 'Mess Kitchen Hall A']);
  const staffId = staffResult.lastInsertRowid;

  const studentResult = run(`
    INSERT INTO users (name, email, password_hash, role, hostel)
    VALUES (?, ?, ?, ?, ?)
  `, ['Aarav Patel', 'aarav.patel@campus.edu', studentHash, 'STUDENT', 'Hostel Block 3']);
  const studentId = studentResult.lastInsertRowid;

  // Additional students for intentions & feedback
  const s2 = run(`INSERT INTO users (name, email, password_hash, role, hostel) VALUES (?, ?, ?, ?, ?)`,
    ['Priya Sharma', 'priya@mess.edu', studentHash, 'STUDENT', 'Hostel Block 2']).lastInsertRowid;
  const s3 = run(`INSERT INTO users (name, email, password_hash, role, hostel) VALUES (?, ?, ?, ?, ?)`,
    ['Rohan Verma', 'rohan@mess.edu', studentHash, 'STUDENT', 'Hostel Block 4']).lastInsertRowid;

  // 2. Create Buffer Configurations
  const configs = [
    { mealType: 'Breakfast', base: 5.0, min: 3.0, max: 12.0 },
    { mealType: 'Lunch', base: 5.0, min: 3.0, max: 15.0 },
    { mealType: 'Snacks', base: 6.0, min: 4.0, max: 15.0 },
    { mealType: 'Dinner', base: 5.0, min: 3.0, max: 15.0 },
    { mealType: 'default', base: 5.0, min: 3.0, max: 15.0 },
  ];

  for (const cfg of configs) {
    run(`
      INSERT INTO buffer_configurations (meal_type, base_buffer_percent, min_buffer_percent, max_buffer_percent, auto_adjust_enabled, updated_by)
      VALUES (?, ?, ?, ?, 1, ?)
    `, [cfg.mealType, cfg.base, cfg.min, cfg.max, adminId]);
  }

  // 3. Historical Meals Data (past 7 days + today + tomorrow)
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const historicalScenarios = [
    // 6 days ago
    { daysAgo: 6, mealType: 'Lunch', menu: 'Rajma Chawal, Roti, Cucumber Salad, Boondi Raita', expected: 410, predicted: 395, bufferPct: 5.0, actualPrep: 415, actualCons: 405, status: 'BUFFER_USED' as const, wasteMeals: 10, wasteReason: 'Normal plate scrap & minor surplus' },
    { daysAgo: 6, mealType: 'Dinner', menu: 'Paneer Butter Masala, Dal Makhani, Jeera Rice, Gulab Jamun', expected: 440, predicted: 430, bufferPct: 5.0, actualPrep: 452, actualCons: 428, status: 'SAFE' as const, wasteMeals: 24, wasteReason: 'Slightly high preparation' },
    // 5 days ago
    { daysAgo: 5, mealType: 'Breakfast', menu: 'Idli Sambar, Coconut Chutney, Masala Chai', expected: 350, predicted: 340, bufferPct: 5.0, actualPrep: 357, actualCons: 342, status: 'SAFE' as const, wasteMeals: 15, wasteReason: 'Morning class attendance drop' },
    { daysAgo: 5, mealType: 'Lunch', menu: 'Chole Bhature, Pulao, Curd, Onion Pickle', expected: 420, predicted: 415, bufferPct: 5.0, actualPrep: 436, actualCons: 430, status: 'BUFFER_USED' as const, wasteMeals: 6, wasteReason: 'Popular menu item, high consumption' },
    { daysAgo: 5, mealType: 'Dinner', menu: 'Mix Veg Curry, Dal Tadka, Phulka, Moong Dal Halwa', expected: 430, predicted: 420, bufferPct: 5.0, actualPrep: 441, actualCons: 418, status: 'SAFE' as const, wasteMeals: 23, wasteReason: 'Standard surplus' },
    // 4 days ago
    { daysAgo: 4, mealType: 'Lunch', menu: 'Kadhi Pakora, Steamed Rice, Aloo Gobhi, Papad', expected: 400, predicted: 390, bufferPct: 5.0, actualPrep: 410, actualCons: 402, status: 'BUFFER_USED' as const, wasteMeals: 8, wasteReason: 'Buffer absorbed extra 12 students' },
    { daysAgo: 4, mealType: 'Dinner', menu: 'Egg Curry / Paneer Bhurji, Butter Roti, Dal Fry', expected: 450, predicted: 440, bufferPct: 6.0, actualPrep: 466, actualCons: 455, status: 'BUFFER_USED' as const, wasteMeals: 11, wasteReason: 'Evening sports turnout' },
    // 3 days ago - DEMO SHORTAGE SCENARIO (Demand exceeded planned quantity!)
    { daysAgo: 3, mealType: 'Dinner', menu: 'Biryani Special, Veg Raita, Mirchi Ka Salan, Sevaiyan', expected: 400, predicted: 400, bufferPct: 5.0, actualPrep: 420, actualCons: 445, status: 'SHORTAGE_RISK' as const, wasteMeals: 0, wasteReason: 'Unexpected event turnout - demand exceeded planned quantity by 25 meals' },
    // 2 days ago
    { daysAgo: 2, mealType: 'Lunch', menu: 'Matar Paneer, Dal Palak, Jeera Rice, Chapati, Salad', expected: 420, predicted: 410, bufferPct: 5.0, actualPrep: 431, actualCons: 412, status: 'SAFE' as const, wasteMeals: 19, wasteReason: 'Minor surplus composted' },
    { daysAgo: 2, mealType: 'Dinner', menu: 'Dal Makhani, Bhindi Masala, Tandoori Roti, Rice Kheer', expected: 430, predicted: 425, bufferPct: 5.0, actualPrep: 446, actualCons: 426, status: 'SAFE' as const, wasteMeals: 20, wasteReason: 'Normal surplus' },
    // 1 day ago - PERFECT BUFFER UTILIZATION SCENARIO (400 predicted, +20 buffer = 420 prep, 410 students arrived)
    { daysAgo: 1, mealType: 'Lunch', menu: 'Shahi Paneer, Dal Maharani, Basmati Pulao, Butter Naan, Sweet Lassi', expected: 400, predicted: 400, bufferPct: 5.0, actualPrep: 420, actualCons: 410, status: 'BUFFER_USED' as const, wasteMeals: 10, wasteReason: 'Controlled safe surplus; 10 meals sent to night shelter' },
    { daysAgo: 1, mealType: 'Dinner', menu: 'Aloo Methi, Yellow Dal Tadka, Phulka, Rice, Fruit Custard', expected: 420, predicted: 415, bufferPct: 5.0, actualPrep: 436, actualCons: 419, status: 'SAFE' as const, wasteMeals: 17, wasteReason: 'Surplus preserved in chillers' },
    // Today's Breakfast (Completed)
    { daysAgo: 0, mealType: 'Breakfast', menu: 'Poha with Peanuts, Sev, Sprouts, Boiled Eggs, Tea/Coffee', expected: 360, predicted: 350, bufferPct: 5.0, actualPrep: 368, actualCons: 355, status: 'BUFFER_USED' as const, wasteMeals: 13, wasteReason: 'Controlled surplus' },
  ];

  for (const s of historicalScenarios) {
    const d = new Date(today);
    d.setDate(today.getDate() - s.daysAgo);
    const dateStr = formatDate(d);

    const mealRes = run(`
      INSERT INTO meals (date, meal_type, menu, expected_attendance, cost_per_meal, status, created_by)
      VALUES (?, ?, ?, ?, 45.0, 'COMPLETED', ?)
    `, [dateStr, s.mealType, s.menu, s.expected, staffId]);
    const mealId = mealRes.lastInsertRowid;

    const bufferCalc = calculateBuffer({ predictedDemand: s.predicted, bufferPercent: s.bufferPct });

    run(`
      INSERT INTO meal_predictions (meal_id, predicted_demand, recommended_buffer_percent, buffer_amount, recommended_preparation, confidence_score, reasoning)
      VALUES (?, ?, ?, ?, ?, 0.92, ?)
    `, [
      mealId,
      bufferCalc.predictedDemand,
      bufferCalc.bufferPercent,
      bufferCalc.bufferAmount,
      bufferCalc.recommendedPreparation,
      `Calculated for ${s.mealType} with dynamic ${bufferCalc.bufferPercent}% safety buffer (+${bufferCalc.bufferAmount} meals).`,
    ]);

    const consMetrics = calculateConsumptionMetrics({
      predictedDemand: s.predicted,
      bufferAmount: bufferCalc.bufferAmount,
      actualPreparation: s.actualPrep,
      actualConsumption: s.actualCons,
    });

    run(`
      INSERT INTO consumption (meal_id, actual_preparation, actual_consumption, surplus, shortage, buffer_utilized, buffer_depleted, status, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mealId,
      s.actualPrep,
      s.actualCons,
      consMetrics.surplus,
      consMetrics.shortage,
      consMetrics.bufferUtilized,
      consMetrics.bufferDepleted ? 1 : 0,
      s.status || consMetrics.status,
      staffId,
    ]);

    run(`
      INSERT INTO waste_records (meal_id, leftover_meals, leftover_weight_kg, waste_reason, action_taken, avoidable_waste_percent)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      mealId,
      s.wasteMeals,
      Number((s.wasteMeals * 0.4).toFixed(2)),
      s.wasteReason,
      s.wasteMeals > 15 ? 'Bio-gas Composting' : 'Food Bank Donation',
      s.status === 'SHORTAGE_RISK' ? 0 : 4.5,
    ]);

    const impact = calculateImpact({
      surplus: s.wasteMeals,
      actualConsumption: s.actualCons,
      costPerMeal: 45.0,
    });

    run(`
      INSERT INTO impact_records (meal_id, food_saved_kg, meals_saved, cost_saved_inr, co2_avoided_kg, water_avoided_liters)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      mealId,
      impact.foodSavedKg,
      impact.mealsSaved,
      impact.costSavedInr,
      impact.co2AvoidedKg,
      impact.waterAvoidedLiters,
    ]);
  }

  // Today's Live Active Lunch (SERVING) - The Primary Highlight Scenario!
  // Predicted: 400, Buffer: 5% (+20), Prep: 420, Current Consumption: 410, Status: SAFE
  const todayLunchRes = run(`
    INSERT INTO meals (date, meal_type, menu, expected_attendance, cost_per_meal, status, created_by)
    VALUES (?, 'Lunch', 'Paneer Tikka Masala, Dal Makhani, Kashmiri Pulao, Garlic Butter Naan, Gulab Jamun', 400, 50.0, 'SERVING', ?)
  `, [formatDate(today), staffId]);
  const todayLunchId = todayLunchRes.lastInsertRowid;

  run(`
    INSERT INTO meal_predictions (meal_id, predicted_demand, recommended_buffer_percent, buffer_amount, recommended_preparation, confidence_score, reasoning)
    VALUES (?, 400, 5.0, 20, 420, 0.94, 'Model predicted 400 meals. Added 5% safety buffer (+20 meals) based on recent low error rates. Recommended 420 meals.')
  `, [todayLunchId]);

  run(`
    INSERT INTO consumption (meal_id, actual_preparation, actual_consumption, surplus, shortage, buffer_utilized, buffer_depleted, status, recorded_by)
    VALUES (?, 420, 410, 10, 0, 10, 0, 'BUFFER_USED', ?)
  `, [todayLunchId, staffId]);

  run(`
    INSERT INTO waste_records (meal_id, leftover_meals, leftover_weight_kg, waste_reason, action_taken, avoidable_waste_percent)
    VALUES (?, 10, 4.0, '10 buffer meals utilized by surprise students, remaining 10 safe surplus earmarked for community distribution.', 'Community Food Share', 2.4)
  `, [todayLunchId]);

  const lunchImpact = calculateImpact({ surplus: 10, actualConsumption: 410, costPerMeal: 50.0 });
  run(`
    INSERT INTO impact_records (meal_id, food_saved_kg, meals_saved, cost_saved_inr, co2_avoided_kg, water_avoided_liters)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [todayLunchId, lunchImpact.foodSavedKg, lunchImpact.mealsSaved, lunchImpact.costSavedInr, lunchImpact.co2AvoidedKg, lunchImpact.waterAvoidedLiters]);

  // Today's Upcoming Dinner (PLANNED)
  const todayDinnerRes = run(`
    INSERT INTO meals (date, meal_type, menu, expected_attendance, cost_per_meal, status, created_by)
    VALUES (?, 'Dinner', 'Dum Aloo Kashmiri, Dal Tadka, Steamed Rice, Tawa Roti, Fruit Salad', 420, 45.0, 'PLANNED', ?)
  `, [formatDate(today), staffId]);
  const todayDinnerId = todayDinnerRes.lastInsertRowid;

  run(`
    INSERT INTO meal_predictions (meal_id, predicted_demand, recommended_buffer_percent, buffer_amount, recommended_preparation, confidence_score, reasoning)
    VALUES (?, 415, 6.0, 25, 440, 0.91, 'Dinner forecast with 6% buffer (+25 meals) accommodating evening study library rush.')
  `, [todayDinnerId]);

  // Tomorrow's Lunch (PLANNED)
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowLunchRes = run(`
    INSERT INTO meals (date, meal_type, menu, expected_attendance, cost_per_meal, status, created_by)
    VALUES (?, 'Lunch', 'Malai Kofta, Chana Dal, Jeera Rice, Missi Roti, Rasgulla', 410, 48.0, 'PLANNED', ?)
  `, [formatDate(tomorrow), staffId]);
  const tomorrowLunchId = tomorrowLunchRes.lastInsertRowid;

  run(`
    INSERT INTO meal_predictions (meal_id, predicted_demand, recommended_buffer_percent, buffer_amount, recommended_preparation, confidence_score, reasoning)
    VALUES (?, 405, 5.0, 20, 425, 0.89, 'Mid-week lunch pattern forecast. Standard 5% buffer recommended.')
  `, [tomorrowLunchId]);

  // Seed Student Intentions for Today's Dinner & Tomorrow's Lunch
  run(`INSERT INTO student_meal_intentions (meal_id, user_id, attending, diet_preference) VALUES (?, ?, 1, 'REGULAR')`, [todayDinnerId, studentId]);
  run(`INSERT INTO student_meal_intentions (meal_id, user_id, attending, diet_preference) VALUES (?, ?, 1, 'VEGAN')`, [todayDinnerId, s2]);
  run(`INSERT INTO student_meal_intentions (meal_id, user_id, attending, diet_preference) VALUES (?, ?, 0, 'JAIN')`, [todayDinnerId, s3]);
  run(`INSERT INTO student_meal_intentions (meal_id, user_id, attending, diet_preference) VALUES (?, ?, 1, 'REGULAR')`, [tomorrowLunchId, studentId]);

  // Seed Student Feedback
  run(`
    INSERT INTO feedback (meal_id, user_id, rating, taste_rating, portion_rating, comments, would_eat_again)
    VALUES (?, ?, 5, 5, 5, 'The Paneer Tikka Masala and Garlic Naan were exceptionally fresh! Zero food wasted at our table.', 1)
  `, [todayLunchId, studentId]);

  run(`
    INSERT INTO feedback (meal_id, user_id, rating, taste_rating, portion_rating, comments, would_eat_again)
    VALUES (?, ?, 4, 4, 5, 'Great portion control, rice was cooked to perfection. Thank you for cutting mess waste.', 1)
  `, [todayLunchId, s2]);

  console.log('Database successfully seeded with realistic scenarios and demo credentials!');
}
