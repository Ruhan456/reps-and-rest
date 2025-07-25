import { useState } from 'react';
import { WorkoutDashboard } from '@/components/WorkoutDashboard';
import { WorkoutTracker } from '@/components/WorkoutTracker';
import { WorkoutSplitManager } from '@/components/WorkoutSplitManager';
import { ProgressTracker } from '@/components/ProgressTracker';

type View = 'dashboard' | 'workout' | 'split' | 'progress';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentWorkoutType, setCurrentWorkoutType] = useState<string>('');

  const handleStartWorkout = () => {
    // Get current workout type from localStorage
    const savedSplit = localStorage.getItem('workoutSplit');
    if (savedSplit) {
      const split = JSON.parse(savedSplit);
      const workoutType = split.days[split.currentDay];
      if (workoutType !== 'Rest') {
        setCurrentWorkoutType(workoutType);
        setCurrentView('workout');
      }
    }
  };

  const handleCompleteWorkout = () => {
    // Update the current day in the split
    const savedSplit = localStorage.getItem('workoutSplit');
    if (savedSplit) {
      const split = JSON.parse(savedSplit);
      const nextDay = (split.currentDay + 1) % split.days.length;
      const updatedSplit = { ...split, currentDay: nextDay, lastWorkoutDate: new Date().toISOString() };
      localStorage.setItem('workoutSplit', JSON.stringify(updatedSplit));
    }
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'workout':
        return (
          <WorkoutTracker
            workoutType={currentWorkoutType}
            onBack={() => setCurrentView('dashboard')}
            onComplete={handleCompleteWorkout}
          />
        );
      case 'split':
        return (
          <WorkoutSplitManager
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'progress':
        return (
          <ProgressTracker
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return (
          <WorkoutDashboard
            onStartWorkout={handleStartWorkout}
            onViewSplit={() => setCurrentView('split')}
            onViewProgress={() => setCurrentView('progress')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderView()}
    </div>
  );
};

export default Index;
