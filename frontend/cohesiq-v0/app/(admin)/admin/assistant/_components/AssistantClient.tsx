'use client'

import { useRef, useState, useTransition } from 'react'
import { Sparkles, Send, Wrench } from 'lucide-react'
import { askAssistant } from '../_actions/ask-assistant'
import type { AssistantReply } from '@/lib/api/admin'

interface Turn {
  role: 'user' | 'assistant'
  text: string
  toolsUsed?: string[]
  offlineReason?: string | null
}

const SUGGESTIONS = [
  'How many active campaigns are there?',
  'List the top creators in the Beauty niche',
  'How many creators signed up in the last 7 days?',
]

export function AssistantClient() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [pending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  const send = (question: string) => {
    const q = question.trim()
    if (!q || pending) return
    setTurns((t) => [...t, { role: 'user', text: q }])
    setInput('')
    startTransition(async () => {
      let reply: AssistantReply
      try {
        reply = await askAssistant(q)
      } catch (e) {
        reply = {
          ok: false,
          answer: 'The assistant request failed. Please try again.',
          tools_used: [],
          offline_reason: e instanceof Error ? e.message : String(e),
        }
      }
      setTurns((t) => [
        ...t,
        {
          role: 'assistant',
          text: reply.answer,
          toolsUsed: reply.tools_used,
          offlineReason: reply.ok ? null : reply.offline_reason,
        },
      ])
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      )
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">AI Assistant</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Ask about the platform in plain language. The assistant is a LangChain agent that calls the
        Cohesiq MCP server&apos;s tools to read live data and run the matching engine.
      </p>

      <div
        ref={scrollRef}
        className="border rounded-lg h-[420px] overflow-y-auto p-4 space-y-4 bg-muted/20"
      >
        {turns.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-muted-foreground">
            <Sparkles className="h-8 w-8 opacity-40" />
            <p className="text-sm">Ask a question to get started.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) => (
          <div key={i} className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                turn.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border'
              }`}
            >
              <p className="whitespace-pre-wrap">{turn.text}</p>
              {turn.toolsUsed && turn.toolsUsed.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Wrench className="h-3 w-3" />
                  {turn.toolsUsed.map((t) => (
                    <span key={t} className="font-mono bg-muted px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {turn.offlineReason && (
                <p className="mt-2 text-xs text-amber-600 italic">{turn.offlineReason}</p>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="bg-background border rounded-lg px-4 py-2.5 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant…"
          disabled={pending}
          className="flex-1 border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  )
}
