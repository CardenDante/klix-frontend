'use client';

import { create } from 'zustand';
import { api } from '@/lib/api-client';
import { 
  signInWithEmail, 
  registerWithEmail, 
  signInWithGoogle, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordReset 
} from '@/lib/firebase';
import { User } from '@/lib/Types';

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

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  /**
   * Login with Email & Password
   * 1. Sign in with Firebase to get ID token
   * 2. Send ID token to backend to get JWT tokens
   * 3. Store JWT tokens and fetch user data
   */
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });

      // Step 1: Sign in with Firebase
      const idToken = await signInWithEmail(email, password);

      // Step 2: Exchange Firebase token for backend JWT
      const response = await api.auth.firebaseLogin(idToken);
      const { access_token, refresh_token } = response.data;

      // Step 3: Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Step 4: Fetch user data
      const userResponse = await api.auth.me();
      set({ 
        user: userResponse.data, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  /**
   * Register new user
   * 1. Create user in Firebase
   * 2. Send registration data + Firebase ID token to backend
   * 3. Backend creates user in database and returns JWT tokens
   */
  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true });

      // Step 1: Create user in Firebase
      const idToken = await registerWithEmail(data.email, data.password);

      // Step 2: Send to backend (backend will verify Firebase token and create DB user)
      const response = await api.auth.firebaseLogin(idToken);
      const { access_token, refresh_token } = response.data;

      // Step 3: Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Step 4: Update profile with additional info if provided
      if (data.first_name || data.last_name || data.phone_number) {
        await api.users.updateProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
        });
      }

      // Step 5: Fetch complete user data
      const userResponse = await api.auth.me();
      set({ 
        user: userResponse.data, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  /**
   * Login with Google OAuth
   * 1. Sign in with Google via Firebase popup
   * 2. Get ID token from Firebase
   * 3. Send to backend for JWT tokens
   */
  loginWithGoogle: async () => {
    try {
      set({ isLoading: true });

      // Step 1: Google OAuth via Firebase
      const idToken = await signInWithGoogle();

      // Step 2: Exchange for backend JWT
      const response = await api.auth.firebaseLogin(idToken);
      const { access_token, refresh_token } = response.data;

      // Step 3: Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Step 4: Fetch user data
      const userResponse = await api.auth.me();
      set({ 
        user: userResponse.data, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
  },

  /**
   * Logout user
   * 1. Call backend logout endpoint
   * 2. Sign out from Firebase
   * 3. Clear local tokens and state
   */
  logout: async () => {
    try {
      // Backend logout
      await api.auth.logout();
    } catch (error) {
      console.error('Backend logout error:', error);
    } finally {
      // Firebase logout
      await firebaseSignOut();
      
      // Clear everything
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ 
        user: null, 
        isAuthenticated: false 
      });
    }
  },

  /**
   * Fetch current user data
   * Called on app initialization if tokens exist
   */
  fetchUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isAuthenticated: false, user: null });
        return;
      }

      set({ isLoading: true });
      const response = await api.auth.me();
      set({ 
        user: response.data, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },

  /**
   * Send password reset email via Firebase
   */
  resetPassword: async (email: string) => {
    try {
      await firebaseSendPasswordReset(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },
}));

// Add missing users API methods
const usersApi = {
  updateProfile: (data: any) => api.users?.me?.patch?.(data) || Promise.resolve(),
};

if (!api.users) {
  (api as any).users = usersApi;
}