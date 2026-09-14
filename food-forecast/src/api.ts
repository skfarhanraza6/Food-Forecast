import {
  User,
  Meal,
  DashboardSummary,
  BufferConfig,
  FeedbackItem,
  StudentIntention,
  QueryAssistantResult,
} from './types';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('food_forecast_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  demoLogin: (role: 'STUDENT' | 'STAFF' | 'ADMIN') =>
    request<{ token: string; user: User }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  register: (name: string, email: string, password: string, role: string, hostel?: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, hostel }),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Dashboard & Analytics
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),

  getAnalyticsCharts: () =>
    request<{
      attendanceComparison: Array<{
        label: string;
        date: string;
        mealType: string;
        predicted: number;
        recommendedPrep: number;
        actual: number;
        actualPrep: number;
        surplus: number;
        shortage: number;
      }>;
      wasteTrend: Array<{
        label: string;
        leftoverKg: number;
        leftoverMeals: number;
        foodSavedKg: number;
        costSaved: number;
      }>;
      bufferDistribution: Array<{ name: string; value: number; color: string }>;
      mealTypeBreakdown: Array<{
        mealType: string;
        avgAttendance: number;
        avgWasteKg: number;
        varianceMeals: number;
      }>;
    }>('/analytics/charts'),

  // Meals
  getMeals: (params?: { date?: string; status?: string; mealType?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.mealType) searchParams.append('mealType', params.mealType);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ meals: Meal[] }>(`/meals${queryStr}`);
  },

  getMealById: (id: number) =>
    request<{ meal: Meal; intentions: StudentIntention[]; feedback: FeedbackItem[] }>(`/meals/${id}`),

  createMeal: (data: { date: string; mealType: string; menu: string; expectedAttendance: number; costPerMeal?: number }) =>
    request<{ meal: Meal; prediction: any }>('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMeal: (id: number, data: Partial<Meal>) =>
    request<{ message: string }>(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMeal: (id: number) =>
    request<{ message: string }>(`/meals/${id}`, {
      method: 'DELETE',
    }),

  // Predictions & Buffer
  calculatePrediction: (data: { mealType: string; date?: string; expectedAttendance?: number }) =>
    request<{ prediction: any }>('/predictions/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPredictionAccuracy: () =>
    request<{
      avgAccuracy: number;
      avgError: number;
      totalRecords: number;
      recentHistory: any[];
    }>('/predictions/accuracy'),

  // Consumption & Waste
  logConsumption: (data: {
    mealId: number;
    actualPreparation: number;
    actualConsumption: number;
    leftoverWeightKg?: number;
    wasteReason?: string;
    actionTaken?: string;
  }) =>
    request<{ message: string; metrics: any; impact: any }>('/consumption', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Buffer Configs
  getBufferConfigs: () => request<{ configs: BufferConfig[] }>('/buffer-config'),

  updateBufferConfig: (mealType: string, data: Partial<BufferConfig>) =>
    request<{ message: string }>(`/buffer-config/${mealType}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Student Intentions & Feedback
  getMyIntentions: () => request<{ intentions: StudentIntention[] }>('/intentions/my'),

  setMealIntention: (mealId: number, attending: boolean, dietPreference?: string) =>
    request<{ message: string }>('/intentions', {
      method: 'POST',
      body: JSON.stringify({ mealId, attending, dietPreference }),
    }),

  getFeedback: () => request<{ feedback: FeedbackItem[] }>('/feedback'),

  submitFeedback: (data: {
    mealId: number;
    rating: number;
    tasteRating?: number;
    portionRating?: number;
    comments?: string;
    wouldEatAgain?: boolean;
  }) =>
    request<{ message: string }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Queries / AI Assistant
  askQuery: (queryText: string) =>
    request<QueryAssistantResult>('/query', {
      method: 'POST',
      body: JSON.stringify({ queryText }),
    }),

  getQueryHistory: () => request<{ history: any[] }>('/query/history'),

  // What-If Demand Simulator
  simulateDemand: (data: {
    mealId?: number;
    additionalStudents: number;
    manualPreparationOverride?: number;
    applyScenario?: boolean;
  }) =>
    request<{
      mealId: number;
      mealType: string;
      date: string;
      basePrediction: number;
      bufferPercent: number;
      bufferAmount: number;
      currentPreparation: number;
      additionalStudents: number;
      newExpectedDemand: number;
      bufferRemaining: number;
      shortage: number;
      status: 'SAFE' | 'BUFFER_USED' | 'SHORTAGE_RISK';
      recommendedAction: string;
      applied: boolean;
    }>('/simulator/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin Reset
  resetDatabase: () =>
    request<{ message: string }>('/admin/reset-data', {
      method: 'POST',
    }),
};
