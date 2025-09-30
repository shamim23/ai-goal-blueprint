import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { Goal } from "@/pages/Index";

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGoal: (goal: Omit<Goal, "id" | "progress" | "actions" | "milestones">) => void;
}

export function CreateGoalDialog({ open, onOpenChange, onCreateGoal }: CreateGoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"business" | "personal" | "health" | "learning">("business");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !deadline) return;

    onCreateGoal({
      title,
      description,
      category,
      target: parseInt(target) || 100,
      deadline: format(deadline, "yyyy-MM-dd")
    });

    // Reset form
    setTitle("");
    setDescription("");
    setCategory("business");
    setTarget("");
    setDeadline(undefined);
    onOpenChange(false);
  };

  const generateAISuggestions = () => {
    // AI-powered goal breakdown suggestions (placeholder for now)
    if (title.toLowerCase().includes("business") || title.toLowerCase().includes("startup")) {
      setDescription("Launch and scale a successful business venture with measurable growth metrics and customer acquisition goals.");
    } else if (title.toLowerCase().includes("learn") || title.toLowerCase().includes("skill")) {
      setDescription("Develop expertise through structured learning, hands-on practice, and real-world application of new skills.");
    } else if (title.toLowerCase().includes("health") || title.toLowerCase().includes("fitness")) {
      setDescription("Improve physical and mental well-being through consistent habits, measurable progress, and sustainable lifestyle changes.");
    } else {
      setDescription("Achieve meaningful progress through focused action, consistent effort, and measurable outcomes.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Create New Goal
          </DialogTitle>
          <DialogDescription>
            Define your goal and let AI help you break it down into actionable steps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                placeholder="e.g., Launch my SaaS product"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAISuggestions}
                className="px-3"
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your goal in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">🏢 Business</SelectItem>
                  <SelectItem value="personal">👤 Personal</SelectItem>
                  <SelectItem value="health">💪 Health</SelectItem>
                  <SelectItem value="learning">📚 Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Value</Label>
              <Input
                id="target"
                type="number"
                placeholder="100"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Wand2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-primary mb-1">AI Enhancement</p>
                <p className="text-sm text-muted-foreground">
                  After creating your goal, our AI will suggest actionable steps, milestones, and optimization strategies to maximize your success.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}