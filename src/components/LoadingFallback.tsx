import { Loader2 } from 'lucide-react'

export function LoadingFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">加载中...</p>
      </div>
    </div>
  )
}
