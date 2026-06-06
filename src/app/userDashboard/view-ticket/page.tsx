import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import ViewTicketContent from './ViewTicketContent'

function ViewTicketFallback() {
  return (
    <Card className="bg-[#121212] p-8 text-white flex flex-col items-center gap-4 py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading order…</p>
    </Card>
  )
}

export default function ViewTicketPage() {
  return (
    <Suspense fallback={<ViewTicketFallback />}>
      <ViewTicketContent />
    </Suspense>
  )
}
