'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { classNames as cn } from '@/lib/utils/styles'

interface Tab {
  name: string
  href: string
}

interface TabsProps {
  tabs: Tab[]
}

export function Tabs({ tabs }: TabsProps) {
  const pathname = usePathname()

  return (
    <div className="border-b border-border-subtle">
      <nav
        className="-mb-px flex space-x-8 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          // Check if it's the exact path or a subpath (but avoid matching /clients/123/documents with /clients/123)
          // Since the base path is the overview, we need to be careful.
          const isOverviewTab = tab.name === 'Overview'
          const isCurrent = isOverviewTab
            ? pathname === tab.href // Overview matches exactly
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                isCurrent
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-text-secondary hover:border-border-subtle hover:text-text-primary',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors'
              )}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
