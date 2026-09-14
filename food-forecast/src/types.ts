export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  hostel?: string;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
export type MealStatus = 'PLANNED' | 'PREPARED' | 'SERVING' | 'COMPLETED';
export type ConsumptionStatus = 'SAFE' | 'BUFFER_USED' | 'SHORTAGE_RISK' | 'SURPLUS_RISK';

export interface MealPrediction {
  id?: number;
  meal_id?: number;
  predicted_demand: number;
  recommended_buffer_percent: number;
  buffer_amount: number;
  recommended_preparation: number;
  confidence_score: number;
  reasoning: string;
  factors?: string;
}

export interface MealConsumption {
  id?: number;
  meal_id?: number;
  actual_preparation: number;
  actual_consumption: number;
  surplus: number;
  shortage: number;
  buffer_utilized: number;
  buffer_depleted: number;
  status: ConsumptionStatus;
  recorded_at?: string;
}

export interface WasteRecord {
  id?: number;
  meal_id?: number;
  leftover_meals: number;
  leftover_weight_kg: number;
  waste_reason?: string;
  action_taken?: string;
  avoidable_waste_percent?: number;
}

export interface ImpactRecord {
  id?: number;
  meal_id?: number;
  food_saved_kg: number;
  meals_saved: number;
  cost_saved_inr: number;
  co2_avoided_kg: number;
  water_avoided_liters: number;
}

export interface Meal {
  id: number;
  date: string;
  meal_type: MealType;
  menu: string;
  expected_attendance: number;
  cost_per_meal: number;
  status: MealStatus;
  // Joined fields
  predicted_demand?: number;
  recommended_buffer_percent?: number;
  buffer_amount?: number;
  recommended_preparation?: number;
  confidence_score?: number;
  reasoning?: string;
  actual_preparation?: number;
  actual_consumption?: number;
  surplus?: number;
  shortage?: number;
  buffer_utilized?: number;
  buffer_depleted?: number;
  consumption_status?: ConsumptionStatus;
  leftover_meals?: number;
  leftover_weight_kg?: number;
  waste_reason?: string;
  action_taken?: string;
  food_saved_kg?: number;
  meals_saved?: number;
  cost_saved_inr?: number;
  co2_avoided_kg?: number;
  water_avoided_liters?: number;
  confirmed_students?: number;
  opted_out_students?: number;
}

export interface BufferConfig {
  id: number;
  meal_type: string;
  base_buffer_percent: number;
  min_buffer_percent: number;
  max_buffer_percent: number;
  historical_weight: number;
  auto_adjust_enabled: number;
  updated_at?: string;
}

export interface FeedbackItem {
  id: number;
  meal_id: number;
  user_id: number;
  student_name?: string;
  meal_type?: string;
  date?: string;
  menu?: string;
  rating: number;
  taste_rating: number;
  portion_rating: number;
  comments: string;
  would_eat_again: number;
  created_at: string;
}

export interface StudentIntention {
  id: number;
  meal_id: number;
  user_id: number;
  attending: number;
  diet_preference: string;
  date?: string;
  meal_type?: string;
  menu?: string;
}

export interface DashboardSummary {
  currentMeal: Meal | null;
  metrics: {
    foodSavedKg: number;
    mealsSaved: number;
    costSavedInr: number;
    co2AvoidedKg: number;
    waterAvoidedLiters: number;
    totalMealsServed: number;
    predictionAccuracy: number;
    wasteReductionPercent: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success' | 'danger';
    title: string;
    message: string;
    timestamp: string;
  }>;
}

export interface QueryAssistantResult {
  query: string;
  intent: string;
  answer: string;
  highlightData?: any;
  suggestedFollowUps: string[];
  isAiPowered: boolean;
}
