import React from 'react';
import { MetricsCards } from '../components/MetricsCards';
import { ChartsSection } from '../components/Charts';
import { CampusBreakdown } from '../components/CampusBreakdown';
import { DashboardWelcome } from '../components/DashboardWelcome';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <DashboardWelcome userName={user?.names || 'User'} />

      <MetricsCards />
      <ChartsSection />
      <CampusBreakdown />
    </div>
  );
};
