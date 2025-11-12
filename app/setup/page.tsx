'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { useProfile } from '@/contexts/ProfileContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTag } from '@/contexts/TagContext'
import { Snackbar } from '@/components/Snackbar'

const steps = ['Welcome', 'Create Profile', 'Choose Currency', 'Initialize']

// Default tags to initialize
const DEFAULT_EXPENSE_TAGS = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Travel',
]

const DEFAULT_INCOME_TAGS = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Bonus',
]

// Popular currencies
const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
]

export default function SetupPage() {
  const router = useRouter()
  const { addProfile, profiles, isLoading: profilesLoading } = useProfile()
  const { addCurrency, currencies, isLoading: currenciesLoading, setDefaultCurrency } = useCurrency()
  const { addTag, isLoading: tagsLoading } = useTag()
  
  // Persist step in sessionStorage to survive remounts
  const [activeStep, setActiveStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('setup-active-step')
      return saved ? parseInt(saved, 10) : 0
    }
    return 0
  })
  
  // Update sessionStorage when step changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('setup-active-step', activeStep.toString())
    }
  }, [activeStep])
  const [profileName, setProfileName] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [customCurrency, setCustomCurrency] = useState('')
  const [useCustomCurrency, setUseCustomCurrency] = useState(false)
  const [errors, setErrors] = useState<{
    profileName?: string
    currency?: string
  }>({})
  const [isInitializing, setIsInitializing] = useState(false)
  const [initializationProgress, setInitializationProgress] = useState(0)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  // Check if currencies exist to conditionally show step 3
  const [showCurrencyStep, setShowCurrencyStep] = useState(false)
  
  // Use ref to track if we're in the middle of creating a profile
  // This prevents the step from resetting when profiles state updates
  const isCreatingProfileRef = useRef(false)
  // Use ref to track the intended next step
  const intendedStepRef = useRef<number | null>(null)

  useEffect(() => {
    // Check if currencies exist
    if (!currenciesLoading) {
      if (currencies.length === 0) {
        setShowCurrencyStep(true)
      } else {
        setShowCurrencyStep(false)
      }
    }
  }, [currencies, currenciesLoading])
  
  // Prevent step reset when profiles change during profile creation
  useEffect(() => {
    // If we have an intended step, set it
    if (intendedStepRef.current !== null) {
      setActiveStep(intendedStepRef.current)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('setup-active-step', intendedStepRef.current.toString())
      }
      intendedStepRef.current = null
      return
    }
    
    // If we're creating a profile, don't reset the step
    if (isCreatingProfileRef.current) {
      return
    }
    // Only reset to step 0 if we have no profiles and we're not loading
    // This handles the case where user navigates to setup page fresh
    if (profiles.length === 0 && !profilesLoading && activeStep > 0) {
      // Don't reset - user might be in the middle of setup
    }
  }, [profiles, profilesLoading, activeStep])

  const handleNext = () => {
    if (activeStep === 1) {
      // Validate profile name
      if (!profileName.trim()) {
        setErrors({ profileName: 'Profile name is required' })
        return
      }
      if (profiles.some((p) => p.name.toLowerCase() === profileName.trim().toLowerCase())) {
        setErrors({ profileName: 'A profile with this name already exists' })
        return
      }
    }
    
    if (activeStep === 2 && showCurrencyStep) {
      // Validate currency
      const currencyCode = useCustomCurrency ? customCurrency.trim().toUpperCase() : selectedCurrency
      if (!currencyCode) {
        setErrors({ currency: 'Please select or enter a currency' })
        return
      }
      if (!/^[A-Z]{3}$/.test(currencyCode)) {
        setErrors({ currency: 'Currency code must be exactly 3 uppercase letters' })
        return
      }
    }

    setErrors({})
    // Skip to initialization step if currency step is not shown
    if (activeStep === 1 && !showCurrencyStep) {
      setActiveStep(3) // Skip to initialization
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    // If going back from initialization step and currency step is not shown, go to step 1
    if (activeStep === 3 && !showCurrencyStep) {
      setActiveStep(1)
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1)
    }
  }

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      setErrors({ profileName: 'Profile name is required' })
      return
    }
    if (profiles.some((p) => p.name.toLowerCase() === profileName.trim().toLowerCase())) {
      setErrors({ profileName: 'A profile with this name already exists' })
      return
    }

    // Set flag to prevent step reset during profile creation
    isCreatingProfileRef.current = true
    
    try {
      const trimmedName = profileName.trim()
      // Get current currencies state before adding profile (to avoid stale closure)
      const shouldShowCurrencyStep = currencies.length === 0
      
      await addProfile(trimmedName)
      
      // Clear the profile name field
      setProfileName('')
      setErrors({})
      
      // Advance to next step directly
      // Calculate the next step - check currencies again after profile is added
      // in case currencies were added during profile creation
      const currentCurrenciesCount = currencies.length
      const nextStep = currentCurrenciesCount === 0 ? 2 : 3
      
      console.log('Setting step to:', nextStep, 'currencies:', currentCurrenciesCount, 'showCurrencyStep:', shouldShowCurrencyStep)
      
      // Store intended step in ref - useEffect will set it when profiles update
      intendedStepRef.current = nextStep
      
      // Set step using functional update to ensure we have the latest state
      setActiveStep((prevStep) => {
        console.log('setActiveStep called, prevStep:', prevStep, 'nextStep:', nextStep)
        // Update sessionStorage immediately
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('setup-active-step', nextStep.toString())
        }
        return nextStep
      })
      
      // Also update sessionStorage directly as backup
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('setup-active-step', nextStep.toString())
      }
      
      // Reset flag after a delay to ensure state is committed
      setTimeout(() => {
        isCreatingProfileRef.current = false
        console.log('Reset isCreatingProfileRef flag')
      }, 300)
      
      setSnackbar({
        open: true,
        message: 'Profile created successfully',
        severity: 'success',
      })
    } catch (error: any) {
      isCreatingProfileRef.current = false
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create profile',
        severity: 'error',
      })
    }
  }

  const handleSelectCurrency = async () => {
    const currencyCode = useCustomCurrency ? customCurrency.trim().toUpperCase() : selectedCurrency
    if (!currencyCode) {
      setErrors({ currency: 'Please select or enter a currency' })
      return
    }
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      setErrors({ currency: 'Currency code must be exactly 3 uppercase letters' })
      return
    }

    try {
      await addCurrency(currencyCode, true) // Set as default
      setSnackbar({
        open: true,
        message: 'Currency added successfully',
        severity: 'success',
      })
      handleNext()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to add currency',
        severity: 'error',
      })
    }
  }

  const handleInitialize = async () => {
    setIsInitializing(true)
    setInitializationProgress(0)

    try {
      // Step 1: Profile is already created
      setInitializationProgress(25)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 2: Currency is already added
      setInitializationProgress(50)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 3: Initialize default tags
      setInitializationProgress(75)
      // Wait a bit for profile to be set as active
      await new Promise((resolve) => setTimeout(resolve, 300))
      // Add expense tags
      for (const tagName of DEFAULT_EXPENSE_TAGS) {
        try {
          await addTag(tagName, 'expense')
        } catch (error) {
          // Tag might already exist, continue
        }
      }
      // Add income tags
      for (const tagName of DEFAULT_INCOME_TAGS) {
        try {
          await addTag(tagName, 'income')
        } catch (error) {
          // Tag might already exist, continue
        }
      }

      setInitializationProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 500))

      setSnackbar({
        open: true,
        message: 'Setup completed successfully!',
        severity: 'success',
      })

      // Clear sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('setup-active-step')
      }

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to initialize account',
        severity: 'error',
      })
      setIsInitializing(false)
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Welcome to Finance App!
            </Typography>
            <Typography variant="body1" paragraph>
              Let&apos;s get you started with a few quick steps:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <li>
                <Typography variant="body1">Create your first profile</Typography>
              </li>
              <li>
                <Typography variant="body1">Set up your preferred currency</Typography>
              </li>
              <li>
                <Typography variant="body1">Initialize your account</Typography>
              </li>
            </Box>
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Create Profile
            </Typography>
            <Typography variant="body1" paragraph>
              Profiles help you organize your finances. You can create multiple profiles like:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 3 }}>
              <li>
                <Typography variant="body1">Personal</Typography>
              </li>
              <li>
                <Typography variant="body1">Business</Typography>
              </li>
              <li>
                <Typography variant="body1">Family</Typography>
              </li>
            </Box>
            <TextField
              fullWidth
              label="Profile Name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              error={!!errors.profileName}
              helperText={errors.profileName}
              margin="normal"
              required
              disabled={profilesLoading}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              All transactions will be associated with this profile. You can create more later.
            </Alert>
          </Box>
        )

      case 2:
        if (!showCurrencyStep) {
          // Skip this step if currencies already exist
          return null
        }
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Choose First Currency
            </Typography>
            <Typography variant="body1" paragraph>
              Select your primary currency:
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Currency</InputLabel>
              <Select
                value={useCustomCurrency ? 'custom' : selectedCurrency}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setUseCustomCurrency(true)
                  } else {
                    setUseCustomCurrency(false)
                    setSelectedCurrency(e.target.value)
                  }
                }}
                label="Currency"
                disabled={currenciesLoading}
              >
                {POPULAR_CURRENCIES.map((curr) => (
                  <MenuItem key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name} ({curr.symbol})
                  </MenuItem>
                ))}
                <MenuItem value="custom">+ Enter Custom Currency Code</MenuItem>
              </Select>
            </FormControl>
            {useCustomCurrency && (
              <TextField
                fullWidth
                label="Custom Currency Code"
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                error={!!errors.currency}
                helperText={errors.currency || 'Enter 3-letter ISO 4217 code (e.g., GBP)'}
                margin="normal"
                inputProps={{ maxLength: 3 }}
                disabled={currenciesLoading}
              />
            )}
            <Alert severity="info" sx={{ mt: 2 }}>
              This will be your default currency and will be pre-selected when creating
              transactions. You can add more later.
            </Alert>
          </Box>
        )

      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Initialization
            </Typography>
            {isInitializing ? (
              <Box>
                <Typography variant="body1" paragraph>
                  Setting up your account...
                </Typography>
                <LinearProgress variant="determinate" value={initializationProgress} sx={{ mb: 2 }} />
                <Box component="ul" sx={{ pl: 3 }}>
                  <li>
                    <Typography variant="body1" color={initializationProgress >= 25 ? 'success.main' : 'text.secondary'}>
                      Creating profile in database
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1" color={initializationProgress >= 50 ? 'success.main' : 'text.secondary'}>
                      Saving currency to local storage
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body1" color={initializationProgress >= 75 ? 'success.main' : 'text.secondary'}>
                      Initializing default tags
                    </Typography>
                  </li>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" paragraph>
                  Ready to initialize your account. This will:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <li>
                    <Typography variant="body1">Create your profile</Typography>
                  </li>
                  <li>
                    <Typography variant="body1">Save your currency preference</Typography>
                  </li>
                  <li>
                    <Typography variant="body1">Initialize default tags for expenses and income</Typography>
                  </li>
                </Box>
              </Box>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  // Adjust step labels based on whether currency step is shown
  const adjustedSteps = showCurrencyStep ? steps : ['Welcome', 'Create Profile', 'Initialize']
  // Map activeStep to display step (skip step 2 if currency step is not shown)
  const currentStep = showCurrencyStep
    ? activeStep
    : activeStep === 3
    ? 2 // Map step 3 (initialization) to display step 2
    : activeStep

  return (
    <PageLayout>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Setup
          </Typography>

          <Stepper activeStep={currentStep} sx={{ mt: 4, mb: 4 }}>
            {adjustedSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 300, mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0 || isInitializing}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep === 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCreateProfile}
                  disabled={profilesLoading || !profileName.trim()}
                >
                  Create Profile
                </Button>
              ) : activeStep === 2 && showCurrencyStep ? (
                <Button
                  variant="contained"
                  onClick={handleSelectCurrency}
                  disabled={currenciesLoading}
                >
                  Continue
                </Button>
              ) : activeStep === 3 ? (
                <Button
                  variant="contained"
                  onClick={handleInitialize}
                  disabled={isInitializing}
                >
                  {isInitializing ? 'Initializing...' : 'Complete Setup'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Continue
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </PageLayout>
  )
}

