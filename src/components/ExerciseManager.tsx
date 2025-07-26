import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Dumbbell, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage, type Exercise, type WorkoutTemplate } from '@/lib/storage';

interface ExerciseManagerProps {
  workoutType: string;
  onBack: () => void;
}

export const ExerciseManager = ({ workoutType, onBack }: ExerciseManagerProps) => {
  const { toast } = useToast();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState(3);

  useEffect(() => {
    loadTemplate();
  }, [workoutType]);

  const loadTemplate = () => {
    const workoutTemplate = storage.getWorkoutTemplate(workoutType);
    if (workoutTemplate) {
      setTemplate(workoutTemplate);
    } else {
      // Create new template for custom workout types
      const newTemplate: WorkoutTemplate = {
        id: workoutType.toLowerCase().replace(/\s+/g, '-'),
        name: workoutType,
        exercises: []
      };
      setTemplate(newTemplate);
    }
  };

  const saveTemplate = (updatedTemplate: WorkoutTemplate) => {
    storage.updateWorkoutTemplate(workoutType, updatedTemplate);
    setTemplate(updatedTemplate);
    
    // Auto-save the current state
    storage.autoSave(`exercise-manager-${workoutType}`, updatedTemplate);
    
    toast({
      title: "Exercises Updated!",
      description: "Your workout template has been saved.",
    });
  };

  const addExercise = () => {
    if (!newExerciseName.trim()) {
      toast({
        title: "Invalid Exercise",
        description: "Please enter an exercise name.",
        variant: "destructive"
      });
      return;
    }

    if (!template) return;

    const newExercise: Exercise = {
      id: `${Date.now()}-${newExerciseName.toLowerCase().replace(/\s+/g, '-')}`,
      name: newExerciseName.trim(),
      sets: newExerciseSets
    };

    const updatedTemplate = {
      ...template,
      exercises: [...template.exercises, newExercise]
    };

    saveTemplate(updatedTemplate);
    setShowAddDialog(false);
    setNewExerciseName('');
    setNewExerciseSets(3);
  };

  const editExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setNewExerciseName(exercise.name);
    setNewExerciseSets(exercise.sets);
    setShowAddDialog(true);
  };

  const updateExercise = () => {
    if (!editingExercise || !template || !newExerciseName.trim()) return;

    const updatedTemplate = {
      ...template,
      exercises: template.exercises.map(ex => 
        ex.id === editingExercise.id 
          ? { ...ex, name: newExerciseName.trim(), sets: newExerciseSets }
          : ex
      )
    };

    saveTemplate(updatedTemplate);
    setShowAddDialog(false);
    setEditingExercise(null);
    setNewExerciseName('');
    setNewExerciseSets(3);
  };

  const deleteExercise = (exerciseId: string) => {
    if (!template) return;

    const updatedTemplate = {
      ...template,
      exercises: template.exercises.filter(ex => ex.id !== exerciseId)
    };

    saveTemplate(updatedTemplate);
    
    toast({
      title: "Exercise Deleted",
      description: "Exercise has been removed from your workout.",
    });
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (!template) return;

    const exercises = [...template.exercises];
    const [movedExercise] = exercises.splice(fromIndex, 1);
    exercises.splice(toIndex, 0, movedExercise);

    const updatedTemplate = {
      ...template,
      exercises
    };

    saveTemplate(updatedTemplate);
  };

  const resetToDefault = () => {
    // Get default template and save it
    const templates = storage.getWorkoutTemplates();
    const defaultTemplate = templates[workoutType];
    
    if (defaultTemplate) {
      saveTemplate(defaultTemplate);
      toast({
        title: "Reset Complete",
        description: "Exercises have been reset to default.",
      });
    }
  };

  const getExerciseHistory = (exerciseName: string) => {
    return storage.getExerciseHistory(exerciseName);
  };

  if (!template) {
    return <div className="p-6">Loading...</div>;
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
          <h1 className="text-2xl font-bold">{workoutType} Exercises</h1>
          <p className="text-sm text-muted-foreground">
            {template.exercises.length} exercises configured
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-accent hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={resetToDefault}
          className="flex-1"
          disabled={!storage.getWorkoutTemplates()[workoutType]}
        >
          Reset to Default
        </Button>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        {template.exercises.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-card">
            <Dumbbell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Exercises Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add exercises to create your custom {workoutType} workout
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-accent hover:opacity-90"
            >
              Add First Exercise
            </Button>
          </Card>
        ) : (
          template.exercises.map((exercise, index) => {
            const history = getExerciseHistory(exercise.name);
            
            return (
              <Card key={exercise.id} className="p-4 bg-gradient-card shadow-card">
                <div className="flex items-center gap-4">
                  <div className="cursor-move text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <Badge variant="secondary">{exercise.sets} sets</Badge>
                    </div>
                    
                    {history && (
                      <p className="text-sm text-muted-foreground">
                        Last: {history.weight}kg × {history.reps} reps
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editExercise(exercise)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExercise(exercise.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Exercise Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Exercise Name</label>
              <Input
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="e.g., Bench Press"
                onKeyDown={(e) => e.key === 'Enter' && (editingExercise ? updateExercise() : addExercise())}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Number of Sets</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewExerciseSets(Math.max(1, newExerciseSets - 1))}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{newExerciseSets}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewExerciseSets(Math.min(10, newExerciseSets + 1))}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingExercise(null);
                  setNewExerciseName('');
                  setNewExerciseSets(3);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingExercise ? updateExercise : addExercise}
                className="flex-1 bg-gradient-accent hover:opacity-90"
              >
                {editingExercise ? 'Update' : 'Add'} Exercise
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};