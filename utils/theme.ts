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
      main: '#1976d2', // Material Blue
    },
    secondary: {
      main: '#dc004e', // Pink
    },
    success: {
      main: '#4caf50', // Green
    },
    error: {
      main: '#f44336', // Red
    },
    background: {
      default: '#fafafa', // Light Gray
      paper: '#ffffff',
    },
  },
})

// Dark theme
export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // Light Blue for dark mode
    },
    secondary: {
      main: '#f48fb1', // Light Pink for dark mode
    },
    success: {
      main: '#81c784', // Light Green for dark mode
    },
    error: {
      main: '#e57373', // Light Red for dark mode
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1e1e1e', // Dark paper
    },
  },
})

// Default export for backward compatibility
export const theme = lightTheme

