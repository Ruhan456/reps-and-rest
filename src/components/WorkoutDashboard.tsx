import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Dumbbell, Flame, Target, TrendingUp } from 'lucide-react';

interface WorkoutSplit {
  id: string;
  name: string;
  days: string[];
  currentDay: number;
  lastWorkoutDate: string | null;
}

interface WorkoutDashboardProps {
  onStartWorkout: () => void;
  onViewSplit: () => void;
  onViewProgress: () => void;
}

export const WorkoutDashboard = ({ onStartWorkout, onViewSplit, onViewProgress }: WorkoutDashboardProps) => {
  const [currentSplit, setCurrentSplit] = useState<WorkoutSplit>({
    id: '1',
    name: 'Push/Pull/Legs',
    days: ['Push', 'Pull', 'Legs', 'Rest', 'Push', 'Pull', 'Legs'],
    currentDay: 0,
    lastWorkoutDate: null
  });
  
  const [streak, setStreak] = useState(0);
  const [weekProgress, setWeekProgress] = useState(3);

  useEffect(() => {
    // Load saved data from localStorage
    const savedSplit = localStorage.getItem('workoutSplit');
    const savedStreak = localStorage.getItem('workoutStreak');
    
    if (savedSplit) {
      setCurrentSplit(JSON.parse(savedSplit));
    }
    if (savedStreak) {
      setStreak(parseInt(savedStreak));
    }
  }, []);

  const getCurrentWorkout = () => {
    return currentSplit.days[currentSplit.currentDay];
  };

  const getStreakColor = () => {
    if (streak >= 30) return 'streak-gold';
    if (streak >= 14) return 'success';
    if (streak >= 7) return 'accent';
    return 'primary';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Samsung Fitness
        </h1>
        <p className="text-muted-foreground">Track your workout journey</p>
      </div>

      {/* Current Workout Card */}
      <Card className="p-6 bg-gradient-card shadow-elevated border-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Today's Workout</h2>
              <p className="text-sm text-muted-foreground">{currentSplit.name}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Day {currentSplit.currentDay + 1}
          </Badge>
        </div>

        <div className="mb-6">
          <div className="text-2xl font-bold mb-2">{getCurrentWorkout()}</div>
          {getCurrentWorkout() === 'Rest' ? (
            <p className="text-muted-foreground">Recovery day - let your muscles rebuild</p>
          ) : (
            <p className="text-muted-foreground">Ready to crush today's session?</p>
          )}
        </div>

        <Button 
          onClick={onStartWorkout}
          className="w-full bg-gradient-accent hover:opacity-90 transition-all duration-300 shadow-glow h-12 text-lg font-semibold"
          disabled={getCurrentWorkout() === 'Rest'}
        >
          {getCurrentWorkout() === 'Rest' ? 'Rest Day' : 'Start Workout'}
        </Button>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-card shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 bg-${getStreakColor()} rounded-lg`}>
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-2xl font-bold">{streak}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Days consistent</p>
        </Card>

        <Card className="p-4 bg-gradient-card shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-success rounded-lg">
              <Target className="h-5 w-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{weekProgress}/7</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Workouts completed</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          onClick={onViewSplit}
          className="h-16 flex flex-col gap-2 border-border hover:bg-accent/10"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-sm">Workout Split</span>
        </Button>

        <Button 
          variant="outline" 
          onClick={onViewProgress}
          className="h-16 flex flex-col gap-2 border-border hover:bg-accent/10"
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm">Progress</span>
        </Button>
      </div>

      {/* Weekly Overview */}
      <Card className="p-4 bg-gradient-card shadow-card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          This Week's Plan
        </h3>
        <div className="flex gap-2">
          {currentSplit.days.map((day, index) => (
            <div 
              key={index}
              className={`flex-1 p-2 rounded-lg text-center text-xs font-medium transition-all ${
                index === currentSplit.currentDay 
                  ? 'bg-gradient-accent text-accent-foreground shadow-glow' 
                  : index < currentSplit.currentDay
                  ? 'bg-success text-success-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};