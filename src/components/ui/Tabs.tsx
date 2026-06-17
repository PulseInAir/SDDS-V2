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
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
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
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors'
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
