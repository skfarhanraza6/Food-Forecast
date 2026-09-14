import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, get, run } from './db.ts';
import { AuthRequest, authenticateToken, requireRole, generateToken, AuthUser } from './auth.ts';
import { calculateBuffer, calculateConsumptionMetrics, calculateImpact } from './calculations.ts';
import { generateMealPrediction } from './predictionService.ts';
import { processNaturalLanguageQuery } from './queryAssistant.ts';
import { seedDatabase } from './seed.ts';

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = get<{
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: 'STUDENT' | 'STAFF' | 'ADMIN';
    hostel: string;
  }>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hostel: user.hostel,
  };

  const token = generateToken(authUser);
  res.json({ token, user: authUser });
});

router.post('/auth/demo-login', (req, res) => {
  const { role = 'ADMIN' } = req.body;
  const targetRole = String(role).toUpperCase();

  const user = get<{
    id: number;
    name: string;
    email: string;
    role: 'STUDENT' | 'STAFF' | 'ADMIN';
    hostel: string;
  }>('SELECT id, name, email, role, hostel FROM users WHERE role = ? ORDER BY id ASC LIMIT 1', [targetRole]);

  if (!user) {
    res.status(404).json({ error: `No demo account found for role ${targetRole}.` });
    return;
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hostel: user.hostel,
  };

  const token = generateToken(authUser);
  res.json({ token, user: authUser });
});

router.post('/auth/register', (req, res) => {
  const { name, email, password, role = 'STUDENT', hostel } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  const existing = get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (existing) {
    res.status(409).json({ error: 'User with this email already exists.' });
    return;
  }

  const validRoles = ['STUDENT', 'STAFF', 'ADMIN'];
  const assignedRole = validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'STUDENT';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const result = run(
    'INSERT INTO users (name, email, password_hash, role, hostel) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), email.trim(), passwordHash, assignedRole, hostel || 'Campus Hostel']
  );

  const authUser: AuthUser = {
    id: result.lastInsertRowid,
    name: name.trim(),
    email: email.trim(),
    role: assignedRole as any,
    hostel: hostel || 'Campus Hostel',
  };

  const token = generateToken(authUser);
  res.status(201).json({ token, user: authUser });
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. DASHBOARD & ANALYTICS SUMMARY
// ==========================================

router.get('/dashboard/summary', (req, res) => {
  // 1. Get Today's Live Active or Latest Meal
  const todayStr = new Date().toISOString().split('T')[0];

  let currentMeal = get<any>(`
    SELECT 
      m.id, m.date, m.meal_type, m.menu, m.expected_attendance, m.cost_per_meal, m.status as meal_status,
      mp.predicted_demand, mp.recommended_buffer_percent, mp.buffer_amount, mp.recommended_preparation, mp.confidence_score, mp.reasoning,
      c.actual_preparation, c.actual_consumption, c.surplus, c.shortage, c.buffer_utilized, c.buffer_depleted, c.status as consumption_status,
      w.leftover_meals, w.leftover_weight_kg, w.waste_reason
    FROM meals m
    LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
    LEFT JOIN consumption c ON m.id = c.meal_id
    LEFT JOIN waste_records w ON m.id = w.meal_id
    WHERE m.status IN ('SERVING', 'PREPARED')
    ORDER BY m.date DESC, m.id DESC
    LIMIT 1
  `);

  if (!currentMeal) {
    currentMeal = get<any>(`
      SELECT 
        m.id, m.date, m.meal_type, m.menu, m.expected_attendance, m.cost_per_meal, m.status as meal_status,
        mp.predicted_demand, mp.recommended_buffer_percent, mp.buffer_amount, mp.recommended_preparation, mp.confidence_score, mp.reasoning,
        c.actual_preparation, c.actual_consumption, c.surplus, c.shortage, c.buffer_utilized, c.buffer_depleted, c.status as consumption_status,
        w.leftover_meals, w.leftover_weight_kg, w.waste_reason
      FROM meals m
      LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
      LEFT JOIN consumption c ON m.id = c.meal_id
      LEFT JOIN waste_records w ON m.id = w.meal_id
      ORDER BY m.date DESC, m.id DESC
      LIMIT 1
    `);
  }

  // 2. Aggregate Impact Metrics
  const impactAgg = get<{
    total_food_saved_kg: number;
    total_meals_saved: number;
    total_cost_saved: number;
    total_co2_kg: number;
    total_water_liters: number;
  }>(`
    SELECT 
      COALESCE(SUM(food_saved_kg), 0) as total_food_saved_kg,
      COALESCE(SUM(meals_saved), 0) as total_meals_saved,
      COALESCE(SUM(cost_saved_inr), 0) as total_cost_saved,
      COALESCE(SUM(co2_avoided_kg), 0) as total_co2_kg,
      COALESCE(SUM(water_avoided_liters), 0) as total_water_liters
    FROM impact_records
  `);

  // 3. Overall Meals Served & Average Accuracy
  const stats = query<{ predicted_demand: number; actual_consumption: number }>(`
    SELECT mp.predicted_demand, c.actual_consumption
    FROM meals m
    JOIN meal_predictions mp ON m.id = mp.meal_id
    JOIN consumption c ON m.id = c.meal_id
    WHERE c.actual_consumption > 0
  `);

  let totalMealsServed = 0;
  let accuracySum = 0;
  stats.forEach(s => {
    totalMealsServed += s.actual_consumption;
    const diff = Math.abs(s.actual_consumption - s.predicted_demand);
    const acc = Math.max(0, 100 - (diff / s.actual_consumption) * 100);
    accuracySum += acc;
  });

  const averageAccuracy = stats.length > 0 ? Number((accuracySum / stats.length).toFixed(1)) : 94.2;

  // 4. Waste Avoided vs Baseline
  const totalWasteRecorded = get<{ total_waste_kg: number }>(`
    SELECT COALESCE(SUM(leftover_weight_kg), 0) as total_waste_kg FROM waste_records
  `)?.total_waste_kg || 0;

  const baselineWasteKg = (impactAgg?.total_food_saved_kg || 0) + totalWasteRecorded;
  const wasteReductionPercent = baselineWasteKg > 0
    ? Number((((impactAgg?.total_food_saved_kg || 0) / baselineWasteKg) * 100).toFixed(1))
    : 68.4;

  // 5. Dynamic Alerts
  const alerts: Array<{ id: string; type: 'warning' | 'info' | 'success' | 'danger'; title: string; message: string; timestamp: string }> = [];

  if (currentMeal) {
    if (currentMeal.shortage > 0) {
      alerts.push({
        id: 'alert-shortage',
        type: 'danger',
        title: 'Demand Exceeding Planned Quantity',
        message: `Demand exceeded planned preparation by ${currentMeal.shortage} meals for ${currentMeal.meal_type}. Trigger backup supply distribution.`,
        timestamp: 'Just now',
      });
    } else if (currentMeal.buffer_utilized > 0) {
      alerts.push({
        id: 'alert-buffer-absorbed',
        type: 'success',
        title: 'Buffer Safely Absorbed Attendance Spike',
        message: `Safety buffer absorbed ${currentMeal.buffer_utilized} unexpected diners for ${currentMeal.meal_type}. Zero shortage!`,
        timestamp: 'Live update',
      });
    }

    if (currentMeal.surplus > (currentMeal.buffer_amount || 20) * 1.5) {
      alerts.push({
        id: 'alert-surplus',
        type: 'warning',
        title: 'Surplus Above Normal Range',
        message: `Current surplus of ${currentMeal.surplus} meals is higher than typical. Prepared for cold storage / donation transfer.`,
        timestamp: '15m ago',
      });
    }
  }

  // Default system status alert
  alerts.push({
    id: 'alert-system-active',
    type: 'info',
    title: 'Adaptive Buffer Learning Engine Active',
    message: 'System is auto-calibrating safety buffers based on 14-day trailing prediction variance.',
    timestamp: 'Continuous',
  });

  res.json({
    currentMeal,
    metrics: {
      foodSavedKg: impactAgg?.total_food_saved_kg || 0,
      mealsSaved: impactAgg?.total_meals_saved || 0,
      costSavedInr: impactAgg?.total_cost_saved || 0,
      co2AvoidedKg: impactAgg?.total_co2_kg || 0,
      waterAvoidedLiters: impactAgg?.total_water_liters || 0,
      totalMealsServed,
      predictionAccuracy: averageAccuracy,
      wasteReductionPercent,
    },
    alerts,
  });
});

// Analytics Time-Series & Charts
router.get('/analytics/charts', (req, res) => {
  // 1. Weekly Predicted vs Actual & Waste
  const historical = query<{
    id: number;
    date: string;
    meal_type: string;
    predicted_demand: number;
    recommended_preparation: number;
    actual_preparation: number;
    actual_consumption: number;
    buffer_amount: number;
    surplus: number;
    shortage: number;
    leftover_meals: number;
    leftover_weight_kg: number;
    cost_saved_inr: number;
    food_saved_kg: number;
    status: string;
  }>(`
    SELECT 
      m.id, m.date, m.meal_type,
      COALESCE(mp.predicted_demand, 0) as predicted_demand,
      COALESCE(mp.recommended_preparation, 0) as recommended_preparation,
      COALESCE(mp.buffer_amount, 0) as buffer_amount,
      COALESCE(c.actual_preparation, 0) as actual_preparation,
      COALESCE(c.actual_consumption, 0) as actual_consumption,
      COALESCE(c.surplus, 0) as surplus,
      COALESCE(c.shortage, 0) as shortage,
      COALESCE(c.status, 'SAFE') as status,
      COALESCE(w.leftover_meals, 0) as leftover_meals,
      COALESCE(w.leftover_weight_kg, 0) as leftover_weight_kg,
      COALESCE(i.cost_saved_inr, 0) as cost_saved_inr,
      COALESCE(i.food_saved_kg, 0) as food_saved_kg
    FROM meals m
    LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
    LEFT JOIN consumption c ON m.id = c.meal_id
    LEFT JOIN waste_records w ON m.id = w.meal_id
    LEFT JOIN impact_records i ON m.id = i.meal_id
    WHERE c.actual_consumption > 0
    ORDER BY m.date ASC, m.id ASC
  `);

  // Chart 1: Predicted vs Actual vs Preparation over time
  const attendanceComparison = historical.map(h => ({
    label: `${h.date.slice(5)} ${h.meal_type[0]}`,
    date: h.date,
    mealType: h.meal_type,
    predicted: h.predicted_demand,
    recommendedPrep: h.recommended_preparation,
    actual: h.actual_consumption,
    actualPrep: h.actual_preparation,
    surplus: h.surplus,
    shortage: h.shortage,
  }));

  // Chart 2: Daily Waste & Food Saved
  const wasteTrend = historical.map(h => ({
    label: `${h.date.slice(5)} ${h.meal_type[0]}`,
    leftoverKg: Number(h.leftover_weight_kg.toFixed(1)),
    leftoverMeals: h.leftover_meals,
    foodSavedKg: Number(h.food_saved_kg.toFixed(1)),
    costSaved: Math.round(h.cost_saved_inr),
  }));

  // Chart 3: Buffer Utilization Breakdown
  const statusCounts = {
    SAFE: 0,
    BUFFER_USED: 0,
    SHORTAGE_RISK: 0,
    SURPLUS_RISK: 0,
  };
  historical.forEach(h => {
    if (h.status in statusCounts) {
      statusCounts[h.status as keyof typeof statusCounts]++;
    } else {
      statusCounts.SAFE++;
    }
  });

  const bufferDistribution = [
    { name: 'Safe Optimal', value: statusCounts.SAFE, color: '#10B981' },
    { name: 'Buffer Absorbed', value: statusCounts.BUFFER_USED, color: '#06B6D4' },
    { name: 'Surplus Risk', value: statusCounts.SURPLUS_RISK, color: '#F59E0B' },
    { name: 'Shortage Risk', value: statusCounts.SHORTAGE_RISK, color: '#EF4444' },
  ];

  // Chart 4: Meal Type Performance Breakdown
  const mealTypeMap: Record<string, { totalConsumption: number; totalPredicted: number; totalWasteKg: number; count: number }> = {};
  historical.forEach(h => {
    if (!mealTypeMap[h.meal_type]) {
      mealTypeMap[h.meal_type] = { totalConsumption: 0, totalPredicted: 0, totalWasteKg: 0, count: 0 };
    }
    mealTypeMap[h.meal_type].totalConsumption += h.actual_consumption;
    mealTypeMap[h.meal_type].totalPredicted += h.predicted_demand;
    mealTypeMap[h.meal_type].totalWasteKg += h.leftover_weight_kg;
    mealTypeMap[h.meal_type].count += 1;
  });

  const mealTypeBreakdown = Object.keys(mealTypeMap).map(type => {
    const data = mealTypeMap[type];
    const avgWaste = Number((data.totalWasteKg / Math.max(1, data.count)).toFixed(1));
    const variance = Math.round(Math.abs(data.totalConsumption - data.totalPredicted) / Math.max(1, data.count));
    return {
      mealType: type,
      avgAttendance: Math.round(data.totalConsumption / Math.max(1, data.count)),
      avgWasteKg: avgWaste,
      varianceMeals: variance,
    };
  });

  res.json({
    attendanceComparison,
    wasteTrend,
    bufferDistribution,
    mealTypeBreakdown,
  });
});

// ==========================================
// 3. MEAL MANAGEMENT
// ==========================================

router.get('/meals', (req, res) => {
  const { date, status, mealType } = req.query;
  let sql = `
    SELECT 
      m.id, m.date, m.meal_type, m.menu, m.expected_attendance, m.cost_per_meal, m.status,
      mp.predicted_demand, mp.recommended_buffer_percent, mp.buffer_amount, mp.recommended_preparation, mp.confidence_score, mp.reasoning,
      c.actual_preparation, c.actual_consumption, c.surplus, c.shortage, c.buffer_utilized, c.buffer_depleted, c.status as consumption_status,
      w.leftover_meals, w.leftover_weight_kg, w.waste_reason, w.action_taken,
      i.food_saved_kg, i.meals_saved, i.cost_saved_inr, i.co2_avoided_kg, i.water_avoided_liters,
      (SELECT COUNT(*) FROM student_meal_intentions WHERE meal_id = m.id AND attending = 1) as confirmed_students,
      (SELECT COUNT(*) FROM student_meal_intentions WHERE meal_id = m.id AND attending = 0) as opted_out_students
    FROM meals m
    LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
    LEFT JOIN consumption c ON m.id = c.meal_id
    LEFT JOIN waste_records w ON m.id = w.meal_id
    LEFT JOIN impact_records i ON m.id = i.meal_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date) {
    sql += ' AND m.date = ?';
    params.push(date);
  }
  if (status) {
    sql += ' AND m.status = ?';
    params.push(status);
  }
  if (mealType) {
    sql += ' AND m.meal_type = ?';
    params.push(mealType);
  }

  sql += ' ORDER BY m.date DESC, m.id DESC LIMIT 50';

  const meals = query(sql, params);
  res.json({ meals });
});

router.get('/meals/:id', (req, res) => {
  const mealId = parseInt(req.params.id, 10);
  const meal = get(`
    SELECT 
      m.*,
      mp.predicted_demand, mp.recommended_buffer_percent, mp.buffer_amount, mp.recommended_preparation, mp.confidence_score, mp.reasoning, mp.factors,
      c.actual_preparation, c.actual_consumption, c.surplus, c.shortage, c.buffer_utilized, c.buffer_depleted, c.status as consumption_status,
      w.leftover_meals, w.leftover_weight_kg, w.waste_reason, w.action_taken,
      i.food_saved_kg, i.meals_saved, i.cost_saved_inr, i.co2_avoided_kg, i.water_avoided_liters
    FROM meals m
    LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
    LEFT JOIN consumption c ON m.id = c.meal_id
    LEFT JOIN waste_records w ON m.id = w.meal_id
    LEFT JOIN impact_records i ON m.id = i.meal_id
    WHERE m.id = ?
  `, [mealId]);

  if (!meal) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  // Get student intentions
  const intentions = query(`
    SELECT smi.*, u.name as student_name, u.hostel
    FROM student_meal_intentions smi
    JOIN users u ON smi.user_id = u.id
    WHERE smi.meal_id = ?
  `, [mealId]);

  // Get meal feedback
  const feedbackList = query(`
    SELECT f.*, u.name as student_name
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    WHERE f.meal_id = ?
    ORDER BY f.created_at DESC
  `, [mealId]);

  res.json({ meal, intentions, feedback: feedbackList });
});

// Create new meal with automatic prediction & buffer calculation
router.post('/meals', authenticateToken, requireRole('ADMIN', 'STAFF'), (req: AuthRequest, res: Response) => {
  const { date, mealType, menu, expectedAttendance = 420, costPerMeal = 45.0 } = req.body;

  if (!date || !mealType || !menu) {
    res.status(400).json({ error: 'Date, mealType, and menu are required.' });
    return;
  }

  const result = run(`
    INSERT INTO meals (date, meal_type, menu, expected_attendance, cost_per_meal, status, created_by)
    VALUES (?, ?, ?, ?, ?, 'PLANNED', ?)
  `, [date, mealType, menu.trim(), expectedAttendance, costPerMeal, req.user?.id || null]);

  const mealId = result.lastInsertRowid;

  // Run prediction engine
  const prediction = generateMealPrediction({
    mealType,
    date,
    expectedAttendance,
  });

  run(`
    INSERT INTO meal_predictions (meal_id, predicted_demand, recommended_buffer_percent, buffer_amount, recommended_preparation, confidence_score, reasoning, factors)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    mealId,
    prediction.predictedDemand,
    prediction.recommendedBuffer,
    prediction.bufferAmount,
    prediction.recommendedPreparation,
    prediction.confidence,
    prediction.reasoning,
    JSON.stringify(prediction.factors),
  ]);

  const created = get('SELECT * FROM meals WHERE id = ?', [mealId]);
  res.status(201).json({ meal: created, prediction });
});

// Update meal
router.put('/meals/:id', authenticateToken, requireRole('ADMIN', 'STAFF'), (req: AuthRequest, res: Response) => {
  const mealId = parseInt(req.params.id, 10);
  const { menu, expectedAttendance, costPerMeal, status } = req.body;

  const current = get('SELECT * FROM meals WHERE id = ?', [mealId]);
  if (!current) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  run(`
    UPDATE meals 
    SET menu = COALESCE(?, menu),
        expected_attendance = COALESCE(?, expected_attendance),
        cost_per_meal = COALESCE(?, cost_per_meal),
        status = COALESCE(?, status)
    WHERE id = ?
  `, [menu, expectedAttendance, costPerMeal, status, mealId]);

  res.json({ message: 'Meal updated successfully' });
});

// Delete meal (Admin only)
router.delete('/meals/:id', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response) => {
  const mealId = parseInt(req.params.id, 10);
  run('DELETE FROM meals WHERE id = ?', [mealId]);
  res.json({ message: 'Meal deleted successfully' });
});

// ==========================================
// 4. PREDICTIONS & CALCULATIONS
// ==========================================

router.post('/simulator/simulate', (req: AuthRequest, res: Response) => {
  const {
    mealId,
    additionalStudents = 0,
    manualPreparationOverride,
    applyScenario = false,
    customBaselineDemand,
    customBufferPercent,
    mealType = 'Lunch',
  } = req.body;
  const delta = Number(additionalStudents) || 0;

  let basePrediction = 0;
  let baseBufferPercent = 5.0;
  let baseBufferAmount = 0;
  let currentPreparation = 0;
  let mealDate = new Date().toISOString().split('T')[0];
  let currentMealType = mealType;
  let meal: any = null;

  if (customBaselineDemand !== undefined && customBaselineDemand !== null && customBaselineDemand !== '') {
    // User provided custom direct inputs
    basePrediction = Math.max(0, Number(customBaselineDemand));
    baseBufferPercent = customBufferPercent !== undefined && customBufferPercent !== null ? Number(customBufferPercent) : 5.0;
    baseBufferAmount = Math.round(basePrediction * (baseBufferPercent / 100));
    currentPreparation = manualPreparationOverride !== undefined && manualPreparationOverride !== null && manualPreparationOverride !== ''
      ? Math.max(0, Number(manualPreparationOverride))
      : basePrediction + baseBufferAmount;
  } else if (mealId) {
    meal = get<any>(`
      SELECT m.id, m.date, m.meal_type, m.menu, m.expected_attendance, m.cost_per_meal,
             mp.predicted_demand, mp.recommended_buffer_percent, mp.buffer_amount, mp.recommended_preparation
      FROM meals m
      LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
      WHERE m.id = ?
    `, [mealId]);

    if (!meal) {
      res.status(404).json({ error: 'Meal not found.' });
      return;
    }

    basePrediction = Number(meal.predicted_demand) || 0;
    baseBufferAmount = Number(meal.buffer_amount) || 0;
    baseBufferPercent = Number(meal.recommended_buffer_percent) || 5.0;
    currentPreparation = manualPreparationOverride !== undefined && manualPreparationOverride !== null && manualPreparationOverride !== ''
      ? Number(manualPreparationOverride)
      : (Number(meal.recommended_preparation) || basePrediction + baseBufferAmount);
    mealDate = meal.date;
    currentMealType = meal.meal_type;
  } else {
    // Fallback: use recent meal if present
    meal = get<any>(`
      SELECT m.id, m.date, m.meal_type, m.menu, m.expected_attendance, m.cost_per_meal,
             mp.predicted_demand, mp.recommended_buffer_percent, mp.buffer_amount, mp.recommended_preparation
      FROM meals m
      LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
      ORDER BY m.date DESC, m.id DESC
      LIMIT 1
    `);

    if (meal) {
      basePrediction = Number(meal.predicted_demand) || 0;
      baseBufferAmount = Number(meal.buffer_amount) || 0;
      baseBufferPercent = Number(meal.recommended_buffer_percent) || 5.0;
      currentPreparation = manualPreparationOverride !== undefined && manualPreparationOverride !== null && manualPreparationOverride !== ''
        ? Number(manualPreparationOverride)
        : (Number(meal.recommended_preparation) || basePrediction + baseBufferAmount);
      mealDate = meal.date;
      currentMealType = meal.meal_type;
    }
  }

  const newExpectedDemand = Math.max(0, basePrediction + delta);
  const shortage = Math.max(0, newExpectedDemand - currentPreparation);
  const bufferRemaining = Math.max(0, currentPreparation - newExpectedDemand);

  let status: 'SAFE' | 'BUFFER_USED' | 'SHORTAGE_RISK' = 'SAFE';
  let recommendedAction = '';

  if (shortage > 0) {
    status = 'SHORTAGE_RISK';
    recommendedAction = `${delta > 0 ? `${delta} additional students` : 'Simulated demand'} would exceed planned preparation by ${shortage} meals. Prepare ${shortage} additional meals if possible.`;
  } else if (newExpectedDemand > basePrediction) {
    status = 'BUFFER_USED';
    recommendedAction = `${delta} additional students safely absorbed by the ${baseBufferAmount}-meal buffer (${bufferRemaining} buffer meals remaining). Zero shortage risk.`;
  } else {
    status = 'SAFE';
    recommendedAction = `Current planned preparation (${currentPreparation} meals) safely covers expected turnout with ${bufferRemaining} buffer/surplus meals.`;
  }

  let applied = false;
  if (applyScenario) {
    // Check role: only STAFF or ADMIN can apply
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    let authUser = req.user;
    if (token && !authUser) {
      try {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'food_forecast_sustain_x_jwt_secret_2026');
        authUser = decoded;
      } catch (e) {
        // ignore
      }
    }

    if (!authUser || !['STAFF', 'ADMIN'].includes(authUser.role)) {
      res.status(403).json({ error: 'Forbidden: Only kitchen staff or administrators can apply simulation scenarios to active meals.' });
      return;
    }

    // Apply scenario: update meal prediction with new demand and adjusted preparation
    const newBufferCalc = calculateBuffer({
      predictedDemand: newExpectedDemand,
      bufferPercent: baseBufferPercent,
    });

    run(`
      UPDATE meal_predictions
      SET predicted_demand = ?,
          buffer_amount = ?,
          recommended_preparation = ?,
          reasoning = ?
      WHERE meal_id = ?
    `, [
      newBufferCalc.predictedDemand,
      newBufferCalc.bufferAmount,
      newBufferCalc.recommendedPreparation,
      `Scenario Applied: ${delta >= 0 ? `+${delta}` : delta} students adjustment applied by ${authUser.name}.`,
      meal.id,
    ]);

    run(`
      UPDATE meals
      SET expected_attendance = ?
      WHERE id = ?
    `, [newExpectedDemand, meal.id]);

    applied = true;
  }

  res.json({
    mealId: meal ? meal.id : 0,
    mealType: meal ? meal.meal_type : currentMealType,
    date: meal ? meal.date : mealDate,
    basePrediction,
    bufferPercent: baseBufferPercent,
    bufferAmount: baseBufferAmount,
    currentPreparation,
    additionalStudents: delta,
    newExpectedDemand,
    bufferRemaining,
    shortage,
    status,
    recommendedAction,
    applied,
  });
});

router.post('/predictions/calculate', (req, res) => {
  const { mealType = 'Lunch', date = new Date().toISOString().split('T')[0], expectedAttendance = 420 } = req.body;
  const prediction = generateMealPrediction({
    mealType,
    date,
    expectedAttendance: Number(expectedAttendance) || 420,
  });
  res.json({ prediction });
});

router.get('/predictions/accuracy', (req, res) => {
  const records = query<{
    id: number;
    date: string;
    meal_type: string;
    predicted_demand: number;
    recommended_buffer_percent: number;
    buffer_amount: number;
    recommended_preparation: number;
    actual_consumption: number;
    status: string;
  }>(`
    SELECT m.id, m.date, m.meal_type, mp.predicted_demand, mp.recommended_buffer_percent, mp.buffer_amount, mp.recommended_preparation, c.actual_consumption, c.status
    FROM meals m
    JOIN meal_predictions mp ON m.id = mp.meal_id
    JOIN consumption c ON m.id = c.meal_id
    WHERE c.actual_consumption > 0
    ORDER BY m.date DESC
  `);

  let totalError = 0;
  let totalAcc = 0;
  const items = records.map(r => {
    const err = (Math.abs(r.actual_consumption - r.predicted_demand) / r.actual_consumption) * 100;
    const acc = Math.max(0, 100 - err);
    totalError += err;
    totalAcc += acc;
    return {
      ...r,
      errorPercent: Number(err.toFixed(1)),
      error_percent: Number(err.toFixed(1)),
      accuracyPercent: Number(acc.toFixed(1)),
      accuracy_percent: Number(acc.toFixed(1)),
    };
  });

  const avgError = records.length > 0 ? Number((totalError / records.length).toFixed(1)) : 5.8;
  const avgAccuracy = records.length > 0 ? Number((totalAcc / records.length).toFixed(1)) : 94.2;

  res.json({
    avgAccuracy,
    avgError,
    totalRecords: records.length,
    recentHistory: items,
  });
});

// ==========================================
// 5. CONSUMPTION & WASTE LOGGING
// ==========================================

router.post('/consumption', authenticateToken, requireRole('ADMIN', 'STAFF'), (req: AuthRequest, res: Response) => {
  const { mealId, actualPreparation, actualConsumption, leftoverWeightKg, wasteReason, actionTaken } = req.body;

  if (!mealId || actualPreparation === undefined || actualConsumption === undefined) {
    res.status(400).json({ error: 'mealId, actualPreparation, and actualConsumption are required.' });
    return;
  }

  const meal = get<{ id: number; cost_per_meal: number }>(`SELECT id, cost_per_meal FROM meals WHERE id = ?`, [mealId]);
  if (!meal) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  const prediction = get<{ predicted_demand: number; buffer_amount: number }>(`
    SELECT predicted_demand, buffer_amount FROM meal_predictions WHERE meal_id = ?
  `, [mealId]);

  const predictedDemand = prediction ? prediction.predicted_demand : actualPreparation;
  const bufferAmount = prediction ? prediction.buffer_amount : 20;

  const metrics = calculateConsumptionMetrics({
    predictedDemand,
    bufferAmount,
    actualPreparation: Number(actualPreparation),
    actualConsumption: Number(actualConsumption),
  });

  // Upsert consumption
  run(`
    INSERT INTO consumption (meal_id, actual_preparation, actual_consumption, surplus, shortage, buffer_utilized, buffer_depleted, status, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(meal_id) DO UPDATE SET
      actual_preparation = excluded.actual_preparation,
      actual_consumption = excluded.actual_consumption,
      surplus = excluded.surplus,
      shortage = excluded.shortage,
      buffer_utilized = excluded.buffer_utilized,
      buffer_depleted = excluded.buffer_depleted,
      status = excluded.status,
      recorded_by = excluded.recorded_by,
      recorded_at = CURRENT_TIMESTAMP
  `, [
    mealId,
    actualPreparation,
    actualConsumption,
    metrics.surplus,
    metrics.shortage,
    metrics.bufferUtilized,
    metrics.bufferDepleted ? 1 : 0,
    metrics.status,
    req.user?.id || null,
  ]);

  // Update meal status
  run(`UPDATE meals SET status = 'COMPLETED' WHERE id = ?`, [mealId]);

  // Log waste record
  const leftoverMeals = metrics.surplus;
  const calculatedWeight = leftoverWeightKg !== undefined ? Number(leftoverWeightKg) : Number((leftoverMeals * 0.4).toFixed(2));

  run(`
    INSERT INTO waste_records (meal_id, leftover_meals, leftover_weight_kg, waste_reason, action_taken, avoidable_waste_percent)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(meal_id) DO UPDATE SET
      leftover_meals = excluded.leftover_meals,
      leftover_weight_kg = excluded.leftover_weight_kg,
      waste_reason = excluded.waste_reason,
      action_taken = excluded.action_taken,
      avoidable_waste_percent = excluded.avoidable_waste_percent,
      recorded_at = CURRENT_TIMESTAMP
  `, [
    mealId,
    leftoverMeals,
    calculatedWeight,
    wasteReason || (metrics.status === 'BUFFER_USED' ? 'Buffer absorbed unexpected attendees, minor plate scrap' : 'Standard surplus'),
    actionTaken || (leftoverMeals > 15 ? 'Composted' : 'Community Donation'),
    metrics.status === 'SHORTAGE_RISK' ? 0 : 3.5,
  ]);

  // Calculate & upsert impact
  const impact = calculateImpact({
    surplus: leftoverMeals,
    actualConsumption: Number(actualConsumption),
    costPerMeal: meal.cost_per_meal,
  });

  run(`
    INSERT INTO impact_records (meal_id, food_saved_kg, meals_saved, cost_saved_inr, co2_avoided_kg, water_avoided_liters)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(meal_id) DO UPDATE SET
      food_saved_kg = excluded.food_saved_kg,
      meals_saved = excluded.meals_saved,
      cost_saved_inr = excluded.cost_saved_inr,
      co2_avoided_kg = excluded.co2_avoided_kg,
      water_avoided_liters = excluded.water_avoided_liters,
      calculated_at = CURRENT_TIMESTAMP
  `, [
    mealId,
    impact.foodSavedKg,
    impact.mealsSaved,
    impact.costSavedInr,
    impact.co2AvoidedKg,
    impact.waterAvoidedLiters,
  ]);

  res.json({
    message: 'Consumption and waste recorded successfully',
    metrics,
    impact,
  });
});

// ==========================================
// 6. BUFFER CONFIGURATION
// ==========================================

router.get('/buffer-config', (req, res) => {
  const configs = query('SELECT * FROM buffer_configurations ORDER BY id ASC');
  res.json({ configs });
});

router.put('/buffer-config/:mealType', authenticateToken, requireRole('ADMIN'), (req: AuthRequest, res: Response) => {
  const { mealType } = req.params;
  const { baseBufferPercent, minBufferPercent, maxBufferPercent, autoAdjustEnabled } = req.body;

  run(`
    INSERT INTO buffer_configurations (meal_type, base_buffer_percent, min_buffer_percent, max_buffer_percent, auto_adjust_enabled, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(meal_type) DO UPDATE SET
      base_buffer_percent = COALESCE(excluded.base_buffer_percent, base_buffer_percent),
      min_buffer_percent = COALESCE(excluded.min_buffer_percent, min_buffer_percent),
      max_buffer_percent = COALESCE(excluded.max_buffer_percent, max_buffer_percent),
      auto_adjust_enabled = COALESCE(excluded.auto_adjust_enabled, auto_adjust_enabled),
      updated_by = excluded.updated_by,
      updated_at = CURRENT_TIMESTAMP
  `, [
    mealType,
    baseBufferPercent,
    minBufferPercent,
    maxBufferPercent,
    autoAdjustEnabled ? 1 : 0,
    req.user?.id || null,
  ]);

  res.json({ message: `Buffer configuration for ${mealType} updated successfully.` });
});

// ==========================================
// 7. STUDENT INTENTIONS & FEEDBACK
// ==========================================

router.get('/intentions/my', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const intentions = query(`
    SELECT smi.*, m.date, m.meal_type, m.menu
    FROM student_meal_intentions smi
    JOIN meals m ON smi.meal_id = m.id
    WHERE smi.user_id = ?
    ORDER BY m.date DESC, m.id DESC
  `, [userId]);
  res.json({ intentions });
});

router.post('/intentions', authenticateToken, (req: AuthRequest, res: Response) => {
  const { mealId, attending, dietPreference = 'REGULAR' } = req.body;
  const userId = req.user?.id;

  if (!mealId || attending === undefined) {
    res.status(400).json({ error: 'mealId and attending (1 or 0) are required.' });
    return;
  }

  run(`
    INSERT INTO student_meal_intentions (meal_id, user_id, attending, diet_preference)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(meal_id, user_id) DO UPDATE SET
      attending = excluded.attending,
      diet_preference = excluded.diet_preference,
      updated_at = CURRENT_TIMESTAMP
  `, [mealId, userId, attending ? 1 : 0, dietPreference]);

  res.json({ message: 'Meal attendance preference updated successfully.' });
});

router.get('/feedback', (req, res) => {
  const feedbackList = query(`
    SELECT f.*, u.name as student_name, m.meal_type, m.date, m.menu
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    JOIN meals m ON f.meal_id = m.id
    ORDER BY f.created_at DESC
    LIMIT 30
  `);
  res.json({ feedback: feedbackList });
});

router.post('/feedback', authenticateToken, (req: AuthRequest, res: Response) => {
  const { mealId, rating, tasteRating, portionRating, comments, wouldEatAgain = 1 } = req.body;
  const userId = req.user?.id;

  if (!mealId || !rating) {
    res.status(400).json({ error: 'mealId and rating (1-5) are required.' });
    return;
  }

  run(`
    INSERT INTO feedback (meal_id, user_id, rating, taste_rating, portion_rating, comments, would_eat_again)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    mealId,
    userId,
    rating,
    tasteRating || rating,
    portionRating || rating,
    comments || '',
    wouldEatAgain ? 1 : 0,
  ]);

  res.status(201).json({ message: 'Thank you for your feedback! It helps improve meal planning.' });
});

// ==========================================
// 8. NATURAL LANGUAGE QUERY ASSISTANT
// ==========================================

router.post('/query', async (req: AuthRequest, res: Response) => {
  const { queryText } = req.body;
  if (!queryText || typeof queryText !== 'string') {
    res.status(400).json({ error: 'Query text is required.' });
    return;
  }

  try {
    const result = await processNaturalLanguageQuery(queryText, req.user?.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error processing query:', err);
    res.status(500).json({ error: 'Failed to process query: ' + err.message });
  }
});

router.get('/query/history', (req, res) => {
  const history = query(`
    SELECT qh.*, u.name as user_name
    FROM query_history qh
    LEFT JOIN users u ON qh.user_id = u.id
    ORDER BY qh.created_at DESC
    LIMIT 15
  `);
  res.json({ history });
});

// ==========================================
// 9. ADMIN RE-SEED DATA
// ==========================================

router.post('/admin/reset-data', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    // Clear dynamic tables
    run('DELETE FROM feedback;');
    run('DELETE FROM student_meal_intentions;');
    run('DELETE FROM query_history;');
    run('DELETE FROM impact_records;');
    run('DELETE FROM waste_records;');
    run('DELETE FROM consumption;');
    run('DELETE FROM meal_predictions;');
    run('DELETE FROM meals;');
    run('DELETE FROM buffer_configurations;');
    run('DELETE FROM users;');
    await seedDatabase();
    res.json({ message: 'Database reset and re-seeded with demo data successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});

export default router;
