import { getDb, run } from './db.ts';

export async function initSchema(): Promise<void> {
  await getDb();

  // Users table
  run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'STAFF', 'ADMIN')),
      hostel TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Buffer Configurations table
  run(`
    CREATE TABLE IF NOT EXISTS buffer_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_type TEXT NOT NULL UNIQUE,
      base_buffer_percent REAL NOT NULL DEFAULT 5.0,
      min_buffer_percent REAL NOT NULL DEFAULT 3.0,
      max_buffer_percent REAL NOT NULL DEFAULT 15.0,
      historical_weight REAL NOT NULL DEFAULT 0.7,
      auto_adjust_enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );
  `);

  // Meals table
  run(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('Breakfast', 'Lunch', 'Snacks', 'Dinner')),
      menu TEXT NOT NULL,
      expected_attendance INTEGER NOT NULL DEFAULT 0,
      cost_per_meal REAL NOT NULL DEFAULT 45.0,
      status TEXT NOT NULL DEFAULT 'PLANNED' CHECK(status IN ('PLANNED', 'PREPARED', 'SERVING', 'COMPLETED')),
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
  `);

  // Meal Predictions table
  run(`
    CREATE TABLE IF NOT EXISTS meal_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL UNIQUE,
      predicted_demand INTEGER NOT NULL,
      recommended_buffer_percent REAL NOT NULL,
      buffer_amount INTEGER NOT NULL,
      recommended_preparation INTEGER NOT NULL,
      confidence_score REAL NOT NULL DEFAULT 0.85,
      algorithm_version TEXT DEFAULT 'v1-adaptive',
      reasoning TEXT,
      factors TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );
  `);

  // Consumption table
  run(`
    CREATE TABLE IF NOT EXISTS consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL UNIQUE,
      actual_preparation INTEGER NOT NULL,
      actual_consumption INTEGER NOT NULL,
      surplus INTEGER NOT NULL DEFAULT 0,
      shortage INTEGER NOT NULL DEFAULT 0,
      buffer_utilized INTEGER NOT NULL DEFAULT 0,
      buffer_depleted INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('SAFE', 'BUFFER_USED', 'SHORTAGE_RISK', 'SURPLUS_RISK')),
      recorded_by INTEGER,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meal_id) REFERENCES meals(id) ON DELETE CASCADE,
      FOREIGN KEY(recorded_by) REFERENCES users(id)
    );
  `);

  // Waste Records table
  run(`
    CREATE TABLE IF NOT EXISTS waste_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL UNIQUE,
      leftover_meals INTEGER NOT NULL DEFAULT 0,
      leftover_weight_kg REAL NOT NULL DEFAULT 0,
      waste_reason TEXT,
      action_taken TEXT,
      avoidable_waste_percent REAL DEFAULT 0,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );
  `);

  // Impact Records table
  run(`
    CREATE TABLE IF NOT EXISTS impact_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL UNIQUE,
      food_saved_kg REAL NOT NULL DEFAULT 0,
      meals_saved INTEGER NOT NULL DEFAULT 0,
      cost_saved_inr REAL NOT NULL DEFAULT 0,
      co2_avoided_kg REAL NOT NULL DEFAULT 0,
      water_avoided_liters REAL NOT NULL DEFAULT 0,
      calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );
  `);

  // Feedback table
  run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      taste_rating INTEGER,
      portion_rating INTEGER,
      comments TEXT,
      would_eat_again INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meal_id) REFERENCES meals(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Query History table
  run(`
    CREATE TABLE IF NOT EXISTS query_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query_text TEXT NOT NULL,
      intent TEXT NOT NULL,
      response_text TEXT NOT NULL,
      data_payload TEXT,
      is_ai_powered INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Student Intentions table
  run(`
    CREATE TABLE IF NOT EXISTS student_meal_intentions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      attending INTEGER NOT NULL DEFAULT 1,
      diet_preference TEXT DEFAULT 'REGULAR',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(meal_id, user_id),
      FOREIGN KEY(meal_id) REFERENCES meals(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Indexes for performance
  run(`CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);`);
  run(`CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON meals(meal_type);`);
  run(`CREATE INDEX IF NOT EXISTS idx_intentions_meal ON student_meal_intentions(meal_id);`);
  run(`CREATE INDEX IF NOT EXISTS idx_feedback_meal ON feedback(meal_id);`);
}
