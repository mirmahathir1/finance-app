'use client'

import { Box, LinearProgress } from '@mui/material'
import { useLoading } from '@/contexts/LoadingContext'

export function GlobalProgressBar() {
  const { isLoading } = useLoading()

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      {isLoading && <LinearProgress />}
    </Box>
  )
}

