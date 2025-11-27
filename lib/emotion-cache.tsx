'use client'

import { useServerInsertedHTML } from 'next/navigation'
import { useState } from 'react'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import type { EmotionCache } from '@emotion/cache'

// This ensures that Emotion styles are inserted in the correct order
// and prevents hydration mismatches in Next.js App Router
export default function EmotionCacheProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [cache] = useState<EmotionCache>(() => {
    const cache = createCache({ key: 'css', prepend: true })
    cache.compat = true
    return cache
  })

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted)
    if (names.length === 0) {
      return null
    }
    let styles = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inserted = cache.inserted as any
    for (const name of names) {
      const style = inserted[name]
      if (typeof style !== 'boolean' && style !== undefined) {
        styles += style
      }
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    )
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}

