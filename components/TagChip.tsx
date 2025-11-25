'use client'

import { Chip } from '@mui/material'
import type { Tag } from '@/types'

interface TagChipProps {
  tag: Tag
  size?: 'small' | 'medium'
  onDelete?: () => void
  onClick?: () => void
}

// Generate a consistent pseudo-random value between 0 and 1 based on tag ID
function getRandomIntensity(tagId: string): number {
  let hash = 0
  for (let i = 0; i < tagId.length; i++) {
    const char = tagId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // Normalize to 0-1 range
  return Math.abs(hash % 1000) / 1000
}

// Interpolate between two hex colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')
  
  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)
  
  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)
  
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function TagChip({ tag, size = 'small', onDelete, onClick }: TagChipProps) {
  const intensity = getRandomIntensity(tag.id)
  
  // Define color ranges for gradients
  const greenLight = '#2e7d32' // Lightest green
  const greenDark = '#064e1a' // Darkest green
  const greenMid = '#1b5e20' // Medium green
  
  const redLight = '#b71c1c' // Lightest red
  const redDark = '#4a0000' // Darkest red
  const redMid = '#8b0000' // Medium red
  
  let gradient: string
  if (tag.type === 'income') {
    // Vary the green gradient based on intensity
    const startColor = interpolateColor(greenLight, greenMid, intensity)
    const endColor = interpolateColor(greenMid, greenDark, intensity)
    gradient = `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
  } else {
    // Vary the red gradient based on intensity
    const startColor = interpolateColor(redLight, redMid, intensity)
    const endColor = interpolateColor(redMid, redDark, intensity)
    gradient = `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
  }

  return (
    <Chip
      label={tag.name}
      size={size}
      sx={{
        background: gradient,
        color: 'white',
        '& .MuiChip-deleteIcon': {
          color: 'white',
        },
      }}
      onDelete={onDelete}
      onClick={onClick}
    />
  )
}

