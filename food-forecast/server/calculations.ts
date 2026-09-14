/**
 * Centralized calculation utilities for FOOD FORECAST.
 * Single source of truth for buffer, prediction, consumption, and sustainability metrics.
 */

export interface BufferCalculationParams {
  predictedDemand: number;
  bufferPercent: number; // e.g. 5 for 5%
}

export interface BufferCalculationResult {
  predictedDemand: number;
  bufferPercent: number;
  bufferAmount: number;
  recommendedPreparation: number;
}

export interface ConsumptionMetricsParams {
  predictedDemand: number;
  bufferAmount: number;
  actualPreparation: number;
  actualConsumption: number;
}

export interface ConsumptionMetricsResult {
  surplus: number;
  shortage: number;
  bufferUtilized: number;
  bufferDepleted: boolean;
  status: 'SAFE' | 'BUFFER_USED' | 'SHORTAGE_RISK' | 'SURPLUS_RISK';
  predictionErrorPercent: number;
  predictionAccuracyPercent: number;
}

export interface ImpactMetricsParams {
  surplus: number; // in meals
  actualConsumption: number;
  baselineWasteMeals?: number; // historical average waste if no buffer optimization
  costPerMeal?: number; // e.g. ₹45
}

export interface ImpactMetricsResult {
  mealsSaved: number;
  foodSavedKg: number;
  costSavedInr: number;
  co2AvoidedKg: number;
  waterAvoidedLiters: number;
}

// Environmental Constants
// 1 meal ≈ 0.40 kg of food
export const KG_PER_MEAL = 0.40;
// 1 kg food waste ≈ 2.5 kg CO2e lifecycle emission
export const CO2E_PER_KG_FOOD = 2.5;
// 1 kg agricultural food waste ≈ 650 Liters of water footprint
export const WATER_LITERS_PER_KG_FOOD = 650;
// Default cost per meal in INR
export const DEFAULT_COST_PER_MEAL = 45;

/**
 * Calculates safety buffer and recommended preparation quantity.
 * Handles edge cases like 0 or negative predicted demand.
 */
export function calculateBuffer(params: BufferCalculationParams): BufferCalculationResult {
  const predictedDemand = Math.max(0, Math.round(Number(params.predictedDemand) || 0));
  const bufferPercent = Math.max(0, Math.min(50, Number(params.bufferPercent) || 5));
  
  // Buffer amount is rounded up so even small positive percentages yield at least 1 buffer meal if predicted > 0
  const bufferAmount = predictedDemand > 0 
    ? Math.max(1, Math.ceil(predictedDemand * (bufferPercent / 100))) 
    : 0;

  const recommendedPreparation = predictedDemand + bufferAmount;

  return {
    predictedDemand,
    bufferPercent,
    bufferAmount,
    recommendedPreparation,
  };
}

/**
 * Calculates consumption status, shortage, surplus, and buffer utilization.
 */
export function calculateConsumptionMetrics(params: ConsumptionMetricsParams): ConsumptionMetricsResult {
  const predictedDemand = Math.max(0, Math.round(Number(params.predictedDemand) || 0));
  const bufferAmount = Math.max(0, Math.round(Number(params.bufferAmount) || 0));
  const actualPreparation = Math.max(0, Math.round(Number(params.actualPreparation) || 0));
  const actualConsumption = Math.max(0, Math.round(Number(params.actualConsumption) || 0));

  const surplus = Math.max(0, actualPreparation - actualConsumption);
  const shortage = Math.max(0, actualConsumption - actualPreparation);

  // Buffer utilized represents how much of the buffer was actually needed by attendance exceeding prediction
  let bufferUtilized = 0;
  if (actualConsumption > predictedDemand) {
    bufferUtilized = Math.min(bufferAmount, actualConsumption - predictedDemand);
  }

  const bufferDepleted = shortage > 0;

  // Status classification
  let status: 'SAFE' | 'BUFFER_USED' | 'SHORTAGE_RISK' | 'SURPLUS_RISK' = 'SAFE';

  if (shortage > 0) {
    status = 'SHORTAGE_RISK';
  } else if (actualConsumption > predictedDemand) {
    status = 'BUFFER_USED';
  } else if (surplus > Math.max(15, bufferAmount * 1.5)) {
    status = 'SURPLUS_RISK';
  } else {
    status = 'SAFE';
  }

  // Prediction accuracy calculations
  let predictionErrorPercent = 0;
  let predictionAccuracyPercent = 100;

  if (actualConsumption > 0) {
    const absDiff = Math.abs(actualConsumption - predictedDemand);
    predictionErrorPercent = Number(((absDiff / actualConsumption) * 100).toFixed(1));
    predictionAccuracyPercent = Number(Math.max(0, Math.min(100, 100 - predictionErrorPercent)).toFixed(1));
  } else if (predictedDemand === 0 && actualConsumption === 0) {
    predictionAccuracyPercent = 100;
    predictionErrorPercent = 0;
  } else {
    predictionAccuracyPercent = 0;
    predictionErrorPercent = 100;
  }

  return {
    surplus,
    shortage,
    bufferUtilized,
    bufferDepleted,
    status,
    predictionErrorPercent,
    predictionAccuracyPercent,
  };
}

/**
 * Calculates environmental and financial impacts based on waste prevented.
 * In a traditional mess without FOOD FORECAST, average waste is ~15-20% of prepared food.
 */
export function calculateImpact(params: ImpactMetricsParams): ImpactMetricsResult {
  const surplusMeals = Math.max(0, Math.round(Number(params.surplus) || 0));
  const actualConsumption = Math.max(0, Math.round(Number(params.actualConsumption) || 0));
  const costPerMeal = Math.max(0, Number(params.costPerMeal) || DEFAULT_COST_PER_MEAL);

  // Baseline waste in unmanaged mess: ~15% of consumption
  const unmanagedExpectedWaste = params.baselineWasteMeals ?? Math.round(actualConsumption * 0.15);
  
  // Meals saved = difference between unmanaged waste and current controlled surplus
  const mealsSaved = Math.max(0, unmanagedExpectedWaste - surplusMeals);
  const foodSavedKg = Number((mealsSaved * KG_PER_MEAL).toFixed(2));
  const costSavedInr = Number((mealsSaved * costPerMeal).toFixed(2));
  const co2AvoidedKg = Number((foodSavedKg * CO2E_PER_KG_FOOD).toFixed(2));
  const waterAvoidedLiters = Number((foodSavedKg * WATER_LITERS_PER_KG_FOOD).toFixed(1));

  return {
    mealsSaved,
    foodSavedKg,
    costSavedInr,
    co2AvoidedKg,
    waterAvoidedLiters,
  };
}

/**
 * Dynamically recommends a buffer percentage based on historical prediction errors.
 * Formula: recommendedBuffer = historicalAvgError% + safetyMargin
 * Clamped strictly between minBuffer and maxBuffer (e.g. 3% to 15%).
 */
export function recommendDynamicBuffer(
  historicalErrors: number[],
  minBuffer: number = 3.0,
  maxBuffer: number = 15.0,
  baseBuffer: number = 5.0,
  mealType: string = 'Meal'
): { recommendedBuffer: number; reasoning: string } {
  if (!historicalErrors || historicalErrors.length === 0) {
    return {
      recommendedBuffer: baseBuffer,
      reasoning: `No historical error data yet for ${mealType}. Using standard baseline buffer of ${baseBuffer}%.`,
    };
  }

  // Weight recent errors more heavily
  const recent = historicalErrors.slice(-10);
  const avgError = recent.reduce((sum, val) => sum + val, 0) / recent.length;

  // Add margin for variance, clamp to min and max
  const rawRecommendation = avgError * 0.8 + 2.0;
  const clampedRecommendation = Number(Math.max(minBuffer, Math.min(maxBuffer, rawRecommendation)).toFixed(1));

  let reasoning = '';
  if (clampedRecommendation > baseBuffer) {
    reasoning = `Recent ${mealType} predictions were off by an average of ${avgError.toFixed(1)}%, so the recommended buffer increased from ${baseBuffer}% to ${clampedRecommendation}% to prevent shortage risk.`;
  } else if (clampedRecommendation < baseBuffer) {
    reasoning = `Recent ${mealType} predictions exhibited high stability (average variance ${avgError.toFixed(1)}%), allowing the buffer to be safely tightened from ${baseBuffer}% to ${clampedRecommendation}% to avoid food waste.`;
  } else {
    reasoning = `Recent ${mealType} predictions tracked attendance closely (average error ${avgError.toFixed(1)}%). Standard ${baseBuffer}% safety buffer maintained.`;
  }

  return {
    recommendedBuffer: clampedRecommendation,
    reasoning,
  };
}
