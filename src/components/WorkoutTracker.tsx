import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus, Minus, RotateCcw, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  lastWeight?: number;
  lastReps?: number;
}

interface Set {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutTrackerProps {
  workoutType: string;
  onBack: () => void;
  onComplete: () => void;
}

export const WorkoutTracker = ({ workoutType, onBack, onComplete }: WorkoutTrackerProps) => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    // Initialize exercises based on workout type
    const getExercisesForWorkout = (type: string): Exercise[] => {
      const exerciseTemplates = {
        'Push': [
          { name: 'Bench Press', sets: 4 },
          { name: 'Overhead Press', sets: 3 },
          { name: 'Incline Dumbbell Press', sets: 3 },
          { name: 'Tricep Dips', sets: 3 },
          { name: 'Lateral Raises', sets: 3 }
        ],
        'Pull': [
          { name: 'Deadlift', sets: 4 },
          { name: 'Pull-ups', sets: 3 },
          { name: 'Barbell Rows', sets: 3 },
          { name: 'Face Pulls', sets: 3 },
          { name: 'Bicep Curls', sets: 3 }
        ],
        'Legs': [
          { name: 'Squats', sets: 4 },
          { name: 'Romanian Deadlift', sets: 3 },
          { name: 'Bulgarian Split Squats', sets: 3 },
          { name: 'Calf Raises', sets: 3 },
          { name: 'Walking Lunges', sets: 3 }
        ]
      };

      const templates = exerciseTemplates[type as keyof typeof exerciseTemplates] || [];
      return templates.map((template, index) => ({
        id: `exercise-${index}`,
        name: template.name,
        sets: Array.from({ length: template.sets }, (_, setIndex) => ({
          id: `set-${index}-${setIndex}`,
          weight: 0,
          reps: 0,
          completed: false
        })),
        lastWeight: getLastWorkoutData(template.name)?.weight,
        lastReps: getLastWorkoutData(template.name)?.reps
      }));
    };

    setExercises(getExercisesForWorkout(workoutType));
  }, [workoutType]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            toast({
              title: "Rest Complete!",
              description: "Time for your next set",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer, toast]);

  const getLastWorkoutData = (exerciseName: string) => {
    const lastWorkout = localStorage.getItem(`lastWorkout-${exerciseName}`);
    return lastWorkout ? JSON.parse(lastWorkout) : null;
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setExercises(prev => prev.map((exercise, eIndex) => 
      eIndex === exerciseIndex ? {
        ...exercise,
        sets: exercise.sets.map((set, sIndex) => 
          sIndex === setIndex ? { ...set, [field]: value } : set
        )
      } : exercise
    ));
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    
    if (set.weight === 0 || set.reps === 0) {
      toast({
        title: "Invalid Set",
        description: "Please enter weight and reps before completing the set",
        variant: "destructive"
      });
      return;
    }

    setExercises(prev => prev.map((exercise, eIndex) => 
      eIndex === exerciseIndex ? {
        ...exercise,
        sets: exercise.sets.map((s, sIndex) => 
          sIndex === setIndex ? { ...s, completed: true } : s
        )
      } : exercise
    ));

    // Start rest timer
    setRestTimer(90); // 90 seconds rest
    setIsResting(true);

    toast({
      title: "Set Complete!",
      description: `${set.weight}kg × ${set.reps} reps recorded`,
    });
  };

  const saveWorkout = () => {
    // Save workout data to localStorage
    exercises.forEach(exercise => {
      const completedSets = exercise.sets.filter(set => set.completed);
      if (completedSets.length > 0) {
        const lastSet = completedSets[completedSets.length - 1];
        localStorage.setItem(`lastWorkout-${exercise.name}`, JSON.stringify({
          weight: lastSet.weight,
          reps: lastSet.reps,
          date: new Date().toISOString()
        }));
      }
    });

    // Update streak
    const currentStreak = parseInt(localStorage.getItem('workoutStreak') || '0');
    localStorage.setItem('workoutStreak', (currentStreak + 1).toString());

    onComplete();
    
    toast({
      title: "Workout Saved!",
      description: "Great job completing your workout!",
    });
  };

  const currentExercise = exercises[currentExerciseIndex];
  const completedSets = currentExercise?.sets.filter(set => set.completed).length || 0;
  const totalSets = currentExercise?.sets.length || 0;

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
        <div className="text-center">
          <h1 className="text-2xl font-bold">{workoutType} Workout</h1>
          <p className="text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={saveWorkout}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      {/* Rest Timer */}
      {isResting && (
        <Card className="p-4 bg-gradient-accent text-center">
          <div className="text-2xl font-bold text-accent-foreground mb-2">
            Rest Time: {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-accent-foreground/80">Take a breather!</p>
        </Card>
      )}

      {/* Current Exercise */}
      {currentExercise && (
        <Card className="p-6 bg-gradient-card shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{currentExercise.name}</h2>
              <p className="text-sm text-muted-foreground">
                Set {completedSets + 1} of {totalSets}
              </p>
            </div>
            <Badge variant="secondary">
              {completedSets}/{totalSets} completed
            </Badge>
          </div>

          {/* Last workout reference */}
          {currentExercise.lastWeight && currentExercise.lastReps && (
            <Card className="p-3 mb-4 bg-muted">
              <p className="text-sm text-muted-foreground">
                Last workout: {currentExercise.lastWeight}kg × {currentExercise.lastReps} reps
              </p>
            </Card>
          )}

          {/* Sets */}
          <div className="space-y-3">
            {currentExercise.sets.map((set, setIndex) => (
              <div 
                key={set.id}
                className={`p-4 rounded-lg border transition-all ${
                  set.completed 
                    ? 'bg-success/10 border-success' 
                    : setIndex === completedSets 
                    ? 'bg-accent/10 border-accent shadow-glow' 
                    : 'bg-secondary border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium w-12">
                    Set {setIndex + 1}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSet(currentExerciseIndex, setIndex, 'weight', Math.max(0, set.weight - 2.5))}
                      disabled={set.completed}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-20 text-center"
                      placeholder="kg"
                      disabled={set.completed}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSet(currentExerciseIndex, setIndex, 'weight', set.weight + 2.5)}
                      disabled={set.completed}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <span className="text-muted-foreground">×</span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSet(currentExerciseIndex, setIndex, 'reps', Math.max(0, set.reps - 1))}
                      disabled={set.completed}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                      placeholder="reps"
                      disabled={set.completed}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSet(currentExerciseIndex, setIndex, 'reps', set.reps + 1)}
                      disabled={set.completed}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {!set.completed ? (
                    <Button
                      onClick={() => completeSet(currentExerciseIndex, setIndex)}
                      disabled={setIndex !== completedSets}
                      className="bg-gradient-success hover:opacity-90"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Exercise Navigation */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
              disabled={currentExerciseIndex === 0}
              className="flex-1"
            >
              Previous Exercise
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentExerciseIndex(Math.min(exercises.length - 1, currentExerciseIndex + 1))}
              disabled={currentExerciseIndex === exercises.length - 1}
              className="flex-1"
            >
              Next Exercise
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};