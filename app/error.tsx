'use client'

import { useEffect } from 'react'
import { Box } from '@mui/material'
import { ErrorState } from '@/components/ErrorState'
import { getErrorMessage } from '@/utils/error'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box maxWidth={600} width="100%">
        <ErrorState
          title="Something went wrong"
          message={getErrorMessage(error, 'An unexpected error occurred.')}
          onRetry={reset}
          retryLabel="Reload page"
        />
      </Box>
    </Box>
  )
}

