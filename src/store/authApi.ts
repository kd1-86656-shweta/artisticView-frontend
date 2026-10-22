import { baseApi } from './baseApi';
import type { AuthResponse, LoginRequest, Session, SignupRequest } from '@/types/api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    signUp: build.mutation<AuthResponse, SignupRequest>({
      query: (body) => ({ url: 'auth/sign-up', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
    }),
    logout: build.mutation<null, void>({
      query: () => ({ url: 'auth/logout', method: 'POST' }),
    }),
    me: build.query<Session, void>({
      query: () => 'auth/me',
      providesTags: ['Session'],
    }),
    checkUsername: build.query<{ username: string; available: boolean }, string>({
      query: (username) => ({ url: 'auth/check-availability', params: { username } }),
    }),
    verifyEmail: build.mutation<null, string>({
      query: (token) => ({ url: 'auth/verify-email', method: 'POST', body: { token } }),
    }),
    resendVerification: build.mutation<null, void>({
      query: () => ({ url: 'auth/resend-verification', method: 'POST' }),
    }),
    forgotPassword: build.mutation<null, string>({
      query: (email) => ({ url: 'auth/forgot-password', method: 'POST', body: { email } }),
    }),
    resetPassword: build.mutation<null, { token: string; newPassword: string }>({
      query: (body) => ({ url: 'auth/reset-password', method: 'POST', body }),
    }),
  }),
});

export const {
  useSignUpMutation,
  useLoginMutation,
  useLogoutMutation,
  useLazyCheckUsernameQuery,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
