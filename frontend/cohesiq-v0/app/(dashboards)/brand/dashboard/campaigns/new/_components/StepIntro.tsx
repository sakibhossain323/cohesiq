"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  ArrowRight, Sparkles, PenLine, Loader2,
  CheckCircle2, AlertCircle, Paperclip, Mic, MicOff, X, Square,
} from "lucide-react";

interface Props {
  aiInput: string;
  aiMode: "idle" | "writing" | "done";
  aiLoading: boolean;
  aiError: string | null;
  aiSummary: string | null;
  error: string | null;
  onAiInputChange: (val: string) => void;
  onAnalyze: () => void;
  onRestart: () => void;
  onProceed: () => void;
  onStartFromScratch: () => void;
}

// ── PDF text extraction via pdfjs-dist ──────────────────────────────────────
async function extractPDFText(file: File): Promise<string> {
  const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n").replace(/\s+/g, " ").trim();
}


export function StepIntro({
  aiInput, aiMode, aiLoading, aiError, aiSummary, error,
  onAiInputChange, onAnalyze, onRestart, onProceed, onStartFromScratch,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  // ── PDF handler ────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfError(null);
    setPdfLoading(true);
    try {
      let text = "";
      if (file.type === "text/plain") {
        text = await file.text();
      } else {
        text = await extractPDFText(file);
      }
      if (!text) {
        setPdfError("Couldn't extract text from this PDF. Try a text-based (non-scanned) file.");
        return;
      }
      setAttachedFile(file.name);
      onAiInputChange((aiInput ? aiInput + "\n\n" : "") + text);
    } catch {
      setPdfError("Failed to read the file. Make sure it's a valid PDF or text file.");
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    setPdfError(null);
  };

  // ── Voice handler (MediaRecorder → Groq Whisper) ──────────────────────────
  const toggleVoice = async () => {
    if (listening) {
      mediaRecorderRef.current?.stop();
      return;
    }

    setPdfError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPdfError("Microphone access was denied. Allow microphone permission for this site in your browser settings.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setListening(false);
      setTranscribing(true);
      try {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Transcription failed");
        if (data.transcript) {
          onAiInputChange((aiInput ? aiInput + " " : "") + data.transcript);
        }
      } catch (err: any) {
        setPdfError(err.message ?? "Transcription failed. Please try again.");
      } finally {
        setTranscribing(false);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setListening(true);
  };

  const disabled = aiLoading || aiMode === "done";

  return (
    <div className="w-full max-w-2xl mx-auto px-6 pt-24 pb-12 flex-1 flex flex-col justify-center">
      <div className="w-full flex flex-col items-center">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
            What&apos;s your campaign about?
          </h1>
        </div>

        <div className="w-full flex flex-col gap-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Start from scratch */}
          <button
            type="button"
            onClick={onStartFromScratch}
            className="group w-full flex items-center justify-between rounded-2xl border border-border/60 bg-background px-5 py-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <PenLine className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground font-display">Start from scratch</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">Step through each section with full control.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 shrink-0" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="h-px flex-1 bg-muted-foreground/30" />
            <span className="text-[13px] font-semibold text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-muted-foreground/30" />
          </div>

          {/* AI input card */}
          <div className={cn(
            "rounded-2xl border bg-background shadow-md transition-all overflow-hidden flex flex-col relative z-10",
            aiInput.length > 0 ? "border-primary/60 ring-2 ring-primary/20" : "border-primary/30 ring-4 ring-primary/5 hover:border-primary/50"
          )}>

            {/* Attached file pill */}
            {attachedFile && (
              <div className="flex items-center gap-2 px-5 pt-3">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                  <Paperclip className="h-3 w-3" />
                  {attachedFile}
                  <button type="button" onClick={clearAttachment} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            <Textarea
              rows={5}
              value={aiInput}
              onChange={e => onAiInputChange(e.target.value)}
              placeholder={`e.g. "We're launching a premium skincare line targeting millennial women in Dhaka. Looking for 5 Instagram creators with 30k+ followers for a 6-week campaign. Budget ৳20,000 per creator. Goal: 500k impressions and 4% engagement. Hashtag #GlowWithUs."`}
              disabled={disabled}
              className="border-0 rounded-none resize-none focus-visible:ring-0 bg-transparent text-[14px] leading-relaxed px-5 pt-5 pb-3 min-h-[140px] max-h-[240px] overflow-y-auto placeholder:text-muted-foreground/60"
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-background border-t border-border/40">
              <div className="flex items-center gap-1">
                {/* Attach PDF */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={disabled || pdfLoading}
                />
                <button
                  type="button"
                  disabled={disabled || pdfLoading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a PDF or text file"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    disabled || pdfLoading
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  )}
                >
                  {pdfLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Paperclip className="h-4 w-4" />}
                  <span>{pdfLoading ? "Reading…" : "Attach"}</span>
                </button>

                {/* Voice */}
                <button
                  type="button"
                  disabled={disabled || transcribing}
                  onClick={toggleVoice}
                  title={listening ? "Stop recording" : "Dictate your brief"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    disabled || transcribing
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : listening
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  )}
                >
                  {transcribing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : listening
                      ? <MicOff className="h-4 w-4" />
                      : <Mic className="h-4 w-4" />}
                  <span>{transcribing ? "Transcribing…" : listening ? "Stop" : "Speak"}</span>
                  {listening && !transcribing && (
                    <span className="ml-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  )}
                </button>
              </div>

              {aiMode === "done" ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onRestart}
                    className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
                    Start over
                  </button>
                  <Button size="sm" onClick={onProceed} className="gap-1.5 rounded-lg font-medium shadow-sm h-9 px-4">
                    Review &amp; edit <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" size="sm" onClick={onAnalyze}
                  disabled={aiLoading || aiInput.trim().length < 20}
                  className="gap-1.5 shrink-0 rounded-lg font-medium shadow-sm h-9 px-4">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiLoading ? "Analyzing…" : "Autofill with AI"}
                </Button>
              )}
            </div>
          </div>

          {(pdfError) && (
            <Alert variant="destructive" className="py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{pdfError}</AlertDescription>
            </Alert>
          )}

          {aiError && (
            <Alert variant="destructive" className="py-3 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}

          {aiMode === "done" && aiSummary && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-4 mt-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-green-700 dark:text-green-300 mb-0.5">Fields pre-filled</p>
                <p className="text-[13px] text-green-600 dark:text-green-400 leading-relaxed">{aiSummary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
