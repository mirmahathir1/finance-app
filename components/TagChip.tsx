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
  // Generate a color if not provided
  const getColor = (tagColor?: string): string => {
    if (tagColor) return tagColor
    
    // Generate a consistent color based on tag name
    const colors = [
      '#1976d2', // Blue
      '#dc004e', // Pink
      '#4caf50', // Green
      '#ff9800', // Orange
      '#9c27b0', // Purple
      '#f44336', // Red
      '#00bcd4', // Cyan
      '#ffeb3b', // Yellow
    ]
    const index = tag.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  return (
    <Chip
      label={tag.name}
      size={size}
      sx={{
        backgroundColor: getColor(tag.color),
        color: '#fff',
        '&:hover': {
          backgroundColor: getColor(tag.color),
          opacity: 0.8,
        },
      }}
      onDelete={onDelete}
      onClick={onClick}
    />
  )
}

