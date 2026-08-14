import { ChatArea } from "@/components/chat-area"
import { Sidebar } from "@/components/sidebar"

export default function Home() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <ChatArea />
    </div>
  )
}
