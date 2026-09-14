import { PrismaClient, Role, MealType, MealStatus, ConsumptionStatus, WasteCategory, DisposalMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedPrisma() {
  console.log('🌱 Starting Prisma PostgreSQL database seeding...');

  try {
    // 1. Seed Users with securely hashed passwords
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const staffPasswordHash = await bcrypt.hash('Chef@123', salt);
    const studentPasswordHash = await bcrypt.hash('Student@123', salt);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@campus.edu' },
      update: {},
      create: {
        email: 'admin@campus.edu',
        password_hash: adminPasswordHash,
        name: 'Dr. Rajesh Sharma',
        role: Role.ADMIN,
      },
    });

    const staff = await prisma.user.upsert({
      where: { email: 'chef.ramesh@campus.edu' },
      update: {},
      create: {
        email: 'chef.ramesh@campus.edu',
        password_hash: staffPasswordHash,
        name: 'Chef Ramesh Kumar',
        role: Role.STAFF,
      },
    });

    const student = await prisma.user.upsert({
      where: { email: 'aarav.patel@campus.edu' },
      update: {},
      create: {
        email: 'aarav.patel@campus.edu',
        password_hash: studentPasswordHash,
        name: 'Aarav Patel',
        role: Role.STUDENT,
      },
    });

    console.log('✅ Users seeded successfully:', { admin: admin.email, staff: staff.email, student: student.email });

    // 2. Seed Buffer Configurations
    const configs = [
      { meal_type: MealType.Breakfast, base: 5.0, min: 3.0, max: 12.0 },
      { meal_type: MealType.Lunch, base: 5.0, min: 3.0, max: 15.0 },
      { meal_type: MealType.Snacks, base: 4.0, min: 2.0, max: 10.0 },
      { meal_type: MealType.Dinner, base: 5.0, min: 3.0, max: 15.0 },
    ];

    for (const c of configs) {
      await prisma.bufferConfiguration.upsert({
        where: { meal_type: c.meal_type },
        update: {
          base_buffer_percent: c.base,
          min_buffer_percent: c.min,
          max_buffer_percent: c.max,
        },
        create: {
          meal_type: c.meal_type,
          base_buffer_percent: c.base,
          min_buffer_percent: c.min,
          max_buffer_percent: c.max,
          auto_adjust_enabled: true,
        },
      });
    }
    console.log('✅ Buffer configurations seeded.');

    // 3. Seed Meals, Predictions, Consumption, Waste & Impact
    const sampleMeals = [
      {
        date: '2026-09-05',
        type: MealType.Lunch,
        menu: 'Rajma Masala, Steamed Basmati Rice, Fresh Roti, Cucumber Raita, Gulab Jamun',
        status: MealStatus.COMPLETED,
        pred: 395,
        bufPct: 5.0,
        bufAmt: 20,
        prep: 415,
        cooked: 415,
        consumed: 405,
        leftover: 10,
        cStatus: ConsumptionStatus.BUFFER_USED,
        wasteKg: 4.2,
        wCat: WasteCategory.LEFTOVER_SURPLUS,
        disp: DisposalMethod.BIOGAS_CONVERSION,
        costLoss: 210,
        savedKg: 18.5,
        savedInr: 925,
        co2: 46.2,
        water: 3700,
      },
      {
        date: '2026-09-08',
        type: MealType.Dinner,
        menu: 'Paneer Butter Masala, Butter Naan, Veg Pulao, Mix Veg Curry, Rasgulla',
        status: MealStatus.COMPLETED,
        pred: 400,
        bufPct: 5.0,
        bufAmt: 20,
        prep: 420,
        cooked: 420,
        consumed: 445,
        leftover: 0,
        cStatus: ConsumptionStatus.SHORTAGE_RISK, // DEMAND EXCEEDED PLAN scenario
        wasteKg: 0.5,
        wCat: WasteCategory.PLATE_WASTE,
        disp: DisposalMethod.COMPOSTING,
        costLoss: 25,
        savedKg: 12.0,
        savedInr: 600,
        co2: 30.0,
        water: 2400,
      },
      {
        date: '2026-09-11',
        type: MealType.Lunch,
        menu: 'Chole Bhature, Steamed Jeera Rice, Boondi Raita, Green Salad, Fruit Custard',
        status: MealStatus.SERVED,
        pred: 400,
        bufPct: 5.0,
        bufAmt: 20,
        prep: 420,
        cooked: 420,
        consumed: 410,
        leftover: 10,
        cStatus: ConsumptionStatus.BUFFER_USED,
        wasteKg: 2.1,
        wCat: WasteCategory.LEFTOVER_SURPLUS,
        disp: DisposalMethod.DONATION,
        costLoss: 105,
        savedKg: 22.4,
        savedInr: 1120,
        co2: 56.0,
        water: 4480,
      },
      {
        date: '2026-09-12',
        type: MealType.Lunch,
        menu: 'Paneer Bhurji, Dal Makhani, Tandoori Roti, Jeera Rice, Salad, Kheer',
        status: MealStatus.SCHEDULED,
        pred: 405,
        bufPct: 5.0,
        bufAmt: 20,
        prep: 425,
      },
    ];

    for (const m of sampleMeals) {
      const meal = await prisma.meal.upsert({
        where: {
          date_meal_type: {
            date: m.date,
            meal_type: m.type,
          },
        },
        update: {
          status: m.status,
          menu: m.menu,
        },
        create: {
          date: m.date,
          meal_type: m.type,
          menu: m.menu,
          status: m.status,
          price: 50.0,
        },
      });

      // Prediction
      await prisma.mealPrediction.upsert({
        where: { meal_id: meal.id },
        update: {
          predicted_demand: m.pred,
          recommended_buffer_percent: m.bufPct,
          buffer_amount: m.bufAmt,
          recommended_preparation: m.prep,
        },
        create: {
          meal_id: meal.id,
          predicted_demand: m.pred,
          confidence_score: 0.96,
          recommended_buffer_percent: m.bufPct,
          buffer_amount: m.bufAmt,
          recommended_preparation: m.prep,
        },
      });

      // Consumption if completed or served
      if (m.cooked && m.consumed) {
        await prisma.consumption.upsert({
          where: { meal_id: meal.id },
          update: {
            actual_cooked: m.cooked,
            actual_consumption: m.consumed,
            leftover_amount: m.leftover || 0,
            shortage_amount: m.consumed > m.prep ? m.consumed - m.prep : 0,
            buffer_used_amount: m.consumed > m.pred ? Math.min(m.consumed - m.pred, m.bufAmt) : 0,
            status: m.cStatus,
            logged_by_id: staff.id,
          },
          create: {
            meal_id: meal.id,
            actual_cooked: m.cooked,
            actual_consumption: m.consumed,
            leftover_amount: m.leftover || 0,
            shortage_amount: m.consumed > m.prep ? m.consumed - m.prep : 0,
            buffer_used_amount: m.consumed > m.pred ? Math.min(m.consumed - m.pred, m.bufAmt) : 0,
            status: m.cStatus,
            logged_by_id: staff.id,
          },
        });
      }

      // Waste record if completed
      if (m.wasteKg) {
        await prisma.wasteRecord.create({
          data: {
            meal_id: meal.id,
            waste_kg: m.wasteKg,
            waste_category: m.wCat || WasteCategory.LEFTOVER_SURPLUS,
            disposal_method: m.disp || DisposalMethod.COMPOSTING,
            cost_loss: m.costLoss || 0.0,
            logged_by_id: staff.id,
            notes: 'Recorded during evening kitchen audit',
          },
        });
      }

      // Impact record
      if (m.savedKg) {
        await prisma.impactRecord.upsert({
          where: { meal_id: meal.id },
          update: {
            food_saved_kg: m.savedKg,
            cost_saved_inr: m.savedInr,
            co2_avoided_kg: m.co2,
            water_saved_litres: m.water,
          },
          create: {
            meal_id: meal.id,
            food_saved_kg: m.savedKg,
            cost_saved_inr: m.savedInr,
            co2_avoided_kg: m.co2,
            water_saved_litres: m.water,
          },
        });
      }
    }

    console.log('🎉 Prisma PostgreSQL seeding finished successfully!');
  } catch (err) {
    console.error('Prisma seed error (handled):', err);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  seedPrisma();
}
