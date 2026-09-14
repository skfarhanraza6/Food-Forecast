import { query, get } from './db.ts';
import { calculateBuffer, recommendDynamicBuffer } from './calculations.ts';

export interface PredictionResult {
  predictedDemand: number;
  confidence: number;
  recommendedBuffer: number;
  bufferAmount: number;
  recommendedPreparation: number;
  reasoning: string;
  factors: {
    historicalAverage: number;
    dayOfWeekFactor: number;
    intentionsCount: number;
    totalExpectedBase: number;
    recentTrendPct: number;
    historicalErrorAvgPct: number;
  };
}

export interface GeneratePredictionOptions {
  mealType: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  date: string; // YYYY-MM-DD
  expectedAttendance?: number;
}

export function generateMealPrediction(options: GeneratePredictionOptions): PredictionResult {
  const { mealType, date, expectedAttendance = 420 } = options;

  // Day of week factor
  const dateObj = new Date(date);
  const dayOfWeek = isNaN(dateObj.getDay()) ? 1 : dateObj.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  
  // Weekends have lower attendance in university messes (students going home or eating outside)
  // Fridays/Weekends pattern
  let dayOfWeekFactor = 1.0;
  if (dayOfWeek === 0) {
    dayOfWeekFactor = 0.85; // Sunday
  } else if (dayOfWeek === 6) {
    dayOfWeekFactor = 0.90; // Saturday
  } else if (dayOfWeek === 5) {
    dayOfWeekFactor = 0.95; // Friday
  } else if (dayOfWeek === 1) {
    dayOfWeekFactor = 1.02; // Monday peak
  } else {
    dayOfWeekFactor = 1.0;
  }

  // Meal type multiplier on typical base
  let mealTypeBaseMultiplier = 1.0;
  switch (mealType) {
    case 'Breakfast':
      mealTypeBaseMultiplier = 0.82; // Fewer students wake up for early breakfast
      break;
    case 'Lunch':
      mealTypeBaseMultiplier = 1.00; // Peak attendance
      break;
    case 'Snacks':
      mealTypeBaseMultiplier = 0.65; // Optional tea/snacks
      break;
    case 'Dinner':
      mealTypeBaseMultiplier = 0.96; // Very high attendance
      break;
  }

  // Query historical meals of the same meal type with consumption data
  const historicalRows = query<{
    meal_type: string;
    actual_consumption: number;
    predicted_demand: number;
    actual_preparation: number;
    shortage: number;
    surplus: number;
    status: string;
  }>(`
    SELECT m.meal_type, c.actual_consumption, mp.predicted_demand, c.actual_preparation, c.shortage, c.surplus, c.status
    FROM meals m
    JOIN consumption c ON m.id = c.meal_id
    LEFT JOIN meal_predictions mp ON m.id = mp.meal_id
    WHERE m.meal_type = ?
    ORDER BY m.date DESC
    LIMIT 14
  `, [mealType]);

  // Query student meal intentions for this specific date & meal type if exists
  const mealRow = get<{ id: number }>(`
    SELECT id FROM meals WHERE date = ? AND meal_type = ? LIMIT 1
  `, [date, mealType]);

  let intentionsCount = 0;
  let optedOutCount = 0;
  if (mealRow?.id) {
    const intentions = query<{ attending: number }>(`
      SELECT attending FROM student_meal_intentions WHERE meal_id = ?
    `, [mealRow.id]);
    intentions.forEach(i => {
      if (i.attending === 1) intentionsCount++;
      else optedOutCount++;
    });
  }

  // Calculate historical consumption average
  let historicalAverage = 0;
  const historicalErrors: number[] = [];
  if (historicalRows.length > 0) {
    const total = historicalRows.reduce((sum, r) => sum + r.actual_consumption, 0);
    historicalAverage = Math.round(total / historicalRows.length);

    historicalRows.forEach(r => {
      if (r.predicted_demand > 0 && r.actual_consumption > 0) {
        const err = (Math.abs(r.actual_consumption - r.predicted_demand) / r.actual_consumption) * 100;
        historicalErrors.push(err);
      }
    });
  } else {
    // Default baseline if cold start
    historicalAverage = Math.round(expectedAttendance * mealTypeBaseMultiplier);
  }

  // Query buffer configuration for meal type
  const config = get<{
    base_buffer_percent: number;
    min_buffer_percent: number;
    max_buffer_percent: number;
    auto_adjust_enabled: number;
  }>(`
    SELECT base_buffer_percent, min_buffer_percent, max_buffer_percent, auto_adjust_enabled
    FROM buffer_configurations
    WHERE meal_type = ? OR meal_type = 'default'
    ORDER BY CASE WHEN meal_type = ? THEN 0 ELSE 1 END
    LIMIT 1
  `, [mealType, mealType]);

  const baseBuffer = config ? config.base_buffer_percent : 5.0;
  const minBuffer = config ? config.min_buffer_percent : 3.0;
  const maxBuffer = config ? config.max_buffer_percent : 15.0;

  // Dynamic buffer recommendation
  const { recommendedBuffer, reasoning: bufferReasoning } = recommendDynamicBuffer(
    historicalErrors,
    minBuffer,
    maxBuffer,
    baseBuffer,
    mealType
  );

  // Compute baseline demand
  let baseline = historicalAverage > 0 ? historicalAverage : expectedAttendance * mealTypeBaseMultiplier;
  
  // Apply day of week factor
  let predictedDemand = Math.round(baseline * dayOfWeekFactor);

  // If we have active student RSVPs/intentions, adjust slightly
  if (optedOutCount > 10) {
    // Noticeable opt-outs
    predictedDemand = Math.max(10, predictedDemand - Math.round(optedOutCount * 0.8));
  } else if (intentionsCount > 30) {
    // Noticeable confirmations
    const confirmedRatio = intentionsCount / (intentionsCount + Math.max(1, optedOutCount));
    if (confirmedRatio > 0.9) {
      predictedDemand = Math.round(predictedDemand * 1.03);
    }
  }

  // Ensure minimum reasonable bounds
  predictedDemand = Math.max(20, predictedDemand);

  // Confidence calculation based on historical sample size and error variance
  let confidence = 0.85;
  if (historicalRows.length >= 7) {
    const avgErr = historicalErrors.length > 0 
      ? historicalErrors.reduce((a, b) => a + b, 0) / historicalErrors.length 
      : 5;
    confidence = Math.min(0.96, Math.max(0.70, (100 - avgErr) / 100));
  } else if (historicalRows.length === 0) {
    confidence = 0.75; // cold start
  }

  // Apply buffer calculation
  const bufferCalc = calculateBuffer({
    predictedDemand,
    bufferPercent: recommendedBuffer,
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayOfWeek];

  const reasoning = `Predicted ${predictedDemand} meals for ${dayName} ${mealType}. Based on a ${historicalAverage}-meal historical baseline weighted by a ${(dayOfWeekFactor * 100).toFixed(0)}% ${dayName} attendance factor. ${bufferReasoning}`;

  return {
    predictedDemand: bufferCalc.predictedDemand,
    confidence: Number(confidence.toFixed(2)),
    recommendedBuffer: bufferCalc.bufferPercent,
    bufferAmount: bufferCalc.bufferAmount,
    recommendedPreparation: bufferCalc.recommendedPreparation,
    reasoning,
    factors: {
      historicalAverage,
      dayOfWeekFactor,
      intentionsCount,
      totalExpectedBase: expectedAttendance,
      recentTrendPct: Number(((dayOfWeekFactor - 1.0) * 100).toFixed(1)),
      historicalErrorAvgPct: historicalErrors.length > 0
        ? Number((historicalErrors.reduce((a, b) => a + b, 0) / historicalErrors.length).toFixed(1))
        : 0,
    },
  };
}
