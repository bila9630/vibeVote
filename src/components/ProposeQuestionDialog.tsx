import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lightbulb, X, Plus } from "lucide-react";

const questionSchema = z.object({
  questionText: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(500, "Question must be less than 500 characters"),
  questionType: z.enum(["multiple-choice", "open-ended", "yes-no", "ranking", "ideation"]),
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category must be less than 50 characters"),
  options: z.array(z.string()).optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface ProposeQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposeQuestionDialog({ open, onOpenChange }: ProposeQuestionDialogProps) {
  const [options, setOptions] = useState<string[]>(["", ""]);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      questionType: "open-ended",
      category: "",
      options: [],
    },
  });

  const questionType = form.watch("questionType");
  const needsOptions = questionType === "multiple-choice" || questionType === "ranking";

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const onSubmit = (data: QuestionFormValues) => {
    // Validate options if needed
    if (needsOptions) {
      const validOptions = options.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        toast.error("Please provide at least 2 options");
        return;
      }
      if (validOptions.length > 10) {
        toast.error("Maximum 10 options allowed");
        return;
      }
    }

    // For now, just show success toast (no actual database insertion)
    toast.success("Thank you! Your question proposal has been submitted for review.", {
      description: "We'll consider it for future questions.",
      icon: <Lightbulb className="h-4 w-4" />,
      duration: 4000,
    });

    // Reset form and close dialog
    form.reset();
    setOptions(["", ""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            Propose a New Question
          </DialogTitle>
          <DialogDescription>
            Have an interesting question idea? Share it with us! Your proposal will be reviewed for inclusion in the question pool.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's your question?"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a clear, engaging question (10-500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open-ended">Open-Ended</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="yes-no">Yes/No</SelectItem>
                      <SelectItem value="ranking">Ranking</SelectItem>
                      <SelectItem value="ideation">Ideation Game</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Technology, Personal Growth, Fun" {...field} />
                  </FormControl>
                  <FormDescription>
                    What category does this question belong to?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {needsOptions && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Options</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    disabled={options.length >= 10}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <FormDescription>
                  Provide 2-10 options for users to choose from
                </FormDescription>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-secondary">
                Submit Proposal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
