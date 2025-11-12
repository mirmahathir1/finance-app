'use client'

import { useLoading } from '@/contexts/LoadingContext'
import {
  apiCall,
  getTransactions as apiGetTransactions,
  getTransaction as apiGetTransaction,
  createTransaction as apiCreateTransaction,
  updateTransaction as apiUpdateTransaction,
  deleteTransaction as apiDeleteTransaction,
  getStatistics as apiGetStatistics,
  getCurrentUser as apiGetCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  signupRequest as apiSignupRequest,
  verifyEmail as apiVerifyEmail,
  setPassword as apiSetPassword,
  forgotPasswordRequest as apiForgotPasswordRequest,
  verifyResetPasswordToken as apiVerifyResetPasswordToken,
  resetPassword as apiResetPassword,
  previewProfileRename as apiPreviewProfileRename,
  renameProfile as apiRenameProfile,
  previewProfileDelete as apiPreviewProfileDelete,
  deleteProfile as apiDeleteProfile,
  importProfiles as apiImportProfiles,
  previewTagRename as apiPreviewTagRename,
  renameTag as apiRenameTag,
  previewTagDelete as apiPreviewTagDelete,
  deleteTag as apiDeleteTag,
} from './api'
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
      return callWithLoading(() => apiCall<T>(endpoint, options))
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

    signupRequest: async (email: string) => {
      return callWithLoading(() => apiSignupRequest(email))
    },

    verifyEmail: async (token: string) => {
      return callWithLoading(() => apiVerifyEmail(token))
    },

    setPassword: async (password: string) => {
      return callWithLoading(() => apiSetPassword(password))
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
    previewProfileRename: async (profile: string) => {
      return callWithLoading(() => apiPreviewProfileRename(profile))
    },

    renameProfile: async (oldName: string, newName: string) => {
      return callWithLoading(() => apiRenameProfile(oldName, newName))
    },

    previewProfileDelete: async (profile: string) => {
      return callWithLoading(() => apiPreviewProfileDelete(profile))
    },

    deleteProfile: async (profile: string) => {
      return callWithLoading(() => apiDeleteProfile(profile))
    },

    importProfiles: async () => {
      return callWithLoading(() => apiImportProfiles())
    },

    // Tag API calls
    previewTagRename: async (tag: string, profile: string) => {
      return callWithLoading(() => apiPreviewTagRename(tag, profile))
    },

    renameTag: async (oldName: string, newName: string, profile: string) => {
      return callWithLoading(() => apiRenameTag(oldName, newName, profile))
    },

    previewTagDelete: async (tag: string, profile: string) => {
      return callWithLoading(() => apiPreviewTagDelete(tag, profile))
    },

    deleteTag: async (tag: string, profile: string) => {
      return callWithLoading(() => apiDeleteTag(tag, profile))
    },
  }
}

