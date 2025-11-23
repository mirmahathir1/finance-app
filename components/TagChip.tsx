'use client'

import { Chip } from '@mui/material'
import type { Tag } from '@/types'

interface TagChipProps {
  tag: Tag
  size?: 'small' | 'medium'
  onDelete?: () => void
  onClick?: () => void
}

export function TagChip({ tag, size = 'small', onDelete, onClick }: TagChipProps) {
  const borderColor = tag.type === 'income' ? '#4caf50' : '#f44336' // Green for income, red for expense

  return (
    <Chip
      label={tag.name}
      size={size}
      sx={{
        border: `4px solid ${borderColor}`,
        borderColor: borderColor,
      }}
      onDelete={onDelete}
      onClick={onClick}
    />
  )
}

