import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { MealsView } from './components/MealsView';
import { PredictionsView } from './components/PredictionsView';
import { ConsumptionView } from './components/ConsumptionView';
import { WasteView } from './components/WasteView';
import { AnalyticsView } from './components/AnalyticsView';
import { QueryAssistantView } from './components/QueryAssistantView';
import { FeedbackView } from './components/FeedbackView';
import { SettingsView } from './components/SettingsView';
import { SimulatorView } from './components/SimulatorView';
import { LoginView } from './components/LoginView';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [consumptionMealId, setConsumptionMealId] = useState<number | null>(null);

  const handleLogConsumptionFromMeals = (mealId: number) => {
    setConsumptionMealId(mealId);
    setCurrentTab('consumption');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03060a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#10f072] border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(16,240,114,0.5)]" />
          <p className="text-xs text-slate-400 font-medium">Connecting to FOOD FORECAST secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shiny-black text-slate-100 font-sans flex flex-col selection:bg-[#10f072] selection:text-black">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setShowLanding(false);
          setCurrentTab(tab);
        }}
        showLanding={showLanding}
        setShowLanding={setShowLanding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {showLanding ? (
          <LandingPage onEnterDashboard={() => setShowLanding(false)} />
        ) : !isAuthenticated || currentTab === 'login' ? (
          <LoginView onSuccess={() => setCurrentTab('dashboard')} />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />
            )}
            {currentTab === 'meals' && (
              <MealsView onLogConsumption={handleLogConsumptionFromMeals} />
            )}
            {currentTab === 'predictions' && <PredictionsView />}
            {currentTab === 'simulator' && <SimulatorView />}
            {currentTab === 'consumption' && (
              <ConsumptionView
                initialMealId={consumptionMealId}
                onSuccess={() => {
                  // Optionally navigate back to dashboard or meals
                }}
              />
            )}
            {currentTab === 'waste' && <WasteView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'queries' && <QueryAssistantView />}
            {currentTab === 'feedback' && <FeedbackView />}
            {currentTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
