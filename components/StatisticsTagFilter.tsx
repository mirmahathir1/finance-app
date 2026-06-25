'use client'

import { useMemo } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import type { Tag } from '@/types'

interface StatisticsTagFilterProps {
  tags: Tag[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

// Generate a consistent pseudo-random value between 0 and 1 based on tag ID
function getRandomIntensity(tagId: string): number {
  let hash = 0
  for (let i = 0; i < tagId.length; i++) {
    const char = tagId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
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

function getTagGradient(tag: Tag): string {
  const intensity = getRandomIntensity(tag.id)

  if (tag.type === 'income') {
    const greenLight = '#2e7d32'
    const greenDark = '#064e1a'
    const greenMid = '#1b5e20'
    const startColor = interpolateColor(greenLight, greenMid, intensity)
    const endColor = interpolateColor(greenMid, greenDark, intensity)
    return `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
  }

  const redLight = '#b71c1c'
  const redDark = '#4a0000'
  const redMid = '#8b0000'
  const startColor = interpolateColor(redLight, redMid, intensity)
  const endColor = interpolateColor(redMid, redDark, intensity)
  return `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
}

export function StatisticsTagFilter({
  tags,
  selectedTags,
  onChange,
}: StatisticsTagFilterProps) {
  // De-duplicate by name (tags can repeat across income/expense) and sort alphabetically.
  const uniqueTags = useMemo(() => {
    const byName = new Map<string, Tag>()
    for (const tag of tags) {
      if (!byName.has(tag.name)) {
        byName.set(tag.name, tag)
      }
    }
    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tags])

  if (uniqueTags.length === 0) {
    return null
  }

  const selectedSet = new Set(selectedTags)

  const toggleTag = (name: string) => {
    if (selectedSet.has(name)) {
      onChange(selectedTags.filter((tag) => tag !== name))
    } else {
      onChange([...selectedTags, name])
    }
  }

  return (
    <Box
      sx={{
        mt: 3,
        px: { xs: 2, sm: 3 },
        py: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Filter by tags
        </Typography>
        {selectedTags.length > 0 && (
          <Button size="small" onClick={() => onChange([])}>
            Clear ({selectedTags.length})
          </Button>
        )}
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {uniqueTags.map((tag) => {
          const isSelected = selectedSet.has(tag.name)
          const gradient = getTagGradient(tag)

          return (
            <Chip
              key={tag.name}
              label={tag.name}
              size="small"
              clickable
              onClick={() => toggleTag(tag.name)}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={
                isSelected
                  ? {
                      background: gradient,
                      color: 'white',
                      fontWeight: 600,
                      border: 'none',
                      '&:hover': {
                        background: gradient,
                        opacity: 0.9,
                      },
                    }
                  : {
                      borderColor: 'divider',
                      color: 'text.primary',
                    }
              }
            />
          )
        })}
      </Box>
    </Box>
  )
}
