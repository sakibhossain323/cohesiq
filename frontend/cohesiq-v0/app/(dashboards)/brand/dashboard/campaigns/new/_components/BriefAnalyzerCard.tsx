"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { analyzeBriefAction, type BriefAnalysisResult } from "../_actions/analyze-brief";

interface Props {
  onResult: (result: BriefAnalysisResult) => void;
}

export function BriefAnalyzerCard({ onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    setSummary(null);
    setLoading(true);
    try {
      const result = await analyzeBriefAction(brief);
      setSummary(result.summary ?? "Analysis complete — fields pre-filled below.");
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-purple-200 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-800">
      <CardHeader className="pb-3 cursor-pointer select-none" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-base text-purple-700 dark:text-purple-300">
              AI Brief Analyzer
            </CardTitle>
            <span className="rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-300">
              Beta
            </span>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {!open && (
          <CardDescription className="mt-1">
            Paste a campaign description and let AI pre-fill the form for you.
          </CardDescription>
        )}
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Describe your campaign in plain language — target audience, product, goal, budget,
            number of creators. AI will extract the details and pre-fill the form below.
          </p>

          <Textarea
            rows={4}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={`e.g. "We're launching a new energy drink targeting Gen Z gamers. Looking for 3 YouTube creators with 50k+ followers for a 30-day paid content campaign in Bangladesh. Budget around 15,000 BDT per creator. We want to hit 200k total reach and at least 4% engagement. Use hashtag #PowerUpBD."`}
            disabled={loading}
          />

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {summary && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {summary}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300"
              onClick={handleAnalyze}
              disabled={loading || brief.trim().length < 20}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Analyzing…" : "Analyze Brief"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
