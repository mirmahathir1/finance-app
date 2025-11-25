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
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { useProfile } from '@/contexts/ProfileContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTag } from '@/contexts/TagContext'
import type {
  SetupCatalogData,
  Profile as ProfileRecord,
  Currency as CurrencyRecord,
  Tag,
} from '@/types'
import { Snackbar } from '@/components/Snackbar'
import { LoadingButton } from '@/components/LoadingButton'
import { useApi } from '@/utils/useApi'
import {
  overwriteProfiles,
  overwriteCurrencies,
  overwriteTagsForProfile,
  setActiveProfile as setActiveProfileDB,
  setDefaultCurrency as setDefaultCurrencyDB,
} from '@/utils/indexedDB'
import { getCurrencyFromGeolocation } from '@/utils/geolocation'

const steps = ['Welcome', 'Create Profile', 'Choose Currency', 'Initialize']

const UUID = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`


function pickSuggestedProfile(
  summary: SetupCatalogData | null,
  currentProfile?: string | null
): string | null {
  if (!summary || summary.profiles.length === 0) {
    return currentProfile ?? null
  }
  if (currentProfile) {
    const exists = summary.profiles.some(
      (profile) => profile.name === currentProfile
    )
    if (exists) {
      return currentProfile
    }
  }
  return summary.profiles[0]?.name ?? null
}

function pickSuggestedCurrency(
  summary: SetupCatalogData | null,
  currentCurrency?: string | null
): string | null {
  if (!summary || summary.currencies.length === 0) {
    return currentCurrency ?? null
  }
  if (currentCurrency) {
    const exists = summary.currencies.some(
      (currency) => currency.code === currentCurrency
    )
    if (exists) {
      return currentCurrency
    }
  }
  return summary.currencies[0]?.code ?? null
}

export default function SetupPage() {
  const router = useRouter()
  const api = useApi()
  const {
    addProfile,
    profiles,
    activeProfile,
    isLoading: profilesLoading,
    refreshProfiles,
  } = useProfile()
  const {
    addCurrency,
    defaultCurrency,
    isLoading: currenciesLoading,
    refreshCurrencies,
  } = useCurrency()
  const { refreshTags } = useTag()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Check if user has transactions
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null)
  const [isCheckingTransactions, setIsCheckingTransactions] = useState(true)
  
  // Persist step in sessionStorage to survive remounts
  const [activeStep, setActiveStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('setup-active-step')
      return saved ? parseInt(saved, 10) : 0
    }
    return 0
  })
  const [catalogSummary, setCatalogSummary] = useState<SetupCatalogData | null>(null)
  const [isScanningCatalog, setIsScanningCatalog] = useState(false)
  const [isApplyingCatalog, setIsApplyingCatalog] = useState(false)
  
  // Update sessionStorage when step changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('setup-active-step', activeStep.toString())
    }
  }, [activeStep])
  
  // Check for transactions on mount
  useEffect(() => {
    const checkTransactions = async () => {
      try {
        setIsCheckingTransactions(true)
        // Only check transactions if there's an active profile
        // The API requires a profile parameter, and if there's no profile,
        // there can't be any transactions anyway
        if (!activeProfile) {
          setHasTransactions(false)
          setIsCheckingTransactions(false)
          return
        }
        
        const response = await api.getTransactions({ profile: activeProfile, limit: 1 })
        if (response.success && response.data) {
          const transactionCount = response.data.pagination?.total || response.data.transactions?.length || 0
          setHasTransactions(transactionCount > 0)
        } else {
          setHasTransactions(false)
        }
      } catch (error) {
        console.error('Error checking transactions:', error)
        setHasTransactions(false)
      } finally {
        setIsCheckingTransactions(false)
      }
    }
    
    // Wait for profiles to load before checking transactions
    if (!profilesLoading) {
      checkTransactions()
    }
  }, [api, activeProfile, profilesLoading])

  useEffect(() => {
    if (!hasTransactions) {
      setCatalogSummary(null)
    }
  }, [hasTransactions])
  const [profileName, setProfileName] = useState('Personal')
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null)
  const [isDetectingCurrency, setIsDetectingCurrency] = useState(false)
  const [customCurrency, setCustomCurrency] = useState('')
  const [useCustomCurrency, setUseCustomCurrency] = useState(false)
  const [errors, setErrors] = useState<{
    profileName?: string
    currency?: string
  }>({})
  const [isInitializing, setIsInitializing] = useState(false)
  const [isCreatingProfileLoading, setIsCreatingProfileLoading] = useState(false)
  const [isSelectingCurrency, setIsSelectingCurrency] = useState(false)
  const [initializationProgress, setInitializationProgress] = useState(0)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, message: '', severity: 'info' })

  // Check if currencies exist to conditionally show step 3
  const [showCurrencyStep, setShowCurrencyStep] = useState(false)
  // Lock whether the currency step should appear in the stepper for this session
  const [includeCurrencyStep, setIncludeCurrencyStep] = useState(true)
  const includeCurrencyStepDecidedRef = useRef(false)
  
  // Detect currency when currency step is shown (only once)
  const currencyDetectionAttemptedRef = useRef(false)
  useEffect(() => {
    if (activeStep === 2 && showCurrencyStep && !currencyDetectionAttemptedRef.current && !isDetectingCurrency && !detectedCurrency) {
      currencyDetectionAttemptedRef.current = true
      setIsDetectingCurrency(true)
      getCurrencyFromGeolocation()
        .then((currency) => {
          if (currency) {
            setDetectedCurrency(currency)
            setCustomCurrency(currency)
          } else {
            setUseCustomCurrency(true)
          }
        })
        .catch((error) => {
          console.error('Error detecting currency:', error)
          setUseCustomCurrency(true)
        })
        .finally(() => {
          setIsDetectingCurrency(false)
        })
    }
  }, [activeStep, showCurrencyStep, isDetectingCurrency, detectedCurrency])
  
  // Determine if profile and currency steps should be shown
  // Only show if user has no transactions
  const shouldShowProfileStep = hasTransactions === false
  const shouldShowCurrencyStep = hasTransactions === false && !defaultCurrency
  
  // Use ref to track if we're in the middle of creating a profile
  // This prevents the step from resetting when profiles state updates
  const isCreatingProfileRef = useRef(false)
  // Use ref to track the intended next step
  const intendedStepRef = useRef<number | null>(null)
  // Use ref to ensure we only auto-advance past the profile step once per mount
  const autoAdvanceAppliedRef = useRef(false)
  const hasExistingProfile = profiles.length > 0
  const existingProfileName = hasExistingProfile ? profiles[0].name : ''

  useEffect(() => {
    // Show currency step if no default currency is set AND user has no transactions
    if (!currenciesLoading && hasTransactions !== null) {
      if (!defaultCurrency && !hasTransactions) {
        setShowCurrencyStep(true)
      } else {
        setShowCurrencyStep(false)
      }
    }
  }, [defaultCurrency, currenciesLoading, hasTransactions])

  // Automatically skip the profile step when a profile already exists OR when transactions exist
  useEffect(() => {
    if (autoAdvanceAppliedRef.current) {
      return
    }
    if (profilesLoading || currenciesLoading || isCheckingTransactions || hasTransactions === null) {
      return
    }
    // Skip profile step if profile exists OR if transactions exist
    if (!hasExistingProfile && !hasTransactions) {
      return
    }
    // If transactions exist, skip directly to initialization
    if (hasTransactions) {
      if (activeStep < 3) {
        setActiveStep(3)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('setup-active-step', '3')
        }
        autoAdvanceAppliedRef.current = true
      }
      return
    }
    // If profile exists but no transactions, proceed normally
    const nextStep = shouldShowCurrencyStep ? 2 : 3
    if (activeStep >= nextStep) {
      autoAdvanceAppliedRef.current = true
      return
    }
    setActiveStep(nextStep)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('setup-active-step', nextStep.toString())
    }
    autoAdvanceAppliedRef.current = true
  }, [
    hasExistingProfile,
    profilesLoading,
    currenciesLoading,
    defaultCurrency,
    activeStep,
    hasTransactions,
    isCheckingTransactions,
    shouldShowCurrencyStep,
  ])
  
  // Decide ONCE whether to include the currency step in the stepper (don't collapse it later)
  // Only include if user has no transactions
  useEffect(() => {
    if (!includeCurrencyStepDecidedRef.current && !currenciesLoading && hasTransactions !== null) {
      setIncludeCurrencyStep(!defaultCurrency && !hasTransactions)
      includeCurrencyStepDecidedRef.current = true
    }
  }, [defaultCurrency, currenciesLoading, hasTransactions])
  
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
    // Only validate profile step if it should be shown
    if (activeStep === 1 && shouldShowProfileStep) {
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
    
    // Only validate currency step if it should be shown
    if (activeStep === 2 && showCurrencyStep && shouldShowCurrencyStep) {
      // Validate currency
      const currencyCode = customCurrency.trim().toUpperCase()
      if (!currencyCode) {
        setErrors({ currency: 'Please enter a currency code' })
        return
      }
      if (!/^[A-Z]{3}$/.test(currencyCode)) {
        setErrors({ currency: 'Currency code must be exactly 3 uppercase letters' })
        return
      }
    }

    setErrors({})
    // Skip to initialization step if currency step should not be shown
    if (activeStep === 1 && !shouldShowCurrencyStep) {
      setActiveStep(3) // Skip to initialization
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    // If going back from initialization step and currency step should not be shown, go to step 1
    if (activeStep === 3 && !shouldShowCurrencyStep) {
      setActiveStep(1)
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1)
    }
  }

  const advancePastProfileStep = (options: { trackIntended?: boolean } = {}) => {
    // Use shouldShowCurrencyStep to determine next step
    const nextStep = shouldShowCurrencyStep ? 2 : 3
    if (options.trackIntended) {
      intendedStepRef.current = nextStep
    }
    setActiveStep(nextStep)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('setup-active-step', nextStep.toString())
    }
  }

  const handleUseExistingProfile = () => {
    setErrors({})
    advancePastProfileStep()
  }

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      setErrors({ profileName: 'Profile name is required' })
      return
    }
    if (
      profiles.some(
        (p) => p.name.toLowerCase() === profileName.trim().toLowerCase()
      )
    ) {
      setErrors({ profileName: 'A profile with this name already exists' })
      handleUseExistingProfile()
      return
    }

    // Set flag to prevent step reset during profile creation
    isCreatingProfileRef.current = true
    
    try {
      setIsCreatingProfileLoading(true)
      const trimmedName = profileName.trim()
      await addProfile(trimmedName)
      
      // Clear the profile name field
      setProfileName('')
      setErrors({})
      
      // Advance to next step directly
      advancePastProfileStep({ trackIntended: true })
      
      // Reset flag after a delay to ensure state is committed
      setTimeout(() => {
        isCreatingProfileRef.current = false
      }, 300)
      
      setSnackbar({
        open: true,
        message: 'Profile created successfully',
        severity: 'success',
      })
    } catch (error: any) {
      isCreatingProfileRef.current = false
      const errorMessage = error?.message || 'Failed to create profile'
      if (errorMessage.toLowerCase().includes('already exists')) {
        handleUseExistingProfile()
        setSnackbar({
          open: true,
          message: 'Profile already exists. Using the existing profile to continue setup.',
          severity: 'info',
        })
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        })
      }
    } finally {
      setIsCreatingProfileLoading(false)
    }
  }

  const handleSelectCurrency = async () => {
    const currencyCode = customCurrency.trim().toUpperCase()
    if (!currencyCode) {
      setErrors({ currency: 'Please enter a currency code' })
      return
    }
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      setErrors({ currency: 'Currency code must be exactly 3 uppercase letters' })
      return
    }

    try {
      setIsSelectingCurrency(true)
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
    } finally {
      setIsSelectingCurrency(false)
    }
  }

  const handleInitialize = async () => {
    setIsInitializing(true)
    setInitializationProgress(0)

    try {
      const totalSteps = hasTransactions ? 0 : 2 // Profile + currency if no transactions exist
      let currentStep = 0
      
      // Step 1: Create profile (only if no transactions exist)
      if (!hasTransactions) {
        // Check if profile needs to be created
        if (profiles.length === 0 && profileName.trim()) {
          try {
            await addProfile(profileName.trim())
            // Profile is stored in IndexedDB via ProfileContext.addProfile
          } catch (error: any) {
            // Profile might already exist, continue
            if (!error.message?.toLowerCase().includes('already exists')) {
              throw error
            }
          }
        }
        currentStep++
        setInitializationProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Step 2: Add currency (only if no transactions exist)
      if (!hasTransactions) {
        // Check if currency needs to be added
        if (!defaultCurrency) {
          const currencyCode = customCurrency.trim().toUpperCase()
          if (currencyCode) {
            try {
              await addCurrency(currencyCode, true) // Set as default
              // Currency is stored in IndexedDB via CurrencyContext.addCurrency
            } catch (error: any) {
              // Currency might already exist, continue
              if (!error.message?.toLowerCase().includes('already exists')) {
                throw error
              }
            }
          }
        }
        currentStep++
        setInitializationProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 500))
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

  const handleScanCatalog = async () => {
    try {
      setIsScanningCatalog(true)
      const response = await api.getSetupCatalog()
      if (!response.success || !response.data?.catalog) {
        throw new Error(
          !response.success
            ? response.error.message
            : 'Unable to analyze transactions.'
        )
      }
      setCatalogSummary(response.data.catalog)
      setSnackbar({
        open: true,
        message: `Analyzed ${response.data.catalog.transactionCount} transaction(s).`,
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to scan transactions.',
        severity: 'error',
      })
    } finally {
      setIsScanningCatalog(false)
    }
  }

  const handleApplyCatalog = async () => {
    if (!catalogSummary) {
      setSnackbar({
        open: true,
        message: 'Please scan transactions first.',
        severity: 'warning',
      })
      return
    }

    setIsApplyingCatalog(true)

    try {
      const now = new Date().toISOString()

      const profileRecords: ProfileRecord[] = catalogSummary.profiles.map(
        (profile) => ({
          name: profile.name,
          createdAt: now,
          updatedAt: now,
        })
      )
      await overwriteProfiles(profileRecords)
      const suggestedProfile = pickSuggestedProfile(
        catalogSummary,
        activeProfile
      )
      if (suggestedProfile) {
        await setActiveProfileDB(suggestedProfile)
      }

      const currencyRecords: CurrencyRecord[] = catalogSummary.currencies.map(
        (currency) => ({
          code: currency.code,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        })
      )
      const suggestedCurrency = pickSuggestedCurrency(
        catalogSummary,
        defaultCurrency?.code ?? null
      )
      if (suggestedCurrency) {
        currencyRecords.forEach((currency) => {
          currency.isDefault = currency.code === suggestedCurrency
        })
        await setDefaultCurrencyDB(suggestedCurrency)
      }
      await overwriteCurrencies(currencyRecords)

      const tagGroups = new Map<string, Tag[]>()
      const profilesToUpdate = new Set<string>()

      profiles.forEach((profile) => profilesToUpdate.add(profile.name))
      catalogSummary.profiles.forEach((profile) =>
        profilesToUpdate.add(profile.name)
      )

      catalogSummary.tags.forEach((tagInfo) => {
        profilesToUpdate.add(tagInfo.profile)
        const tagRecord: Tag = {
          id: UUID(),
          name: tagInfo.name,
          profile: tagInfo.profile,
          type: tagInfo.type,
          createdAt: now,
          updatedAt: now,
        }
        const list = tagGroups.get(tagInfo.profile) ?? []
        list.push(tagRecord)
        tagGroups.set(tagInfo.profile, list)
      })

      await Promise.all(
        Array.from(profilesToUpdate.values()).map((profileName) =>
          overwriteTagsForProfile(profileName, tagGroups.get(profileName) ?? [])
        )
      )

      await refreshProfiles()
      await refreshCurrencies()
      await refreshTags()

      setSnackbar({
        open: true,
        message: 'Catalog rebuilt from existing transactions.',
        severity: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message || 'Failed to rebuild catalog.',
        severity: 'error',
      })
    } finally {
      setIsApplyingCatalog(false)
    }
  }

  const renderCatalogMigrationSection = () => {
    if (!hasTransactions) {
      return null
    }

    const transactionsDetected = catalogSummary?.transactionCount ?? null

    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          We detected existing transactions. Scan them to rebuild your profiles,
          currencies, and tags on this device.
        </Alert>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            mt: 2,
          }}
        >
          <LoadingButton
            variant="contained"
            onClick={handleScanCatalog}
            loading={isScanningCatalog}
            disabled={isApplyingCatalog}
          >
            Scan Transactions
          </LoadingButton>
          <LoadingButton
            variant="contained"
            color="success"
            onClick={handleApplyCatalog}
            loading={isApplyingCatalog}
            disabled={
              isScanningCatalog ||
              !catalogSummary ||
              catalogSummary.transactionCount === 0
            }
          >
            Apply Catalog to Frontend
          </LoadingButton>
        </Box>
        {catalogSummary && (
          <Paper
            variant="outlined"
            sx={{ mt: 3, p: 2, borderStyle: 'dashed' }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Catalog Preview
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Typography variant="body2">
                Transactions scanned:{' '}
                {transactionsDetected ?? 'not available'}
              </Typography>
              <Typography variant="body2">
                Profiles detected: {catalogSummary.profiles.length}
              </Typography>
              <Typography variant="body2">
                Currencies detected: {catalogSummary.currencies.length}
              </Typography>
              <Typography variant="body2">
                Tags detected: {catalogSummary.tags.length}
              </Typography>
            </Box>
            {catalogSummary.profiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Top profiles
                </Typography>
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                  {catalogSummary.profiles.slice(0, 3).map((profile) => (
                    <li key={profile.name}>
                      <Typography variant="body2">
                        {profile.name} ({profile.count})
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    )
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Welcome to Finance App!
            </Typography>
            {hasTransactions ? (
              <>
                <Typography variant="body1" paragraph>
                  You already have transactions in your account. Setup is complete.
                </Typography>
              </>
            ) : (
              <>
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
              </>
            )}
            {hasTransactions && renderCatalogMigrationSection()}
          </Box>
        )

      case 1:
        // Don't show profile step if transactions exist
        if (hasTransactions) {
          return null
        }
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
              label={hasExistingProfile ? 'Existing Profile' : 'Profile Name'}
              value={hasExistingProfile ? existingProfileName : profileName}
              onChange={(e) => setProfileName(e.target.value)}
              error={!hasExistingProfile && !!errors.profileName}
              helperText={
                hasExistingProfile
                  ? 'A profile is already set up. Continue to the next step.'
                  : errors.profileName
              }
              margin="normal"
              required
              disabled={profilesLoading || hasExistingProfile}
            />
            {hasExistingProfile ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                We detected an existing profile named &quot;{existingProfileName}&quot;. You can
                continue with this profile or create additional ones later from the Profiles page.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                All transactions will be associated with this profile. You can create more later.
              </Alert>
            )}
          </Box>
        )

      case 2:
        // Don't show currency step if still checking transactions, if transactions exist, or if currency step shouldn't be shown
        if (isCheckingTransactions || hasTransactions === null || !shouldShowCurrencyStep) {
          return null
        }
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Choose First Currency
            </Typography>
            <Typography variant="body1" paragraph>
              {isDetectingCurrency
                ? 'Detecting your currency based on your location...'
                : detectedCurrency
                ? `We detected ${detectedCurrency} based on your location. You can change it if needed:`
                : 'Enter your primary currency code:'}
            </Typography>
            {isDetectingCurrency ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TextField
                fullWidth
                label="Currency Code"
                value={customCurrency}
                onChange={(e) => {
                  setCustomCurrency(e.target.value.toUpperCase())
                  setErrors((prev) => ({ ...prev, currency: undefined }))
                }}
                error={!!errors.currency}
                helperText={errors.currency || 'Enter 3-letter ISO 4217 code (e.g., USD, EUR, GBP)'}
                margin="normal"
                inputProps={{ maxLength: 3 }}
                disabled={currenciesLoading}
                placeholder="e.g., USD"
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
                  {!hasTransactions && (
                    <li>
                      <Typography variant="body1" color={initializationProgress >= 50 ? 'success.main' : 'text.secondary'}>
                        Creating profile in database
                      </Typography>
                    </li>
                  )}
                  {!hasTransactions && (
                    <li>
                      <Typography variant="body1" color={initializationProgress >= 100 ? 'success.main' : 'text.secondary'}>
                        Saving currency to local storage
                      </Typography>
                    </li>
                  )}
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" paragraph>
                  Ready to initialize your account. This will:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  {!hasTransactions && (
                    <li>
                      <Typography variant="body1">Create your profile</Typography>
                    </li>
                  )}
                  {!hasTransactions && (
                    <li>
                      <Typography variant="body1">Save your currency preference</Typography>
                    </li>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  // Adjust step labels based on whether currency step is shown and if transactions exist
  // If transactions exist, only show Welcome and Initialize steps
  const adjustedSteps = hasTransactions
    ? ['Welcome', 'Initialize']
    : includeCurrencyStep
    ? steps
    : ['Welcome', 'Create Profile', 'Initialize']
  
  // Map activeStep to display step
  // If transactions exist, map step 3 to display step 1 (Initialize)
  const currentStep = hasTransactions
    ? activeStep === 3
      ? 1 // Map step 3 (initialization) to display step 1 when transactions exist
      : activeStep
    : includeCurrencyStep
    ? activeStep
    : activeStep === 3
    ? 2 // Map step 3 (initialization) to display step 2 when currency step is skipped
    : activeStep

  return (
    <PageLayout pageName="Setup">
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ mt: 4, mb: 4, overflowX: 'auto' }}>
            <Stepper
              activeStep={currentStep}
              alternativeLabel={!isSmallScreen}
              orientation={isSmallScreen ? 'vertical' : 'horizontal'}
              sx={{
                flexDirection: isSmallScreen ? 'column' : 'row',
                alignItems: isSmallScreen ? 'flex-start' : 'center',
                '.MuiStep-root': {
                  width: isSmallScreen ? '100%' : 'auto',
                },
                '.MuiStepLabel-label': {
                  typography: isSmallScreen ? 'body2' : 'body1',
                  textAlign: isSmallScreen ? 'left' : 'center',
                  whiteSpace: 'normal',
                },
              }}
            >
              {adjustedSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Box sx={{ minHeight: 300, mb: 4 }}>
            {isCheckingTransactions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
              </Box>
            ) : (
              renderStepContent(activeStep)
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0 || isInitializing || isCheckingTransactions}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {isCheckingTransactions ? null : activeStep === 1 && shouldShowProfileStep ? (
                hasExistingProfile ? (
                  <Button
                    variant="contained"
                    onClick={handleUseExistingProfile}
                    disabled={profilesLoading}
                  >
                    Continue
                  </Button>
                ) : (
                  <LoadingButton
                    variant="contained"
                    onClick={handleCreateProfile}
                    loading={isCreatingProfileLoading}
                    disabled={profilesLoading || !profileName.trim()}
                  >
                    Create Profile
                  </LoadingButton>
                )
              ) : activeStep === 2 && showCurrencyStep && shouldShowCurrencyStep ? (
                <LoadingButton
                  variant="contained"
                  onClick={handleSelectCurrency}
                  loading={isSelectingCurrency}
                  disabled={currenciesLoading}
                >
                  Continue
                </LoadingButton>
              ) : activeStep === 3 ? (
                <LoadingButton
                  variant="contained"
                  onClick={handleInitialize}
                  loading={isInitializing}
                  disabled={isInitializing}
                >
                  Complete Setup
                </LoadingButton>
              ) : (
                <Button variant="contained" onClick={handleNext} disabled={isCheckingTransactions}>
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

