'use client'

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import { useProfile } from '@/contexts/ProfileContext'

interface ProfileSelectorProps {
  value?: string
  onChange?: (profile: string) => void
  label?: string
  required?: boolean
  error?: boolean
  helperText?: string
  disabled?: boolean
  fullWidth?: boolean
  autoSwitch?: boolean // If true, automatically switch profile when changed
}

export function ProfileSelector({
  value,
  onChange,
  label = 'Profile',
  required,
  error,
  helperText,
  disabled,
  fullWidth = true,
  autoSwitch = false,
}: ProfileSelectorProps) {
  const { profiles, activeProfile, switchProfile, isLoading } = useProfile()
  const currentValue = value !== undefined ? value : activeProfile || ''

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const newProfile = event.target.value
    if (onChange) {
      onChange(newProfile)
    }
    if (autoSwitch && newProfile !== activeProfile) {
      await switchProfile(newProfile)
    }
  }

  return (
    <FormControl fullWidth={fullWidth} required={required} error={error} disabled={disabled || isLoading}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={currentValue}
        onChange={handleChange}
        label={label}
      >
        {profiles.map((profile) => (
          <MenuItem key={profile.name} value={profile.name}>
            {profile.name}
            {profile.name === activeProfile && ' (Active)'}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <div style={{ marginTop: '4px', fontSize: '0.75rem', color: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.6)' }}>
          {helperText}
        </div>
      )}
    </FormControl>
  )
}

