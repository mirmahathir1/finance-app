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

  // Consistent blue gradient for all action buttons
  const buttonGradient = 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)'

  // Allow guest mode to render (API is intercepted)

  const loadStatistics = useCallback(async () => {
    if (!activeProfile) {
      setStatistics(null)
      setStatsError(null)
      setIsLoadingStats(false)
      return
    }

    const currencyCode = defaultCurrency?.code
    if (!currencyCode) {
      // Show loading state while waiting for currency to load
      if (!currenciesLoading) {
        // Currency is loaded but not set, stop loading
        setIsLoadingStats(false)
      } else {
        // Currency is still loading, show loading state
        setIsLoadingStats(true)
      }
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
  }, [activeProfile, defaultCurrency?.code, currenciesLoading, api])

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
        onClick: navigateTo('/transactions/create'),
      },
      {
        title: 'View Transactions',
        icon: <ListIcon />,
        onClick: navigateTo('/transactions'),
      },
      {
        title: 'Edit Tags',
        icon: <LabelIcon />,
        onClick: navigateTo('/tags'),
      },
      {
        title: 'Manage Currencies',
        icon: <CurrencyExchangeIcon />,
        onClick: navigateTo('/currencies'),
      },
      {
        title: 'Statistics',
        icon: <BarChartIcon />,
        onClick: navigateTo('/statistics'),
      },
      {
        title: 'Manage Profiles',
        icon: <PeopleIcon />,
        onClick: navigateTo('/profiles'),
      },
      {
        title: 'Backup & Restore',
        icon: <BackupIcon />,
        onClick: navigateTo('/backup-restore'),
      },
      {
        title: 'Settings',
        icon: <SettingsIcon />,
        onClick: navigateTo('/settings'),
      },
    ],
    [navigateTo]
  )

  // Show loading state while checking auth
  // StartupRedirect handles all authentication redirects
  if (authLoading) {
    return null
  }
  
  // Wait for profiles to load if authenticated
  if (profilesLoading) {
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
                variant="contained"
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
                  background: 'linear-gradient(135deg, #0d4f1a 0%, #1b5e20 50%, #2e7d32 100%)',
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
                  background: 'linear-gradient(135deg, #8b0000 0%, #b71c1c 50%, #c62828 100%)',
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
                  background: 'linear-gradient(135deg, #0a3d91 0%, #0d47a1 50%, #1565c0 100%)',
                  color: 'white',
                  boxShadow: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}>
                  <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'white' }}>
                      Balance
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white' }}>
                      {formatAmount(statistics.summary.netBalance.amountMinor, statistics.period.currency)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Paper>
          </AnimatedSection>
        )}

        {/* Show message when no statistics and not loading */}
        {activeProfile && !statistics && !statsError && !isLoadingStats && defaultCurrency && (
          <AnimatedSection delay={75}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Alert severity="info">
                No transactions found for this month. Create your first transaction to see your financial summary.
              </Alert>
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
              {actionButtons.map((button, index) => (
                <Button
                  key={button.title}
                  fullWidth
                  variant="contained"
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
                    background: buttonGradient,
                    color: 'white',
                    boxShadow: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      background: buttonGradient,
                    },
                  }}
                >
                  <Typography variant="body1" fontWeight="bold" sx={{ color: 'white' }}>
                    {button.title}
                  </Typography>
                </Button>
              ))}
            </Box>
          </Paper>
        </AnimatedSection>

      </Box>
    </PageLayout>
  )
}
