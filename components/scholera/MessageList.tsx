"use client"

import { memo } from "react"
import { GraduationCap, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import CitationChip from "./CitationChip"
import type { Citation, Message, ScenarioId } from "@/lib/scholera/types"
import type { StreamStatus } from "@/lib/scholera/useMockStream"
import type { ComponentPropsWithoutRef } from "react"

interface MessageListProps {
  messages: Message[]
  streamStateById: Record<string, StreamStatus>
  errorById: Record<string, string | undefined>
  scenarioIdByMessageId: Record<string, ScenarioId>
  pinnedIds: Set<string>
  onOpenCitation: (citation: Citation) => void
  onTogglePin: (message: Message) => void
  onRetry: (messageId: string) => void
}

function statusLabel(status: StreamStatus | undefined): string | null {
  if (!status) {
    return null
  }
  if (status === "slow-start") {
    return "Thinking..."
  }
  if (status === "idle") {
    return "Queued..."
  }
  if (status === "streaming") {
    return "Streaming..."
  }
  if (status === "cancelled") {
    return "Stopped"
  }
  if (status === "error") {
    return "Interrupted"
  }
  return null
}

export default function MessageList({
  messages,
  streamStateById,
  errorById,
  scenarioIdByMessageId,
  pinnedIds,
  onOpenCitation,
  onTogglePin,
  onRetry,
}: MessageListProps) {
  return (
    <div className="w-full max-w-4xl space-y-8 px-1 pb-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          status={streamStateById[message.id]}
          error={errorById[message.id]}
          isRefusal={scenarioIdByMessageId[message.id] === "refusal"}
          isPinned={pinnedIds.has(message.id)}
          onOpenCitation={onOpenCitation}
          onTogglePin={onTogglePin}
          onRetry={onRetry}
        />
      ))}
    </div>
  )
}

interface MessageItemProps {
  message: Message
  status: StreamStatus | undefined
  error: string | undefined
  isRefusal: boolean
  isPinned: boolean
  onOpenCitation: (citation: Citation) => void
  onTogglePin: (message: Message) => void
  onRetry: (messageId: string) => void
}

/**
 * Memoized so a streaming chunk only re-renders the message it belongs to —
 * the other message objects keep their identity across state updates.
 */
const MessageItem = memo(function MessageItem({
  message,
  status,
  error,
  isRefusal,
  isPinned,
  onOpenCitation,
  onTogglePin,
  onRetry,
}: MessageItemProps) {
  const isAssistant = message.role === "assistant"
  const hasCitations = Boolean(message.citations?.length)
  const label = statusLabel(status)

  return (
    <article
      id={`message-${message.id}`}
      className={`input-3d animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out rounded-2xl border backdrop-blur-xl ${
        isAssistant
          ? isRefusal
            ? "bg-secondary/45 border-border/50 p-4"
            : "bg-secondary/60 border-border/60 p-4"
          : "ml-auto w-fit max-w-[85%] border-l-2 border-l-white/40 bg-white/[0.06] border-border/50 px-4 py-3"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              isAssistant
                ? "bg-primary text-primary-foreground"
                : "border border-border/70 bg-white/10 text-foreground"
            }`}
            aria-hidden="true"
          >
            {isAssistant ? <GraduationCap className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          </span>
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {isAssistant ? "Tutor" : "You"}
          </span>
        </div>

        {isAssistant && hasCitations && (
          <button
            type="button"
            onClick={() => onTogglePin(message)}
            className={`btn-3d animate-in fade-in duration-200 rounded-xl border px-2.5 py-1.5 text-xs ${
              isPinned ? "border-primary text-foreground" : "border-border/50 text-muted-foreground"
            }`}
          >
            {isPinned ? "Pinned" : "Pin"}
          </button>
        )}
      </div>

      {isAssistant ? (
        <div
          className={`prose prose-invert max-w-none break-words text-sm leading-7 ${
            isRefusal ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => <p className="my-2">{children}</p>,
              pre: ({ children }) => (
                <pre className="my-3 overflow-x-auto rounded-xl border border-border/50 bg-black/60 p-3">{children}</pre>
              ),
              code: (props: ComponentPropsWithoutRef<"code">) => {
                const { children } = props
                const isInline = !String(children ?? "").includes("\n")
                if (isInline) {
                  return <code className="rounded bg-black/50 px-1.5 py-0.5 text-[0.9em]">{children}</code>
                }
                return <code>{children}</code>
              },
              table: ({ children }) => (
                <div className="my-3 overflow-x-auto">
                  <table className="w-full border-collapse border border-border/50 text-left text-xs">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="border border-border/50 px-2 py-1.5 font-medium">{children}</th>,
              td: ({ children }) => <td className="border border-border/50 px-2 py-1.5">{children}</td>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">{message.content}</p>
      )}

      {label && <p className="mt-2 text-xs text-muted-foreground">{label}</p>}
      {status === "error" && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-destructive">{error ?? "Response interrupted."}</span>
          <button
            type="button"
            className="btn-3d rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive"
            onClick={() => onRetry(message.id)}
          >
            Retry
          </button>
        </div>
      )}

      {hasCitations && (
        <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {message.citations!.map((citation, index) => (
            <CitationChip
              key={`${message.id}-${citation.lecture}-${citation.slide}-${index}`}
              citation={citation}
              onClick={onOpenCitation}
            />
          ))}
        </div>
      )}
    </article>
  )
})
