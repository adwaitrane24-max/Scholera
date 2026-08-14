"use client"

import { Pin, PinOff } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import CitationChip from "./CitationChip"
import type { Citation, Message } from "@/lib/scholera/types"

const PREVIEW_LENGTH = 160

interface PinnedPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: Message[]
  onUnpin: (message: Message) => void
  onJumpTo: (messageId: string) => void
  onOpenCitation: (citation: Citation) => void
}

function preview(content: string): string {
  const trimmed = content.trim()
  if (trimmed.length <= PREVIEW_LENGTH) return trimmed
  return `${trimmed.slice(0, PREVIEW_LENGTH).trimEnd()}…`
}

export default function PinnedPanel({
  open,
  onOpenChange,
  messages,
  onUnpin,
  onJumpTo,
  onOpenCitation,
}: PinnedPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-sidebar-border bg-sidebar text-sidebar-foreground sm:max-w-md">
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
            <Pin className="h-4 w-4" />
            Pinned messages
          </SheetTitle>
          <SheetDescription>Tutor responses you&apos;ve saved from this conversation.</SheetDescription>
        </SheetHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {messages.length === 0 ? (
            <p className="mt-6 text-sm leading-6 text-muted-foreground">
              No pinned messages yet — pin a tutor response to save it here.
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li key={message.id} className="input-3d rounded-xl border border-border/50 bg-secondary/50 p-3">
                  <button
                    type="button"
                    onClick={() => onJumpTo(message.id)}
                    className="block w-full text-left text-sm leading-6 text-foreground/90 hover:text-foreground"
                  >
                    {preview(message.content) || "(empty response)"}
                  </button>

                  {Boolean(message.citations?.length) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.citations!.map((citation, index) => (
                        <CitationChip
                          key={`${message.id}-${citation.lecture}-${citation.slide}-${index}`}
                          citation={citation}
                          onClick={onOpenCitation}
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onUnpin(message)}
                      className="btn-3d flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <PinOff className="h-3 w-3" />
                      Unpin
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
