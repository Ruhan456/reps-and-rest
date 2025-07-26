// Centralized storage utility for workout data persistence

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  lastWeight?: number;
  lastReps?: number;
  lastDate?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface WorkoutSplit {
  id: string;
  name: string;
  days: string[];
  currentDay: number;
  lastWorkoutDate: string | null;
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutType: string;
  exercises: {
    exerciseId: string;
    name: string;
    sets: {
      weight: number;
      reps: number;
      completed: boolean;
    }[];
  }[];
  completed: boolean;
}

class WorkoutStorage {
  // Workout Templates
  getWorkoutTemplates(): { [key: string]: WorkoutTemplate } {
    const templates = localStorage.getItem('workoutTemplates');
    if (templates) {
      return JSON.parse(templates);
    }
    
    // Default templates
    const defaultTemplates = {
      'Push': {
        id: 'push',
        name: 'Push',
        exercises: [
          { id: 'bench-press', name: 'Bench Press', sets: 4 },
          { id: 'overhead-press', name: 'Overhead Press', sets: 3 },
          { id: 'incline-db-press', name: 'Incline Dumbbell Press', sets: 3 },
          { id: 'tricep-dips', name: 'Tricep Dips', sets: 3 },
          { id: 'lateral-raises', name: 'Lateral Raises', sets: 3 }
        ]
      },
      'Pull': {
        id: 'pull',
        name: 'Pull',
        exercises: [
          { id: 'deadlift', name: 'Deadlift', sets: 4 },
          { id: 'pull-ups', name: 'Pull-ups', sets: 3 },
          { id: 'barbell-rows', name: 'Barbell Rows', sets: 3 },
          { id: 'face-pulls', name: 'Face Pulls', sets: 3 },
          { id: 'bicep-curls', name: 'Bicep Curls', sets: 3 }
        ]
      },
      'Legs': {
        id: 'legs',
        name: 'Legs',
        exercises: [
          { id: 'squats', name: 'Squats', sets: 4 },
          { id: 'romanian-deadlift', name: 'Romanian Deadlift', sets: 3 },
          { id: 'bulgarian-split-squats', name: 'Bulgarian Split Squats', sets: 3 },
          { id: 'calf-raises', name: 'Calf Raises', sets: 3 },
          { id: 'walking-lunges', name: 'Walking Lunges', sets: 3 }
        ]
      },
      'Upper': {
        id: 'upper',
        name: 'Upper',
        exercises: [
          { id: 'bench-press', name: 'Bench Press', sets: 4 },
          { id: 'pull-ups', name: 'Pull-ups', sets: 3 },
          { id: 'overhead-press', name: 'Overhead Press', sets: 3 },
          { id: 'barbell-rows', name: 'Barbell Rows', sets: 3 },
          { id: 'dips', name: 'Dips', sets: 3 }
        ]
      },
      'Lower': {
        id: 'lower',
        name: 'Lower',
        exercises: [
          { id: 'squats', name: 'Squats', sets: 4 },
          { id: 'deadlift', name: 'Deadlift', sets: 4 },
          { id: 'lunges', name: 'Lunges', sets: 3 },
          { id: 'leg-press', name: 'Leg Press', sets: 3 },
          { id: 'calf-raises', name: 'Calf Raises', sets: 3 }
        ]
      },
      'Full Body': {
        id: 'full-body',
        name: 'Full Body',
        exercises: [
          { id: 'squats', name: 'Squats', sets: 3 },
          { id: 'bench-press', name: 'Bench Press', sets: 3 },
          { id: 'pull-ups', name: 'Pull-ups', sets: 3 },
          { id: 'overhead-press', name: 'Overhead Press', sets: 3 },
          { id: 'deadlift', name: 'Deadlift', sets: 3 }
        ]
      }
    };
    
    this.saveWorkoutTemplates(defaultTemplates);
    return defaultTemplates;
  }

  saveWorkoutTemplates(templates: { [key: string]: WorkoutTemplate }): void {
    localStorage.setItem('workoutTemplates', JSON.stringify(templates));
  }

  getWorkoutTemplate(workoutType: string): WorkoutTemplate | null {
    const templates = this.getWorkoutTemplates();
    return templates[workoutType] || null;
  }

  updateWorkoutTemplate(workoutType: string, template: WorkoutTemplate): void {
    const templates = this.getWorkoutTemplates();
    templates[workoutType] = template;
    this.saveWorkoutTemplates(templates);
  }

  // Exercise History
  getExerciseHistory(exerciseName: string): any {
    const history = localStorage.getItem(`exercise-${exerciseName}`);
    return history ? JSON.parse(history) : null;
  }

  saveExerciseHistory(exerciseName: string, data: any): void {
    localStorage.setItem(`exercise-${exerciseName}`, JSON.stringify(data));
  }

  // Workout Sessions
  saveWorkoutSession(session: WorkoutSession): void {
    const sessions = this.getWorkoutSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem('workoutSessions', JSON.stringify(sessions));
    
    // Also update individual exercise records
    session.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.completed) {
          this.saveExerciseHistory(exercise.name, {
            weight: set.weight,
            reps: set.reps,
            date: session.date
          });
        }
      });
    });
  }

  getWorkoutSessions(): WorkoutSession[] {
    const sessions = localStorage.getItem('workoutSessions');
    return sessions ? JSON.parse(sessions) : [];
  }

  // Workout Splits
  getWorkoutSplits(): WorkoutSplit[] {
    const splits = localStorage.getItem('workoutSplits');
    if (splits) {
      return JSON.parse(splits);
    }
    
    // Default splits
    const defaultSplits = [
      {
        id: '1',
        name: 'Push/Pull/Legs',
        days: ['Push', 'Pull', 'Legs', 'Rest', 'Push', 'Pull', 'Legs'],
        currentDay: 0,
        lastWorkoutDate: null
      },
      {
        id: '2',
        name: 'Upper/Lower',
        days: ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest'],
        currentDay: 0,
        lastWorkoutDate: null
      },
      {
        id: '3',
        name: 'Full Body',
        days: ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'],
        currentDay: 0,
        lastWorkoutDate: null
      }
    ];
    
    this.saveWorkoutSplits(defaultSplits);
    return defaultSplits;
  }

  saveWorkoutSplits(splits: WorkoutSplit[]): void {
    localStorage.setItem('workoutSplits', JSON.stringify(splits));
  }

  getActiveSplit(): WorkoutSplit | null {
    const activeSplitId = localStorage.getItem('activeSplit');
    if (activeSplitId) {
      const splits = this.getWorkoutSplits();
      return splits.find(s => s.id === activeSplitId) || null;
    }
    return null;
  }

  setActiveSplit(splitId: string): void {
    localStorage.setItem('activeSplit', splitId);
    const splits = this.getWorkoutSplits();
    const split = splits.find(s => s.id === splitId);
    if (split) {
      localStorage.setItem('workoutSplit', JSON.stringify(split));
    }
  }

  updateSplit(updatedSplit: WorkoutSplit): void {
    const splits = this.getWorkoutSplits();
    const index = splits.findIndex(s => s.id === updatedSplit.id);
    if (index >= 0) {
      splits[index] = updatedSplit;
      this.saveWorkoutSplits(splits);
      
      // Update active split if this is the active one
      const activeSplitId = localStorage.getItem('activeSplit');
      if (activeSplitId === updatedSplit.id) {
        localStorage.setItem('workoutSplit', JSON.stringify(updatedSplit));
      }
    }
  }

  // Streak and Stats
  getStreak(): number {
    return parseInt(localStorage.getItem('workoutStreak') || '0');
  }

  updateStreak(): void {
    const currentStreak = this.getStreak();
    localStorage.setItem('workoutStreak', (currentStreak + 1).toString());
  }

  // Auto-save functionality
  autoSave(key: string, data: any): void {
    localStorage.setItem(`autosave-${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }

  getAutoSave(key: string): any {
    const saved = localStorage.getItem(`autosave-${key}`);
    if (saved) {
      const { data, timestamp } = JSON.parse(saved);
      // Return data if it's less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  }

  clearAutoSave(key: string): void {
    localStorage.removeItem(`autosave-${key}`);
  }
}

export const storage = new WorkoutStorage();