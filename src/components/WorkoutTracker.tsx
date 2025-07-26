import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus, Minus, Save, ArrowLeft, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage, type WorkoutSession } from '@/lib/storage';

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  defaultSets: number;
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
  onManageExercises: () => void;
}

export const WorkoutTracker = ({ workoutType, onBack, onComplete, onManageExercises }: WorkoutTrackerProps) => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  useEffect(() => {
    initializeWorkout();
    
    // Set up auto-save every 10 seconds
    const interval = setInterval(() => {
      autoSaveWorkout();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
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

  const initializeWorkout = () => {
    // Check for auto-saved workout first
    const autoSaved = storage.getAutoSave(`workout-${workoutType}`);
    if (autoSaved) {
      setExercises(autoSaved.exercises);
      setCurrentExerciseIndex(autoSaved.currentExerciseIndex || 0);
      toast({
        title: "Workout Restored",
        description: "Continuing from where you left off",
      });
      return;
    }

    // Load template and create workout
    const template = storage.getWorkoutTemplate(workoutType);
    if (!template || template.exercises.length === 0) {
      toast({
        title: "No Exercises Found",
        description: "Please add exercises to this workout type first",
        variant: "destructive"
      });
      return;
    }

    const workoutExercises = template.exercises.map((exercise, index) => {
      const history = storage.getExerciseHistory(exercise.name);
      return {
        id: exercise.id,
        name: exercise.name,
        defaultSets: exercise.sets,
        sets: Array.from({ length: exercise.sets }, (_, setIndex) => ({
          id: `set-${index}-${setIndex}`,
          weight: history?.weight || 0,
          reps: history?.reps || 0,
          completed: false
        })),
        lastWeight: history?.weight,
        lastReps: history?.reps
      };
    });

    setExercises(workoutExercises);
  };

  const autoSaveWorkout = () => {
    if (exercises.length > 0) {
      storage.autoSave(`workout-${workoutType}`, {
        exercises,
        currentExerciseIndex,
        sessionId
      });
    }
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
    
    // Auto-save after changes
    setTimeout(autoSaveWorkout, 100);
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

    // Auto-save after completing set
    setTimeout(autoSaveWorkout, 100);
  };

  const saveWorkout = () => {
    // Create workout session
    const session: WorkoutSession = {
      id: sessionId,
      date: new Date().toISOString(),
      workoutType,
      exercises: exercises.map(exercise => ({
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.sets.map(set => ({
          weight: set.weight,
          reps: set.reps,
          completed: set.completed
        }))
      })),
      completed: true
    };

    // Save session using storage utility
    storage.saveWorkoutSession(session);

    // Update streak
    storage.updateStreak();

    // Update current split day
    const activeSplit = storage.getActiveSplit();
    if (activeSplit) {
      const nextDay = (activeSplit.currentDay + 1) % activeSplit.days.length;
      const updatedSplit = { 
        ...activeSplit, 
        currentDay: nextDay, 
        lastWorkoutDate: new Date().toISOString() 
      };
      storage.updateSplit(updatedSplit);
    }

    // Clear auto-save
    storage.clearAutoSave(`workout-${workoutType}`);

    onComplete();
    
    toast({
      title: "Workout Saved!",
      description: "Great job completing your workout!",
    });
  };

  const currentExercise = exercises[currentExerciseIndex];
  const completedSets = currentExercise?.sets.filter(set => set.completed).length || 0;
  const totalSets = currentExercise?.sets.length || 0;

  if (!currentExercise) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{workoutType} Workout</h1>
          <Button
            variant="ghost"
            onClick={onManageExercises}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage
          </Button>
        </div>

        <Card className="p-8 text-center bg-gradient-card">
          <Settings className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Exercises Configured</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add exercises to your {workoutType} workout to get started
          </p>
          <Button
            onClick={onManageExercises}
            className="bg-gradient-accent hover:opacity-90"
          >
            Add Exercises
          </Button>
        </Card>
      </div>
    );
  }

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
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onManageExercises}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={saveWorkout}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
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
    </div>
  );
};