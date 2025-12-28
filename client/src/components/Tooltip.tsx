import { useState, type ReactNode } from 'react'
import { cn } from '../theme'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
  contentClassName?: string
}

export const Tooltip = ({ content, children, side = 'top', className, contentClassName }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className={cn("relative flex w-fit", className)} // w-fit to wrap content tightly, but flexible
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute left-1/2 z-[1000] -translate-x-1/2 whitespace-normal break-words rounded-xl bg-motion-plum p-4 text-base text-white shadow-xl",
          "w-max", // Force width to try to fit content
          side === 'top' ? "bottom-full mb-3" : "top-full mt-3",
          contentClassName
        )}>
          {content}
          {/* Simple Arrow */}
          <div className={cn(
            "absolute left-1/2 h-0 w-0 -translate-x-1/2 border-[8px] border-transparent",
            side === 'top' ? "top-full border-t-motion-plum" : "bottom-full border-b-motion-plum"
          )} />
        </div>
      )}
    </div>
  )
}
