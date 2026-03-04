
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GlobalProvider } from './contexts/GlobalContext';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { LandingPage } from './pages/LandingPage'; // Was LoginPage
import { LoadingScreen } from './components/LoadingScreen'; // Need to create or use inline

// Lazy load pages for performance
const Dashboard = lazy(() => import('../components/Dashboard').then(module => ({ default: module.Dashboard })));
const TimerPage = lazy(() => import('../pages/TimerPage').then(module => ({ default: module.TimerPage })));
const StatsPage = lazy(() => import('../components/StatsPage').then(module => ({ default: module.StatsPage })));
const ExamTracker = lazy(() => import('../components/ExamTracker/ExamTracker').then(module => ({ default: module.ExamTracker })));
const HabitsPage = lazy(() => import('../components/HabitsPage').then(module => ({ default: module.HabitsPage })));
const JournalPage = lazy(() => import('../components/JournalPage').then(module => ({ default: module.JournalPage })));
const PlanPage = lazy(() => import('../components/PlanPage').then(module => ({ default: module.PlanPage })));
const SocialPanel = lazy(() => import('../components/SocialPanel').then(module => ({ default: module.SocialPanel })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(module => ({ default: module.SettingsPage })));

// Auth Guard Component
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
    const { currentUser, isGuest, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!currentUser && !isGuest) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

// Public Route Guard (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
    const { currentUser, isGuest, loading } = useAuth();
    
    if (loading) {
        return <LoadingScreen />;
    }

    if (currentUser || isGuest) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={
                    <PublicRoute>
                        <LandingPage />
                    </PublicRoute>
                } />

                {/* Protected Routes wrapped in Layout */}
                <Route element={
                    <RequireAuth>
                        <Layout />
                    </RequireAuth>
                }>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/timer" element={<TimerPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/exams" element={<ExamTracker />} />
                    <Route path="/habits" element={<HabitsPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/plan" element={<PlanPage />} />
                    <Route path="/leaderboard" element={<SocialPanel />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

import { TimerProvider } from './contexts/TimerContext';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <GlobalProvider>
                <TimerProvider>
                    <AppRoutes />
                </TimerProvider>
            </GlobalProvider>
        </BrowserRouter>
    );
};

export default App;
