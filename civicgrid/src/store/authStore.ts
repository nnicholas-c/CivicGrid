// Auth Store using Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';
import apiService from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string, role: UserRole) => {
        set({ isLoading: true });
        try {
          const response = await apiService.login({ email, password, role });

          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('authToken', response.token);

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error('Invalid credentials');
        }
      },

      signup: async (name: string, email: string, password: string, role: UserRole) => {
        set({ isLoading: true });
        try {
          // For demo/hackathon: auto-create user
          const mockUser: User = {
            id: 'user-' + Date.now(),
            name,
            email,
            role,
          };
          const mockToken = 'token-' + Date.now();

          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(mockUser));
          localStorage.setItem('authToken', mockToken);

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw new Error('Signup failed');
        }
      },

      logout: () => {
        apiService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
