'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ThemeProvider as MUIThemeProvider, useTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { lightTheme, darkTheme } from '@/utils/theme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleColorMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'finance-app-theme-mode'

export function useThemeMode() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [mounted, setMounted] = useState(false)

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    if (savedMode === 'light' || savedMode === 'dark') {
      setMode(savedMode)
    } else {
      // Default to system preference if no saved preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setMode(prefersDark ? 'dark' : 'light')
    }
    setMounted(true)
  }, [])

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
    }
  }, [mode, mounted])

  const toggleColorMode = useMemo(
    () => () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
    },
    []
  )

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode])

  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode, toggleColorMode]
  )

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <MUIThemeProvider theme={lightTheme}>
        <CssBaseline />
        <BodyBackgroundColor />
        {children}
      </MUIThemeProvider>
    )
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <BodyBackgroundColor />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  )
}

// Component to set body background color based on theme
// This ensures the background color is applied correctly in dark mode
function BodyBackgroundColor() {
  const theme = useTheme()
  
  useEffect(() => {
    // Set background color with !important to ensure it overrides any conflicting styles
    const bgColor = theme.palette.background.default
    document.body.style.setProperty('background-color', bgColor, 'important')
    
    return () => {
      document.body.style.removeProperty('background-color')
    }
  }, [theme.palette.background.default])

  return null
}

