import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { VISIBILITY_OPTIONS } from "./constants";

interface Props {
  currentStep: number;
  isSubmitting: boolean;
  roleReady: boolean;
  visibility: "public" | "private";
  onNext: () => void;
  onBack: () => void;
}

export function StepNav({ currentStep, isSubmitting, roleReady, visibility, onNext, onBack }: Props) {
  const selectedVisibility = VISIBILITY_OPTIONS.find(o => o.value === visibility);

  return (
    <div className="cc-actions">
      <Button type="button" variant="outline" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      {currentStep < 2 ? (
        <Button type="button" onClick={onNext} className="gap-2">
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <Button type="submit" disabled={isSubmitting || !roleReady}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create a draft
          </Button>
        </div>
      )}
    </div>
  );
}
