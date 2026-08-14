"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import {
  MessageSquarePlus,
  MessageSquare,
  Archive,
  BookOpen,
  FolderPlus,
  ImageIcon,
  Presentation,
  FileText,
  Crown,
  PanelLeft,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "zyricon:sidebar-collapsed"

interface NavItem {
  label: string
  icon: LucideIcon
}

const FEATURES: NavItem[] = [
  { label: "Chat", icon: MessageSquare },
  { label: "Archived", icon: Archive },
  { label: "Library", icon: BookOpen },
]

const WORKSPACES: NavItem[] = [
  { label: "New Project", icon: FolderPlus },
  { label: "Image", icon: ImageIcon },
  { label: "Presentation", icon: Presentation },
  { label: "Riset", icon: FileText },
  { label: "Image", icon: ImageIcon },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  // Transitions stay off until after hydration so a persisted "collapsed"
  // state doesn't animate open→closed on first paint.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      /* localStorage unavailable — fall back to expanded */
    }
    setReady(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <aside
        className={`shrink-0 overflow-hidden bg-sidebar border-r border-sidebar-border flex flex-col ${
          ready ? "transition-[width] duration-300 ease-in-out" : ""
        } ${collapsed ? "w-[68px]" : "w-80"}`}
      >
        {/* Header */}
        <div
          className={`p-4 flex items-center border-b border-sidebar-border ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground font-[var(--font-heading)] tracking-tight truncate">
                Zyricon
              </span>
            </div>
          )}
          <RailTooltip label={collapsed ? "Expand sidebar" : "Collapse sidebar"} enabled>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={toggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              <PanelLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
            </Button>
          </RailTooltip>
        </div>

        {/* New Chat Button */}
        <div className={collapsed ? "p-3 flex justify-center" : "p-3"}>
          <RailTooltip label="New Chat" enabled={collapsed}>
            <Button
              variant="secondary"
              className={`btn-3d btn-glow bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 font-medium ${
                collapsed ? "h-10 w-10 p-0 justify-center" : "w-full justify-start gap-2"
              }`}
              aria-label={collapsed ? "New Chat" : undefined}
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0" />
              {!collapsed && "New Chat"}
            </Button>
          </RailTooltip>
        </div>

        {/* Features + Workspaces */}
        <div className={`custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? "px-2" : "px-3"}`}>
          <div className="mb-4">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            ) : (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Features
              </h3>
            )}
            <div className="space-y-1">
              {FEATURES.map((item) => (
                <NavButton key={item.label} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>

          <div>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            ) : (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspaces
              </h3>
            )}
            <div className="space-y-1">
              {WORKSPACES.map((item, index) => (
                <NavButton key={`${item.label}-${index}`} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Card — hidden entirely on the collapsed rail */}
        {!collapsed && (
          <div className="p-3">
            <div className="card-3d bg-sidebar-accent rounded-xl p-4 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sidebar-accent/50 flex items-center justify-center mx-auto">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-sm font-semibold text-sidebar-foreground font-[var(--font-heading)]">
                  Upgrade to premium
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Boost productivity with seamless automation and responsive AI, built to adapt to your needs.
                </p>
              </div>
              <Button className="btn-3d btn-glow w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border border-sidebar-border font-medium">
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </aside>
    </TooltipPrimitive.Provider>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavButton({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  return (
    <RailTooltip label={item.label} enabled={collapsed}>
      <Button
        variant="ghost"
        className={`btn-3d text-sidebar-foreground hover:bg-sidebar-accent font-medium ${
          collapsed ? "h-10 w-10 mx-auto p-0 flex justify-center" : "w-full justify-start gap-3"
        }`}
        aria-label={collapsed ? item.label : undefined}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Button>
    </RailTooltip>
  )
}

/** Dark-themed tooltip, portalled so the scroll container can't clip it. */
function RailTooltip({
  label,
  enabled,
  children,
}: {
  label: string
  enabled: boolean
  children: ReactNode
}) {
  if (!enabled) return <>{children}</>

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="right"
          sideOffset={8}
          className="z-50 rounded-md border border-border/60 bg-secondary px-2.5 py-1.5 text-xs text-foreground shadow-xl animate-in fade-in zoom-in-95"
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-secondary" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
