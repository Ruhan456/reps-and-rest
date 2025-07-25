import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Calendar, Target, Award, Flame } from 'lucide-react';

interface WorkoutHistory {
  date: string;
  type: string;
  exercises: {
    name: string;
    weight: number;
    reps: number;
  }[];
}

interface ProgressTrackerProps {
  onBack: () => void;
}

export const ProgressTracker = ({ onBack }: ProgressTrackerProps) => {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [strongestLifts, setStrongestLifts] = useState<{[key: string]: {weight: number; reps: number}}>({});

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = () => {
    // Load streak
    const savedStreak = localStorage.getItem('workoutStreak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak));
    }

    // Load workout history
    const history: WorkoutHistory[] = [];
    const exercises = [
      'Bench Press', 'Deadlift', 'Squats', 'Overhead Press', 'Pull-ups',
      'Barbell Rows', 'Incline Dumbbell Press', 'Romanian Deadlift'
    ];

    const lifts: {[key: string]: {weight: number; reps: number}} = {};

    exercises.forEach(exercise => {
      const savedData = localStorage.getItem(`lastWorkout-${exercise}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        lifts[exercise] = { weight: data.weight, reps: data.reps };
      }
    });

    setStrongestLifts(lifts);
    setTotalWorkouts(Object.keys(lifts).length);
  };

  const getStreakColor = () => {
    if (streak >= 30) return 'streak-gold';
    if (streak >= 14) return 'success';
    if (streak >= 7) return 'accent';
    return 'primary';
  };

  const getStreakMessage = () => {
    if (streak >= 30) return 'Champion Level! 🏆';
    if (streak >= 14) return 'On Fire! 🔥';
    if (streak >= 7) return 'Building Momentum! 💪';
    if (streak >= 3) return 'Getting Started! 🌟';
    return 'Every Journey Begins! 🚀';
  };

  const calculateOneRepMax = (weight: number, reps: number) => {
    // Epley formula: 1RM = weight × (1 + reps/30)
    return Math.round(weight * (1 + reps / 30));
  };

  const getTopLifts = () => {
    return Object.entries(strongestLifts)
      .map(([exercise, data]) => ({
        exercise,
        weight: data.weight,
        reps: data.reps,
        oneRepMax: calculateOneRepMax(data.weight, data.reps)
      }))
      .sort((a, b) => b.oneRepMax - a.oneRepMax)
      .slice(0, 5);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Progress Tracker</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Streak Card */}
      <Card className="p-6 bg-gradient-card shadow-elevated text-center">
        <div className="flex justify-center mb-4">
          <div className={`p-4 bg-${getStreakColor()} rounded-full shadow-glow`}>
            <Flame className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="text-4xl font-bold mb-2">{streak}</div>
        <div className="text-lg font-semibold mb-1">Day Streak</div>
        <div className="text-sm text-muted-foreground">{getStreakMessage()}</div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-card shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold">{totalWorkouts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-accent rounded-lg">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{Math.min(streak, 30)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg text-center ${streak >= 7 ? 'bg-gradient-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
            <div className="text-lg font-bold">🔥</div>
            <div className="text-xs">7 Day Streak</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${streak >= 14 ? 'bg-gradient-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
            <div className="text-lg font-bold">💪</div>
            <div className="text-xs">2 Week Streak</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${streak >= 30 ? 'bg-gradient-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
            <div className="text-lg font-bold">🏆</div>
            <div className="text-xs">30 Day Streak</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${totalWorkouts >= 50 ? 'bg-gradient-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
            <div className="text-lg font-bold">🌟</div>
            <div className="text-xs">50 Workouts</div>
          </div>
        </div>
      </Card>

      {/* Personal Records */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Personal Records
        </h3>
        
        {getTopLifts().length > 0 ? (
          <div className="space-y-3">
            {getTopLifts().map((lift, index) => (
              <div key={lift.exercise} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{lift.exercise}</div>
                    <div className="text-sm text-muted-foreground">
                      Last: {lift.weight}kg × {lift.reps} reps
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{lift.oneRepMax}kg</div>
                  <div className="text-xs text-muted-foreground">Est. 1RM</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Complete some workouts to see your records!</p>
          </div>
        )}
      </Card>

      {/* Weekly Progress */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          This Week's Progress
        </h3>
        
        <div className="flex justify-between gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const isCompleted = index < Math.min(streak, 7);
            const isToday = index === new Date().getDay() - 1;
            
            return (
              <div
                key={day}
                className={`flex-1 p-3 rounded-lg text-center text-xs transition-all ${
                  isCompleted
                    ? 'bg-gradient-success text-success-foreground shadow-glow'
                    : isToday
                    ? 'bg-gradient-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="font-medium">{day}</div>
                <div className="mt-1">
                  {isCompleted ? '✓' : isToday ? '●' : '○'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};