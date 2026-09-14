-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'STAFF', 'ADMIN');
CREATE TYPE "MealType" AS ENUM ('Breakfast', 'Lunch', 'Snacks', 'Dinner');
CREATE TYPE "MealStatus" AS ENUM ('SCHEDULED', 'PREPARING', 'SERVED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ConsumptionStatus" AS ENUM ('SAFE', 'BUFFER_USED', 'SHORTAGE_RISK');
CREATE TYPE "WasteCategory" AS ENUM ('PREPARATION_SCRAPS', 'LEFTOVER_SURPLUS', 'PLATE_WASTE', 'SPOILED_STORAGE');
CREATE TYPE "DisposalMethod" AS ENUM ('DONATION', 'BIOGAS_CONVERSION', 'COMPOSTING', 'MUNICIPAL_DISPOSAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "menu" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "status" "MealStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_predictions" (
    "id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "predicted_demand" INTEGER NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "recommended_buffer_percent" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "buffer_amount" INTEGER NOT NULL DEFAULT 20,
    "recommended_preparation" INTEGER NOT NULL DEFAULT 420,
    "calculation_factors" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption" (
    "id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "actual_cooked" INTEGER NOT NULL,
    "actual_consumption" INTEGER NOT NULL,
    "leftover_amount" INTEGER NOT NULL DEFAULT 0,
    "shortage_amount" INTEGER NOT NULL DEFAULT 0,
    "buffer_used_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "ConsumptionStatus" NOT NULL DEFAULT 'SAFE',
    "logged_by_id" INTEGER,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_records" (
    "id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "waste_kg" DOUBLE PRECISION NOT NULL,
    "waste_category" "WasteCategory" NOT NULL DEFAULT 'LEFTOVER_SURPLUS',
    "disposal_method" "DisposalMethod" NOT NULL DEFAULT 'COMPOSTING',
    "cost_loss" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "logged_by_id" INTEGER,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buffer_configurations" (
    "id" SERIAL NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "base_buffer_percent" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "min_buffer_percent" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "max_buffer_percent" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "auto_adjust_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buffer_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "taste_rating" INTEGER NOT NULL DEFAULT 5,
    "portion_rating" INTEGER NOT NULL DEFAULT 4,
    "comments" TEXT,
    "would_eat_again" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "query" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'LOCAL_ANALYTICS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_records" (
    "id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "food_saved_kg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cost_saved_inr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "co2_avoided_kg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "water_saved_litres" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impact_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_intentions" (
    "id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attending" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_intentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "meals_date_meal_type_key" ON "meals"("date", "meal_type");
CREATE UNIQUE INDEX "meal_predictions_meal_id_key" ON "meal_predictions"("meal_id");
CREATE UNIQUE INDEX "consumption_meal_id_key" ON "consumption"("meal_id");
CREATE UNIQUE INDEX "buffer_configurations_meal_type_key" ON "buffer_configurations"("meal_type");
CREATE UNIQUE INDEX "impact_records_meal_id_key" ON "impact_records"("meal_id");
CREATE UNIQUE INDEX "student_intentions_meal_id_user_id_key" ON "student_intentions"("meal_id", "user_id");

-- AddForeignKey
ALTER TABLE "meal_predictions" ADD CONSTRAINT "meal_predictions_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consumption" ADD CONSTRAINT "consumption_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consumption" ADD CONSTRAINT "consumption_logged_by_id_fkey" FOREIGN KEY ("logged_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "waste_records" ADD CONSTRAINT "waste_records_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "waste_records" ADD CONSTRAINT "waste_records_logged_by_id_fkey" FOREIGN KEY ("logged_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "query_history" ADD CONSTRAINT "query_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "impact_records" ADD CONSTRAINT "impact_records_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_intentions" ADD CONSTRAINT "student_intentions_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_intentions" ADD CONSTRAINT "student_intentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
