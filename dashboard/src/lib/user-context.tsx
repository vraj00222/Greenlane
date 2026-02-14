'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createOrGetUser, type User } from './api';
import { useUser } from './hooks';

// ============================================
// Types
// ============================================

interface UserContextType {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

// ============================================
// Context
// ============================================

const UserContext = createContext<UserContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

const USER_ID_KEY = 'greenlane_user_id';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user ID from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setIsInitialized(true);
  }, []);

  // Fetch user data
  const { data: user, error, isLoading, mutate } = useUser(userId);

  // Login function
  const login = useCallback(async (email: string, displayName: string) => {
    try {
      const { data } = await createOrGetUser({ email, displayName });
      localStorage.setItem(USER_ID_KEY, data.id);
      setUserId(data.id);
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    setUserId(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(() => {
    mutate();
  }, [mutate]);

  // Don't render until we've checked localStorage
  if (!isInitialized) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user: user ?? null,
        userId,
        isLoading,
        error: error ?? null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
}
