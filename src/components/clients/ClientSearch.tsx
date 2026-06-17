'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import { TextField } from '../ui/TextField'

export function ClientSearch({ initialSearch }: { initialSearch: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm === initialSearch) return

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (searchTerm) {
          params.set('search', searchTerm)
          params.set('page', '1') // Reset to page 1 on new search
        } else {
          params.delete('search')
        }
        router.push(`${pathname}?${params.toString()}`)
      })
    }, 300) // Debounce 300ms

    return () => clearTimeout(timer)
  }, [searchTerm, pathname, router, searchParams, initialSearch])

  return (
    <div className="w-full max-w-sm relative">
      <TextField
        type="search"
        placeholder="Search PAN, mobile, or name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={isPending ? 'opacity-70' : ''}
        aria-label="Search clients"
      />
    </div>
  )
}
