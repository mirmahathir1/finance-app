'use client'

import { createTheme, ThemeOptions } from '@mui/material/styles'

const commonThemeOptions: ThemeOptions = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  spacing: 8, // 8px base unit
  shape: {
    borderRadius: 30, // Border radius for all components
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Disable uppercase transformation
          borderRadius: 30, // Border radius for buttons
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Border radius for icon buttons
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Border radius for toggle buttons
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Border radius for cards
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Border radius for paper components
        },
      },
    },
  },
}

// Light theme
export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#053d70', // Darker Blue
    },
    secondary: {
      main: '#880e4f', // Darker Pink
    },
    success: {
      main: '#2e7d32', // Darker Green
    },
    error: {
      main: '#8b0000', // Darker Red
    },
    warning: {
      main: '#bf360c', // Darker Orange
    },
    background: {
      default: '#e0e0e0', // Darker Gray
      paper: '#f5f5f5',
    },
  },
})

// Dark theme
export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#2d4f6f', // Darker Blue for dark mode
    },
    secondary: {
      main: '#c06a8a', // Darker Pink for dark mode
    },
    success: {
      main: '#5a9d5e', // Darker Green for dark mode
    },
    error: {
      main: '#8b0000', // Darker Red for dark mode
    },
    warning: {
      main: '#a0280a', // Darker Orange for dark mode
    },
    background: {
      default: '#0a0a0a', // Darker background
      paper: '#141414', // Darker paper
    },
  },
})

// Default export for backward compatibility
export const theme = lightTheme

