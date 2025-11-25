'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Alert,
  Skeleton,
} from '@mui/material'
import {
  Add as AddIcon,
  List as ListIcon,
  Label as LabelIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  Backup as BackupIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { ProfileSelector } from '@/components/ProfileSelector'
import { useProfile } from '@/contexts/ProfileContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/utils/useApi'
import { ErrorState } from '@/components/ErrorState'
import { getFriendlyErrorMessage } from '@/utils/error'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { StatisticsData } from '@/types'
import { AnimatedSection } from '@/components/AnimatedSection'

export default function DashboardPage() {
  const router = useRouter()
  const { activeProfile, profiles, isLoading: profilesLoading } = useProfile()
  const { user, isGuestMode, isLoading: authLoading } = useAuth()
  const { defaultCurrency, isLoading: currenciesLoading } = useCurrency()
  const api = useApi()
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Allow guest mode to render (API is intercepted)

  const loadStatistics = useCallback(async () => {
    if (!activeProfile) {
      setStatistics(null)
      setStatsError(null)
      return
    }

    const currencyCode = defaultCurrency?.code
    if (!currencyCode) {
      return
    }
    setIsLoadingStats(true)
    setStatsError(null)

    try {
      const now = new Date()
      const from = format(startOfMonth(now), 'yyyy-MM-dd')
      const to = format(endOfMonth(now), 'yyyy-MM-dd')

      const response = await api.getStatistics({
        profile: activeProfile,
        from,
        to,
        currency: currencyCode,
      })

      if (response.success && response.data) {
        setStatistics(response.data)
        setStatsError(null)
      } else {
        setStatistics(null)
        setStatsError(
          !response.success ? response.error.message : 'Failed to load statistics.'
        )
      }
    } catch (error) {
      setStatistics(null)
      setStatsError(getFriendlyErrorMessage(error, 'Failed to load statistics.'))
    } finally {
      setIsLoadingStats(false)
    }
  }, [activeProfile, defaultCurrency?.code, api])

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  const handleRetryStatistics = () => {
    loadStatistics()
  }

  const formatAmount = (amountMinor: number, currency: string): string => {
    const amount = amountMinor / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const navigateTo = useCallback(
    (path: string) => () => router.push(path),
    [router]
  )

  const actionButtons = useMemo(
    () => [
      {
        title: 'Create Transaction',
        icon: <AddIcon />,
        color: 'primary' as const,
        onClick: navigateTo('/transactions/create'),
      },
      {
        title: 'View Transactions',
        icon: <ListIcon />,
        color: 'primary' as const,
        onClick: navigateTo('/transactions'),
      },
      {
        title: 'Edit Tags',
        icon: <LabelIcon />,
        color: 'secondary' as const,
        onClick: navigateTo('/tags'),
      },
      {
        title: 'Manage Currencies',
        icon: <CurrencyExchangeIcon />,
        color: 'secondary' as const,
        onClick: navigateTo('/currencies'),
      },
      {
        title: 'Statistics',
        icon: <BarChartIcon />,
        color: 'info' as const,
        onClick: navigateTo('/statistics'),
      },
      {
        title: 'Manage Profiles',
        icon: <PeopleIcon />,
        color: 'info' as const,
        onClick: navigateTo('/profiles'),
      },
      {
        title: 'Backup & Restore',
        icon: <BackupIcon />,
        color: 'warning' as const,
        onClick: navigateTo('/backup-restore'),
      },
      {
        title: 'Settings',
        icon: <SettingsIcon />,
        color: 'info' as const,
        onClick: navigateTo('/settings'),
      },
    ],
    [navigateTo]
  )

  // Check authentication first - redirect to sign-in if not authenticated
  useEffect(() => {
    // Wait for auth to load first
    if (authLoading) return
    
    // Allow guest mode to proceed (API is intercepted)
    
    // If not authenticated (no real user), redirect to sign-in immediately
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    
    // Only check profiles if we have a real authenticated user
    // Wait for profiles to load
    if (profilesLoading) return
    
    // If authenticated but no profiles exist, redirect to setup
    if (user && profiles.length === 0) {
      router.replace('/setup')
      return
    }
  }, [user, isGuestMode, authLoading, profilesLoading, profiles.length, router])
  
  // Show loading state while checking auth
  if (authLoading) {
    return null
  }
  
  // If not authenticated (no real user), don't render (will redirect)
  if (!user) {
    return null
  }
  
  // Allow guest mode to render
  
  // Wait for profiles to load if authenticated
  if (profilesLoading) {
    return null
  }
  
  // If no profiles exist, don't render (will redirect to setup)
  if (user && profiles.length === 0) {
    return null
  }

  return (
    <PageLayout pageName="Home Page">
      <Box>
        {/* Profile Selector */}
        <AnimatedSection>
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="h6" gutterBottom>
                  Active Profile
                </Typography>
                <ProfileSelector
                  autoSwitch={true}
                  fullWidth={false}
                />
              </Box>
              {activeProfile && (
                <Typography variant="body2" color="text.secondary">
                  All transactions and tags are associated with this profile
                </Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => router.push('/profiles')}
              >
                Manage Profiles
              </Button>
            </Box>
          </Paper>
        </AnimatedSection>

        {/* Quick Summary */}
        {statsError && (
          <ErrorState
            title="Unable to load statistics"
            message={statsError}
            onRetry={handleRetryStatistics}
          />
        )}

        {isLoadingStats && !statsError && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Skeleton variant="text" width="35%" height={32} />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, mt: 2 }}>
              {[0, 1, 2].map((item) => (
                <Card key={item} sx={{ flex: 1 }}>
                  <CardContent>
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="text" height={36} />
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        )}

        {activeProfile && statistics && !statsError && !isLoadingStats && (
          <AnimatedSection delay={75}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                Quick Summary - {format(new Date(), 'MMMM yyyy')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, justifyContent: 'center' }}>
                <Card sx={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
                  color: 'success.contrastText',
                  boxShadow: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}>
                  <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Income
                    </Typography>
                    <Typography variant="h5">
                      {formatAmount(statistics.summary.totalIncome.amountMinor, statistics.period.currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #f44336 0%, #ef5350 50%, #e57373 100%)',
                  color: 'error.contrastText',
                  boxShadow: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}>
                  <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Expense
                    </Typography>
                    <Typography variant="h5">
                      {formatAmount(statistics.summary.totalExpense.amountMinor, statistics.period.currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 50%, #64b5f6 100%)',
                  color: 'info.contrastText',
                  boxShadow: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}>
                  <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Balance
                    </Typography>
                    <Typography variant="h5">
                      {formatAmount(statistics.summary.netBalance.amountMinor, statistics.period.currency)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Paper>
          </AnimatedSection>
        )}

        {/* Loading state for statistics */}
        {/* No active profile message */}
        {!activeProfile && !profilesLoading && (
          <Alert severity="info" sx={{ mb: 4 }}>
            Please select or create a profile to get started.
          </Alert>
        )}

        {/* Action Buttons */}
        <AnimatedSection delay={120}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 2,
              }}
            >
              {actionButtons.map((button, index) => {
                // Define gradients based on button color (very subtle gradients)
                const getGradient = (color: string) => {
                  switch (color) {
                    case 'primary':
                      return 'linear-gradient(135deg, #1976d2 0%, #1e88e5 50%, #2196f3 100%)'
                    case 'secondary':
                      return 'linear-gradient(135deg, #9c27b0 0%, #8e24aa 50%, #9c27b0 100%)'
                    case 'info':
                      return 'linear-gradient(135deg, #0288d1 0%, #039be5 50%, #03a9f4 100%)'
                    case 'warning':
                      return 'linear-gradient(135deg, #f57c00 0%, #f57c00 50%, #fb8c00 100%)'
                    default:
                      return 'linear-gradient(135deg, #1976d2 0%, #1e88e5 50%, #2196f3 100%)'
                  }
                }

                return (
                  <Button
                    key={button.title}
                    fullWidth
                    variant="contained"
                    color={button.color}
                    startIcon={button.icon}
                    onClick={button.onClick}
                    className="interactive-card"
                    sx={{
                      py: 2,
                      height: '100%',
                      minHeight: 80,
                      flexDirection: 'column',
                      gap: 1,
                      transitionDelay: `${index * 30}ms`,
                      background: getGradient(button.color),
                      boxShadow: 3,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        background: getGradient(button.color),
                      },
                    }}
                  >
                    <Typography variant="body1" fontWeight="bold">
                      {button.title}
                    </Typography>
                  </Button>
                )
              })}
            </Box>
          </Paper>
        </AnimatedSection>

      </Box>
    </PageLayout>
  )
}
