'use client'

import { useMemo } from 'react'
import { useLoading } from '@/contexts/LoadingContext'
import {
  apiCall as apiCallRequest,
  getTransactions as apiGetTransactions,
  getTransaction as apiGetTransaction,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  getStatistics as apiGetStatistics,
  getCurrentUser as apiGetCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  deleteAccount as apiDeleteAccount,
  changePassword as apiChangePassword,
  signupRequest as apiSignupRequest,
  verifyEmail as apiVerifyEmail,
  setPassword as apiSetPassword,
  forgotPasswordRequest as apiForgotPasswordRequest,
  verifyResetPasswordToken as apiVerifyResetPasswordToken,
  resetPassword as apiResetPassword,
  getSetupCatalog as apiGetSetupCatalog,
  bulkUpdateTransactionsProfile as apiBulkUpdateTransactionsProfile,
  bulkUpdateTransactionsTag as apiBulkUpdateTransactionsTag,
} from './api'
import type { TransactionType } from '@/types'
import type {
  ApiResponse,
  TransactionsListData,
  TransactionData,
  StatisticsData,
  UserData,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  StatisticsQueryParams,
  PreviewResponse,
} from '@/types'

/**
 * Hook wrapper for API calls with automatic loading state management
 */
export function useApi() {
  const { startLoading, stopLoading } = useLoading()

  return useMemo(() => {
    const callWithLoading = async <T>(
      apiFunction: () => Promise<ApiResponse<T>>
    ): Promise<ApiResponse<T>> => {
      try {
        startLoading()
        return await apiFunction()
      } finally {
        stopLoading()
      }
    }

    return {
      // Generic API call
      apiCall: async <T>(endpoint: string, options?: RequestInit) => {
        return callWithLoading(() => apiCallRequest<T>(endpoint, options))
      },

      getSetupCatalog: async () => {
        return callWithLoading(() => apiGetSetupCatalog())
      },

      // Transaction API calls
      getTransactions: async (params?: TransactionQueryParams) => {
        return callWithLoading(() => apiGetTransactions(params))
      },

      getTransaction: async (id: string) => {
        return callWithLoading(() => apiGetTransaction(id))
      },

      createTransaction: async (data: CreateTransactionRequest) => {
        return callWithLoading(() => apiCreateTransaction(data))
      },

      updateTransaction: async (id: string, data: UpdateTransactionRequest) => {
        return callWithLoading(() => apiUpdateTransaction(id, data))
      },

      deleteTransaction: async (id: string) => {
        return callWithLoading(() => apiDeleteTransaction(id))
      },

      // Statistics API calls
      getStatistics: async (params: StatisticsQueryParams) => {
        return callWithLoading(() => apiGetStatistics(params))
      },

      // Auth API calls
      getCurrentUser: async () => {
        return callWithLoading(() => apiGetCurrentUser())
      },

      login: async (email: string, password: string) => {
        return callWithLoading(() => apiLogin(email, password))
      },

      logout: async () => {
        return callWithLoading(() => apiLogout())
      },

      deleteAccount: async () => {
        return callWithLoading(() => apiDeleteAccount())
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        return callWithLoading(() =>
          apiChangePassword(currentPassword, newPassword)
        )
      },

      signupRequest: async (email: string) => {
        return callWithLoading(() => apiSignupRequest(email))
      },

      verifyEmail: async (token: string) => {
        return callWithLoading(() => apiVerifyEmail(token))
      },

      setPassword: async (token: string, password: string) => {
        return callWithLoading(() => apiSetPassword(token, password))
      },

      forgotPasswordRequest: async (email: string) => {
        return callWithLoading(() => apiForgotPasswordRequest(email))
      },

      verifyResetPasswordToken: async (token: string) => {
        return callWithLoading(() => apiVerifyResetPasswordToken(token))
      },

      resetPassword: async (token: string, password: string) => {
        return callWithLoading(() => apiResetPassword(token, password))
      },

      // Profile API calls
      bulkUpdateTransactionsProfile: async (oldName: string, newName: string) => {
        return callWithLoading(() => apiBulkUpdateTransactionsProfile(oldName, newName))
      },

      // Tag API calls
      bulkUpdateTransactionsTag: async (
        profile: string,
        oldTagName: string,
        options?: {
          newTagName?: string
          newTransactionType?: TransactionType
        }
      ) => {
        return callWithLoading(() => apiBulkUpdateTransactionsTag(profile, oldTagName, options))
      },

    }
  }, [startLoading, stopLoading])
}

