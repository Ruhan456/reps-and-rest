import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, SkipForward, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage, type WorkoutSplit } from '@/lib/storage';

interface WorkoutSplitManagerProps {
  onBack: () => void;
}

export const WorkoutSplitManager = ({ onBack }: WorkoutSplitManagerProps) => {
  const { toast } = useToast();
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);
  const [activeSplit, setActiveSplit] = useState<string | null>(null);
  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitDays, setNewSplitDays] = useState<string[]>(['']);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = () => {
    const loadedSplits = storage.getWorkoutSplits();
    setSplits(loadedSplits);
    
    const activeId = localStorage.getItem('activeSplit');
    if (activeId) {
      setActiveSplit(activeId);
    } else if (loadedSplits.length > 0) {
      setActiveSplit(loadedSplits[0].id);
      storage.setActiveSplit(loadedSplits[0].id);
    }
  };

  const saveSplits = (newSplits: WorkoutSplit[]) => {
    setSplits(newSplits);
    storage.saveWorkoutSplits(newSplits);
  };

  const setActiveWorkoutSplit = (splitId: string) => {
    setActiveSplit(splitId);
    storage.setActiveSplit(splitId);
    toast({
      title: "Split Activated!",
      description: "Your workout split has been updated.",
    });
  };

  const skipDay = (splitId: string) => {
    const updatedSplit = splits.find(s => s.id === splitId);
    if (updatedSplit) {
      const nextDay = (updatedSplit.currentDay + 1) % updatedSplit.days.length;
      const newSplit = { ...updatedSplit, currentDay: nextDay };
      storage.updateSplit(newSplit);
      setSplits(prev => prev.map(s => s.id === splitId ? newSplit : s));
      
      toast({
        title: "Day Skipped",
        description: "Moved to next workout day.",
      });
    }
  };

  const createSplit = () => {
    if (!newSplitName.trim() || newSplitDays.some(day => !day.trim())) {
      toast({
        title: "Invalid Split",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    const newSplit: WorkoutSplit = {
      id: Date.now().toString(),
      name: newSplitName,
      days: newSplitDays.filter(day => day.trim()),
      currentDay: 0,
      lastWorkoutDate: null
    };

    saveSplits([...splits, newSplit]);
    setShowCreateDialog(false);
    setNewSplitName('');
    setNewSplitDays(['']);
    
    toast({
      title: "Split Created!",
      description: "Your new workout split has been saved.",
    });
  };

  const deleteSplit = (splitId: string) => {
    const newSplits = splits.filter(split => split.id !== splitId);
    saveSplits(newSplits);
    
    if (activeSplit === splitId) {
      setActiveSplit(null);
      localStorage.removeItem('activeSplit');
      localStorage.removeItem('workoutSplit');
    }
    
    toast({
      title: "Split Deleted",
      description: "Workout split has been removed.",
    });
  };

  const updateSplitDay = (index: number, value: string) => {
    const newDays = [...newSplitDays];
    newDays[index] = value;
    setNewSplitDays(newDays);
  };

  const addSplitDay = () => {
    setNewSplitDays([...newSplitDays, '']);
  };

  const removeSplitDay = (index: number) => {
    const newDays = newSplitDays.filter((_, i) => i !== index);
    setNewSplitDays(newDays);
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
        <h1 className="text-2xl font-bold">Workout Splits</h1>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-accent hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Split
        </Button>
      </div>

      {/* Active Split Info */}
      {activeSplit && (
        <Card className="p-4 bg-gradient-success text-success-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="font-semibold">Active Split</span>
          </div>
          <p className="text-sm opacity-90">
            {splits.find(s => s.id === activeSplit)?.name} is currently active
          </p>
        </Card>
      )}

      {/* Splits List */}
      <div className="space-y-4">
        {splits.map((split) => (
          <Card key={split.id} className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{split.name}</h3>
                  {activeSplit === split.id && (
                    <Badge className="bg-gradient-success">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Currently on day {split.currentDay + 1}: {split.days[split.currentDay]}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => skipDay(split.id)}
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSplit(split.id)}
                  disabled={splits.length === 1}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Week View */}
            <div className="flex gap-2 mb-4">
              {split.days.map((day, index) => (
                <div
                  key={index}
                  className={`flex-1 p-2 rounded-lg text-center text-xs font-medium transition-all ${
                    index === split.currentDay
                      ? 'bg-gradient-accent text-accent-foreground shadow-glow'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Actions */}
            {activeSplit !== split.id && (
              <Button
                onClick={() => setActiveWorkoutSplit(split.id)}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Activate Split
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Create Split Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Split</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Split Name</label>
              <Input
                value={newSplitName}
                onChange={(e) => setNewSplitName(e.target.value)}
                placeholder="e.g., Push/Pull/Legs"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Workout Days</label>
              <div className="space-y-2">
                {newSplitDays.map((day, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={day}
                      onChange={(e) => updateSplitDay(index, e.target.value)}
                      placeholder={`Day ${index + 1} (e.g., Push, Rest)`}
                      className="flex-1"
                    />
                    {newSplitDays.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSplitDay(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addSplitDay}
                className="w-full mt-2"
                disabled={newSplitDays.length >= 7}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Day
              </Button>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createSplit}
                className="flex-1 bg-gradient-accent hover:opacity-90"
              >
                Create Split
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};