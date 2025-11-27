'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  LinearProgress,
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/contexts/ProfileContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useTag } from '@/contexts/TagContext'
import { useApi } from '@/utils/useApi'
import { persistSetupCatalogSummary } from '@/utils/setupCatalogStorage'
import {
  overwriteProfiles,
  overwriteCurrencies,
  overwriteTagsForProfile,
  setActiveProfile as setActiveProfileDB,
  getAllProfiles,
} from '@/utils/indexedDB'
import type {
  SetupCatalogData,
  Profile as ProfileRecord,
  Currency as CurrencyRecord,
  Tag,
} from '@/types'

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

export default function InitializingPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { activeProfile, refreshProfiles } = useProfile()
  const { defaultCurrency, refreshCurrencies } = useCurrency()
  const { refreshTags } = useTag()
  const api = useApi()
  const [progress, setProgress] = useState(0)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return
    }

    // If not authenticated, redirect to sign-in
    if (!user) {
      router.replace('/auth/signin')
      return
    }

    // Only run initialization once
    if (hasInitializedRef.current) {
      return
    }

    const initialize = async () => {
      hasInitializedRef.current = true
      persistSetupCatalogSummary(null)
      try {
        setProgress(10)

        // Check if transactions exist by calling the catalog API
        const catalogResponse = await api.getSetupCatalog()
        const catalog =
          catalogResponse.success && catalogResponse.data?.catalog
            ? catalogResponse.data.catalog
            : null

        persistSetupCatalogSummary(catalog)

        if (catalog) {
          const transactionCount = catalog.transactionCount || 0

          if (transactionCount > 0) {
            // Prepopulate profiles, currencies, and tags
            setProgress(30)

            const now = new Date().toISOString()

            // Import profiles
            if (catalog.profiles && catalog.profiles.length > 0) {
              const profileRecords: ProfileRecord[] = catalog.profiles.map((profile) => ({
                name: profile.name,
                createdAt: now,
                updatedAt: now,
              }))
              await overwriteProfiles(profileRecords)

              // Set active profile if needed
              const suggestedProfile = pickSuggestedProfile(catalog, activeProfile)
              if (suggestedProfile) {
                await setActiveProfileDB(suggestedProfile)
              }
            }

            setProgress(50)

            // Import currencies
            if (catalog.currencies && catalog.currencies.length > 0) {
              const suggestedCurrency = pickSuggestedCurrency(catalog, defaultCurrency?.code ?? null)
              const currencyRecords: CurrencyRecord[] = catalog.currencies.map((currency) => ({
                code: currency.code,
                isDefault: currency.code === suggestedCurrency,
                createdAt: now,
                updatedAt: now,
              }))

              await overwriteCurrencies(currencyRecords)
            }

            setProgress(70)

            // Import tags
            if (catalog.tags && catalog.tags.length > 0) {
              const tagGroups = new Map<string, Tag[]>()
              const profilesToUpdate = new Set<string>()

              catalog.profiles.forEach((profile) => profilesToUpdate.add(profile.name))
              catalog.tags.forEach((tagInfo) => {
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
            }

            setProgress(85)

            // Refresh contexts to load the new data
            await refreshProfiles()
            await refreshCurrencies()
            await refreshTags()

            // Wait a bit to ensure contexts are fully loaded
            await new Promise((resolve) => setTimeout(resolve, 300))

            setProgress(100)

            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              router.replace('/')
            }, 500)
          } else {
            // No transactions, check if profiles exist
            setProgress(50)

            // Wait for profiles to load
            await new Promise((resolve) => setTimeout(resolve, 500))

            // Check if we need to go to setup
            const allProfiles = await getAllProfiles()
            
            if (allProfiles.length === 0) {
              // No profiles, redirect to setup
              setProgress(100)
              setTimeout(() => {
                router.replace('/setup')
              }, 500)
            } else {
              // Profiles exist, go to dashboard
              setProgress(100)
              setTimeout(() => {
                router.replace('/')
              }, 500)
            }
          }
        } else {
          // No catalog data, check profiles
          setProgress(50)

          await new Promise((resolve) => setTimeout(resolve, 500))

          const allProfiles = await getAllProfiles()
          
          if (allProfiles.length === 0) {
            setProgress(100)
            setTimeout(() => {
              router.replace('/setup')
            }, 500)
          } else {
            setProgress(100)
            setTimeout(() => {
              router.replace('/')
            }, 500)
          }
        }
      } catch {
        persistSetupCatalogSummary(null)
        // On error, redirect to dashboard anyway
        setTimeout(() => {
          router.replace('/')
        }, 1000)
      }
    }

    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router, api])

  // Show loading state while checking auth
  if (authLoading) {
    return null
  }

  // If not authenticated, don't render (will redirect)
  if (!user) {
    return null
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
          <CircularProgress size={64} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Initializing...
          </Typography>
          <Box sx={{ mt: 3, width: '100%' }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {progress}%
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}

