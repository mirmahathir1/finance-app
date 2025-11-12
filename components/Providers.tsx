'use client'

import { LoadingProvider } from '@/contexts/LoadingContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { TagProvider } from '@/contexts/TagContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { AppProvider } from '@/contexts/AppContext'
import { GlobalProgressBar } from './GlobalProgressBar'
import { GuestModeIndicator } from './GuestModeIndicator'
import { StartupRedirect } from './StartupRedirect'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <AuthProvider>
        <ProfileProvider>
          <TagProvider>
            <CurrencyProvider>
              <AppProvider>
                <GlobalProgressBar />
                <GuestModeIndicator />
                <StartupRedirect>
                  {children}
                </StartupRedirect>
              </AppProvider>
            </CurrencyProvider>
          </TagProvider>
        </ProfileProvider>
      </AuthProvider>
    </LoadingProvider>
  )
}

