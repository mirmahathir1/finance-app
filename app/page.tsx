'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  List as ListIcon,
  Label as LabelIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  Backup as BackupIcon,
} from '@mui/icons-material'
import { PageLayout } from '@/components/PageLayout'
import { ProfileSelector } from '@/components/ProfileSelector'
import { useProfile } from '@/contexts/ProfileContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useAuth } from '@/contexts/AuthContext'
import { useApi } from '@/utils/useApi'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { StatisticsData } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const { activeProfile, profiles, isLoading: profilesLoading } = useProfile()
  const { user, isGuestMode, isLoading: authLoading } = useAuth()
  const { defaultCurrency, isLoading: currenciesLoading } = useCurrency()
  const api = useApi()
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // EARLY RETURN: If not authenticated (no real user), don't render anything (StartupRedirect will handle redirect)
  if (!authLoading && !user) {
    return null
  }
  
  // Allow guest mode to render (API is intercepted)

  // Load statistics for current month
  useEffect(() => {
    const loadStatistics = async () => {
      if (!activeProfile) return
      const currencyCode = defaultCurrency?.code || 'USD'

      setIsLoadingStats(true)
      try {
        const now = new Date()
        const from = format(startOfMonth(now), 'yyyy-MM-dd')
        const to = format(endOfMonth(now), 'yyyy-MM-dd')

        const response = await api.getStatistics({
          profile: activeProfile,
          from,
          to,
          currency: currencyCode, // Use selected default currency
        })

        if (response.success && response.data) {
          setStatistics(response.data)
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadStatistics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, defaultCurrency?.code])

  const formatAmount = (amountMinor: number, currency: string = 'USD'): string => {
    const amount = amountMinor / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const actionButtons = [
    {
      title: 'Create Transaction',
      icon: <AddIcon />,
      color: 'primary' as const,
      onClick: () => router.push('/transactions/create'),
    },
    {
      title: 'View Transactions',
      icon: <ListIcon />,
      color: 'primary' as const,
      onClick: () => router.push('/transactions'),
    },
    {
      title: 'Edit Tags',
      icon: <LabelIcon />,
      color: 'secondary' as const,
      onClick: () => router.push('/tags'),
    },
    {
      title: 'Manage Currencies',
      icon: <CurrencyExchangeIcon />,
      color: 'secondary' as const,
      onClick: () => router.push('/currencies'),
    },
    {
      title: 'Statistics',
      icon: <BarChartIcon />,
      color: 'info' as const,
      onClick: () => router.push('/statistics'),
    },
    {
      title: 'Manage Profiles',
      icon: <PeopleIcon />,
      color: 'info' as const,
      onClick: () => router.push('/profiles'),
    },
    {
      title: 'Backup & Restore',
      icon: <BackupIcon />,
      color: 'warning' as const,
      onClick: () => router.push('/backup'),
    },
  ]

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
    <PageLayout>
      <Box>
        {/* Profile Selector */}
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

        {/* Quick Summary */}
        {activeProfile && statistics && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Quick Summary - {format(new Date(), 'MMMM yyyy')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
              <Card sx={{ flex: 1, backgroundColor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Income
                  </Typography>
                  <Typography variant="h5">
                    {formatAmount(statistics.summary.totalIncome.amountMinor, statistics.period.currency)}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, backgroundColor: 'error.light', color: 'error.contrastText' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Expense
                  </Typography>
                  <Typography variant="h5">
                    {formatAmount(statistics.summary.totalExpense.amountMinor, statistics.period.currency)}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, backgroundColor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
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
        )}

        {/* Loading state for statistics */}
        {activeProfile && isLoadingStats && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Loading statistics...
            </Typography>
          </Paper>
        )}

        {/* No active profile message */}
        {!activeProfile && !profilesLoading && (
          <Alert severity="info" sx={{ mb: 4 }}>
            Please select or create a profile to get started.
          </Alert>
        )}

        {/* Action Buttons */}
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
            {actionButtons.map((button) => (
              <Button
                key={button.title}
                fullWidth
                variant="contained"
                color={button.color}
                startIcon={button.icon}
                onClick={button.onClick}
                sx={{
                  py: 2,
                  height: '100%',
                  minHeight: 80,
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Typography variant="body1" fontWeight="bold">
                  {button.title}
                </Typography>
              </Button>
            ))}
          </Box>
        </Paper>
      </Box>
    </PageLayout>
  )
}
