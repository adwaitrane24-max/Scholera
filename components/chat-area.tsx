"use client"

import {
  ChevronDown,
  Settings,
  Pin,
  Lightbulb,
  FileText,
  ImageIcon,
  Mic,
  ArrowUp,
  Paperclip,
  X,
  Check,
  Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { ParticleOrb } from "@/components/particle-orb"
import { useScholeraChat } from "@/hooks/useScholeraChat"
import MessageList from "@/components/scholera/MessageList"
import CitationModal from "@/components/scholera/CitationModal"
import PinnedPanel from "@/components/scholera/PinnedPanel"

export function ChatArea() {
  const [isRecording, setIsRecording] = useState(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false)
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const {
    state,
    sendMessage,
    cancel,
    retry,
    togglePin,
    openCitation,
    closeCitation,
  } = useScholeraChat()

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isStreaming = state.streamingId !== null
  const hasMessages = state.messages.length > 0

  const pinnedMessages = useMemo(
    () => state.messages.filter((m) => state.pinnedIds.has(m.id)),
    [state.messages, state.pinnedIds],
  )

  const jumpToMessage = useCallback((messageId: string) => {
    setPinnedPanelOpen(false)
    const el = document.getElementById(`message-${messageId}`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "center" })
    el.classList.remove("message-highlight")
    // Force reflow so the animation replays if it's already mid-run from a prior jump
    void el.offsetWidth
    el.classList.add("message-highlight")
    window.setTimeout(() => el.classList.remove("message-highlight"), 1400)
  }, [])

  // Auto-scroll follows the stream, but pauses as soon as the user scrolls up
  // and resumes when they come back within `BOTTOM_THRESHOLD` of the bottom.
  const stickToBottomRef = useRef(true)
  const lastScrollAtRef = useRef(0)
  const pendingScrollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const BOTTOM_THRESHOLD = 80
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
  }, [])

  // A newly sent message always re-engages auto-scroll (must run before the
  // throttled scroll effect below, which reads stickToBottomRef)
  useEffect(() => {
    stickToBottomRef.current = true
  }, [state.messages.length])

  // Throttled (max one scroll per SCROLL_INTERVAL) so stream ticks don't stutter
  useEffect(() => {
    const SCROLL_INTERVAL = 120

    const scrollToBottom = () => {
      const el = scrollRef.current
      if (!el || !stickToBottomRef.current) return
      lastScrollAtRef.current = Date.now()
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    }

    if (!stickToBottomRef.current) return

    const elapsed = Date.now() - lastScrollAtRef.current
    if (elapsed >= SCROLL_INTERVAL) {
      scrollToBottom()
      return
    }

    // Trailing call so the final chunk always lands at the bottom
    if (pendingScrollRef.current) clearTimeout(pendingScrollRef.current)
    pendingScrollRef.current = setTimeout(scrollToBottom, SCROLL_INTERVAL - elapsed)
    return () => {
      if (pendingScrollRef.current) clearTimeout(pendingScrollRef.current)
    }
  }, [state.messages])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setModelDropdownOpen(false)
      setConfigDropdownOpen(false)
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setInputValue("")
    textareaRef.current?.focus()
  }, [inputValue, isStreaming, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />

      {/* Animated gradient orbs for shader effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="shader-orb shader-orb-1" />
        <div className="shader-orb shader-orb-2" />
        <div className="shader-orb shader-orb-3" />
      </div>

      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-[0.15] grid-background" />

      {/* Noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/50 backdrop-blur-sm bg-background/30">
        <div className="relative">
          <Button
            className="btn-3d btn-glow gap-2 bg-gradient-to-br from-secondary/90 to-secondary/70 text-foreground hover:from-secondary/70 hover:to-secondary/50 backdrop-blur-sm border border-border/30 shadow-lg"
            onClick={(e) => {
              e.stopPropagation()
              setModelDropdownOpen(!modelDropdownOpen)
            }}
          >
            Scholera Tutor
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${modelDropdownOpen ? "rotate-180" : ""}`}
            />
          </Button>
          {modelDropdownOpen && (
            <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <button className="dropdown-item" onClick={() => setModelDropdownOpen(false)}>
                Scholera Tutor
              </button>
              <button className="dropdown-item" onClick={() => setModelDropdownOpen(false)}>
                ML Course · Week 1
              </button>
              <button className="dropdown-item" onClick={() => setModelDropdownOpen(false)}>
                ML Course · Week 2
              </button>
              <button className="dropdown-item" onClick={() => setModelDropdownOpen(false)}>
                ML Course · Week 3
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              className="btn-3d btn-glow gap-2 bg-gradient-to-br from-secondary/90 to-secondary/70 text-foreground hover:from-secondary/70 hover:to-secondary/50 backdrop-blur-sm border border-border/30 shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                setConfigDropdownOpen(!configDropdownOpen)
              }}
            >
              <Settings className="w-4 h-4" />
              Configuration
            </Button>
            {configDropdownOpen && (
              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <button className="dropdown-item" onClick={() => setConfigDropdownOpen(false)}>
                  General Settings
                </button>
                <button className="dropdown-item" onClick={() => setConfigDropdownOpen(false)}>
                  API Keys
                </button>
                <button className="dropdown-item" onClick={() => setConfigDropdownOpen(false)}>
                  Preferences
                </button>
                <button className="dropdown-item" onClick={() => setConfigDropdownOpen(false)}>
                  Advanced
                </button>
              </div>
            )}
          </div>

          <Button
            className="btn-3d btn-glow gap-2 bg-gradient-to-br from-secondary/90 to-secondary/70 text-foreground hover:from-secondary/70 hover:to-secondary/50 backdrop-blur-sm border border-border/30 shadow-lg"
            onClick={(e) => {
              e.stopPropagation()
              setPinnedPanelOpen(true)
            }}
          >
            <Pin className="w-4 h-4" />
            Pinned
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pb-6 overflow-hidden">
        {!hasMessages ? (
          /* ── Landing state — shown when no messages ── */
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="relative mb-8">
              <ParticleOrb />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-semibold text-foreground mb-8 text-center font-[var(--font-heading)] tracking-tight">
              Ready to Create Something New?
            </h1>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 mb-8">
              <Button
                variant="secondary"
                className="btn-3d btn-glow gap-2 bg-gradient-to-br from-secondary/90 to-secondary/70 text-foreground hover:from-secondary/70 hover:to-secondary/50 backdrop-blur-sm shadow-lg font-medium"
                onClick={() => {
                  setInputValue("Compare the regularization techniques we covered.")
                  textareaRef.current?.focus()
                }}
              >
                <ImageIcon className="w-4 h-4" />
                Create Image
              </Button>
              <Button
                variant="secondary"
                className="btn-3d btn-glow gap-2 bg-gradient-to-br from-secondary/90 to-secondary/70 text-foreground hover:from-secondary/70 hover:to-secondary/50 backdrop-blur-sm shadow-lg font-medium"
                onClick={() => {
                  setInputValue("Explain everything about backpropagation.")
                  textareaRef.current?.focus()
                }}
              >
                <Lightbulb className="w-4 h-4" />
                Brainstorm
              </Button>
              <Button
                variant="secondary"
                className="btn-3d btn-glow gap-2 bg-gradient-to-br from-secondary/90 to-secondary/70 text-foreground hover:from-secondary/70 hover:to-secondary/50 backdrop-blur-sm shadow-lg font-medium"
                onClick={() => {
                  setInputValue("What is the difference between supervised and unsupervised learning?")
                  textareaRef.current?.focus()
                }}
              >
                <FileText className="w-4 h-4" />
                Make a plan
              </Button>
            </div>

            {/* Composer — landing */}
            <div className="w-full max-w-4xl">
              {isRecording && <VoiceBar onCancel={() => setIsRecording(false)} onConfirm={() => setIsRecording(false)} />}
              <ComposerBox
                inputValue={inputValue}
                setInputValue={setInputValue}
                textareaRef={textareaRef}
                isStreaming={isStreaming}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                onSubmit={handleSubmit}
                onCancel={cancel}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        ) : (
          /* ── Conversation state — shown when messages exist ── */
          <div className="flex-1 flex flex-col w-full max-w-4xl overflow-hidden pt-4">
            {/* Scrollable message area */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="no-scrollbar chat-dot-grid flex-1 overflow-y-auto pr-1 pb-4"
            >
              <MessageList
                messages={state.messages}
                streamStateById={state.statusById}
                errorById={state.errorById}
                scenarioIdByMessageId={state.scenarioIdByMessageId}
                pinnedIds={state.pinnedIds}
                onOpenCitation={openCitation}
                onTogglePin={togglePin}
                onRetry={retry}
              />
            </div>

            {/* Composer — conversation */}
            <div className="shrink-0 pt-3">
              {isRecording && <VoiceBar onCancel={() => setIsRecording(false)} onConfirm={() => setIsRecording(false)} />}
              <ComposerBox
                inputValue={inputValue}
                setInputValue={setInputValue}
                textareaRef={textareaRef}
                isStreaming={isStreaming}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                onSubmit={handleSubmit}
                onCancel={cancel}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        )}
      </div>

      {/* Citation modal — rendered outside scroll context so it floats over everything */}
      <CitationModal citation={state.openCitationData} onClose={closeCitation} />

      {/* Pinned messages panel */}
      <PinnedPanel
        open={pinnedPanelOpen}
        onOpenChange={setPinnedPanelOpen}
        messages={pinnedMessages}
        onUnpin={togglePin}
        onJumpTo={jumpToMessage}
        onOpenCitation={openCitation}
      />
    </main>
  )
}

// ─── Sub-components (purely visual, extracted to avoid duplication) ────────────

interface VoiceBarProps {
  onCancel: () => void
  onConfirm: () => void
}

function VoiceBar({ onCancel, onConfirm }: VoiceBarProps) {
  return (
    <div className="mb-3 input-3d bg-gradient-to-r from-black/90 via-black/95 to-black/90 backdrop-blur-xl rounded-full border border-border/50 px-6 py-3 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Recording indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <p className="text-sm font-medium text-foreground">Recording...</p>
        </div>

        {/* Center: Voice wave animation */}
        <div className="flex-1 flex items-center justify-center gap-[2px] h-10 overflow-hidden">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="voice-wave-bar-horizontal bg-foreground/70 rounded-full shrink-0"
              style={{
                width: "2px",
                animationDelay: `${-i * 0.03}s`,
                animationDirection: "reverse",
              }}
            />
          ))}
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="btn-3d h-8 w-8 rounded-full bg-secondary/30 hover:bg-destructive/20 text-white hover:text-destructive"
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className="btn-3d btn-glow h-8 w-8 rounded-full bg-gradient-to-br from-primary via-gray-900 to-black hover:from-gray-900 hover:to-black text-white shadow-xl"
            onClick={onConfirm}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ComposerBoxProps {
  inputValue: string
  setInputValue: (v: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  isStreaming: boolean
  isRecording: boolean
  setIsRecording: (v: boolean) => void
  onSubmit: () => void
  onCancel: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

function ComposerBox({
  inputValue,
  setInputValue,
  textareaRef,
  isStreaming,
  isRecording,
  setIsRecording,
  onSubmit,
  onCancel,
  onKeyDown,
}: ComposerBoxProps) {
  const [optionsOpen, setOptionsOpen] = useState(false)

  useEffect(() => {
    if (!optionsOpen) return
    const handler = () => setOptionsOpen(false)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [optionsOpen])

  return (
    <div className="input-3d bg-gradient-to-br from-secondary/70 via-secondary/60 to-secondary/50 backdrop-blur-xl rounded-2xl border border-border/50 p-4 shadow-2xl">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Anything..."
            disabled={isStreaming}
            className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-lg min-h-[80px] font-normal disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="btn-3d gap-2 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="w-4 h-4" />
              Attach
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="btn-3d gap-2 text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="btn-3d gap-2 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  setOptionsOpen((prev) => !prev)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3H7V7H3V3Z" fill="currentColor" opacity="0.6" />
                  <path d="M9 3H13V7H9V3Z" fill="currentColor" opacity="0.6" />
                  <path d="M3 9H7V13H3V9Z" fill="currentColor" opacity="0.6" />
                  <path d="M9 9H13V13H9V9Z" fill="currentColor" opacity="0.6" />
                </svg>
                Options
              </Button>
              {optionsOpen && (
                <div className="dropdown-menu dropdown-menu-up" onClick={(e) => e.stopPropagation()}>
                  <button className="dropdown-item" onClick={() => setOptionsOpen(false)}>
                    Export as PDF
                  </button>
                  <button className="dropdown-item" onClick={() => setOptionsOpen(false)}>
                    Export as Markdown
                  </button>
                  <button className="dropdown-item" onClick={() => setOptionsOpen(false)}>
                    Export as JSON
                  </button>
                  <button className="dropdown-item" onClick={() => setOptionsOpen(false)}>
                    Share Link
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="btn-3d h-9 w-9 text-white hover:text-foreground"
              onClick={() => setIsRecording(!isRecording)}
            >
              <Mic className="w-4 h-4" />
            </Button>
            {isStreaming ? (
              /* Stop button — same visual as send button, different icon + action */
              <Button
                size="icon"
                className="btn-3d btn-glow h-9 w-9 rounded-full bg-gradient-to-br from-primary via-gray-900 to-black hover:from-gray-900 hover:to-black text-white shadow-xl"
                onClick={onCancel}
                aria-label="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </Button>
            ) : (
              /* Send button */
              <Button
                size="icon"
                className="btn-3d btn-glow h-9 w-9 rounded-full bg-gradient-to-br from-primary via-gray-900 to-black hover:from-gray-900 hover:to-black text-white shadow-xl"
                onClick={onSubmit}
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <ArrowUp className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
