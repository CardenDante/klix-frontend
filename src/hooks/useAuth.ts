'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api-client';
import { 
  signInWithEmail, 
  registerWithEmail, 
  signInWithGoogle, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordReset 
} from '@/lib/firebase';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

// Initialize auth state from localStorage
const initializeAuthState = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    };
  }

  const token = localStorage.getItem('access_token');
  const cachedUser = localStorage.getItem('user');

  if (token && cachedUser) {
    try {
      const userData = JSON.parse(cachedUser);
      console.log('🔄 [AUTH] Restored session for:', userData.email);
      return {
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      };
    } catch (error) {
      console.error('❌ [AUTH] Failed to parse cached user data');
      localStorage.removeItem('user');
    }
  }

  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
};

export const useAuth = create<AuthState>((set) => ({
  ...initializeAuthState(),

  /**
   * Login with Email & Password
   */
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      console.log('🔐 [AUTH] Starting login for:', email);

      // Step 1: Sign in with Firebase
      console.log('📱 [FIREBASE] Authenticating with Firebase...');
      const idToken = await signInWithEmail(email, password);
      console.log('✅ [FIREBASE] Got ID token:', idToken.substring(0, 20) + '...');

      // Step 2: Exchange Firebase token for backend JWT
      console.log('🔄 [BACKEND] Exchanging Firebase token for JWT...');
      const response = await apiClient.post('/api/v1/auth/firebase-login', { 
        id_token: idToken 
      });
      
      const { access_token, refresh_token } = response.data;
      console.log('✅ [BACKEND] Got JWT tokens');

      // Step 3: Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Step 4: Fetch user data
      console.log('👤 [USER] Fetching user profile...');
      const userResponse = await apiClient.get('/api/v1/auth/me');
      console.log('✅ [USER] Logged in as:', userResponse.data.email);

      // Cache user data
      localStorage.setItem('user', JSON.stringify(userResponse.data));

      set({
        user: userResponse.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      console.error('❌ [AUTH ERROR]', error);
      
      // Extract meaningful error message
      let errorMessage = 'Login failed';
      
      if (error.code) {
        // Firebase error
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          default:
            errorMessage = error.message || 'Firebase authentication failed';
        }
      } else if (error.response) {
        // Backend API error
        errorMessage = error.response.data?.detail || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
        console.error('Backend error details:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true });
      console.log('📝 [REGISTER] Creating account for:', data.email);

      // Step 1: Create user in Firebase
      console.log('📱 [FIREBASE] Creating Firebase user...');
      const idToken = await registerWithEmail(data.email, data.password);
      console.log('✅ [FIREBASE] User created, got ID token');

      // Step 2: Exchange for backend JWT (backend creates DB user)
      console.log('🔄 [BACKEND] Creating backend user...');
      const response = await apiClient.post('/api/v1/auth/firebase-login', { 
        id_token: idToken 
      });
      
      const { access_token, refresh_token } = response.data;
      console.log('✅ [BACKEND] User created in database');

      // Step 3: Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Step 4: Update profile with additional info
      if (data.first_name || data.last_name || data.phone_number) {
        console.log('📝 [PROFILE] Updating profile...');
        await apiClient.patch('/api/v1/users/me', {
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
        });
      }

      // Step 5: Fetch complete user data
      const userResponse = await apiClient.get('/api/v1/auth/me');
      console.log('✅ [REGISTER] Complete! Welcome:', userResponse.data.email);

      // Cache user data
      localStorage.setItem('user', JSON.stringify(userResponse.data));

      set({
        user: userResponse.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      console.error('❌ [REGISTER ERROR]', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.code) {
        // Firebase error
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Use at least 6 characters';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled';
            break;
          default:
            errorMessage = error.message || 'Firebase registration failed';
        }
      } else if (error.response) {
        errorMessage = error.response.data?.detail || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
        console.error('Backend error details:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * Login with Google OAuth
   */
  loginWithGoogle: async () => {
    try {
      set({ isLoading: true });
      console.log('🔐 [GOOGLE] Starting Google OAuth...');

      // Step 1: Google OAuth via Firebase
      const idToken = await signInWithGoogle();
      console.log('✅ [GOOGLE] Got Firebase ID token');

      // Step 2: Exchange for backend JWT
      console.log('🔄 [BACKEND] Exchanging token...');
      const response = await apiClient.post('/api/v1/auth/firebase-login', { 
        id_token: idToken 
      });
      
      const { access_token, refresh_token } = response.data;
      console.log('✅ [BACKEND] Got JWT tokens');

      // Step 3: Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Step 4: Fetch user data
      const userResponse = await apiClient.get('/api/v1/auth/me');
      console.log('✅ [GOOGLE] Logged in as:', userResponse.data.email);

      // Cache user data
      localStorage.setItem('user', JSON.stringify(userResponse.data));

      set({
        user: userResponse.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      console.error('❌ [GOOGLE ERROR]', error);
      
      let errorMessage = 'Google login failed';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Login cancelled. Please try again';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup blocked. Please allow popups and try again';
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = 'Login cancelled';
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'Account exists with different sign-in method';
            break;
          default:
            errorMessage = error.message || 'Google authentication failed';
        }
      } else if (error.response) {
        errorMessage = error.response.data?.detail || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
        console.error('Backend error details:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({ isLoading: false });
      throw new Error(errorMessage);
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      console.log('👋 [LOGOUT] Logging out...');
      
      // Backend logout
      try {
        await apiClient.post('/api/v1/auth/logout');
      } catch (error) {
        console.error('Backend logout error:', error);
      }
      
      // Firebase logout
      await firebaseSignOut();
      
      // Clear everything
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');

      set({
        user: null,
        isAuthenticated: false
      });
      
      console.log('✅ [LOGOUT] Logged out successfully');
    } catch (error) {
      console.error('❌ [LOGOUT ERROR]', error);
      // Still clear state even if logout fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      set({
        user: null,
        isAuthenticated: false
      });
    }
  },

  /**
   * Fetch current user data
   */
  fetchUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('⚠️ [AUTH] No access token found');
        set({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }

      console.log('🔍 [AUTH] Fetching user profile...');
      set({ isLoading: true });
      const response = await apiClient.get('/api/v1/auth/me');

      console.log('✅ [AUTH] User fetched successfully:', response.data.email);
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });

      // Persist user to localStorage to survive page reloads
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error: any) {
      console.error('❌ [AUTH] Failed to fetch user:', error);

      // Check if it's a 401 (unauthorized) - token is invalid/expired
      if (error.response?.status === 401) {
        console.log('🔒 [AUTH] Token expired or invalid, clearing auth state');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      } else {
        // Network error or other issue - try to use cached user data
        console.log('⚠️ [AUTH] Network error, attempting to use cached user data');
        const cachedUser = localStorage.getItem('user');

        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            console.log('✅ [AUTH] Using cached user data:', userData.email);
            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false
            });
          } catch (parseError) {
            console.error('❌ [AUTH] Failed to parse cached user');
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } else {
          // No cached data and network failed - clear auth
          console.log('❌ [AUTH] No cached user data available');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      }
    }
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string) => {
    try {
      await firebaseSendPasswordReset(email);
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },
}));