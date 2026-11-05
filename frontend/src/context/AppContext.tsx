import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, UserProfile, PayPalConfig } from "../api";
import { useToast } from "./ToastContext";

interface AppContextValue {
  user: UserProfile | null;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  config: PayPalConfig | null;
  refreshConfig: () => Promise<void>;
  refreshKey: number;
  triggerRefresh: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  isRecipientModalOpen: boolean;
  openRecipientModal: () => void;
  closeRecipientModal: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<PayPalConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const { showToast } = useToast();

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getUserProfile();
      setUser(data);
    } catch (e) {
      console.error("Failed to fetch user profile", e);
    }
  }, []);

  const updateUser = useCallback(
    async (data: Partial<UserProfile>) => {
      try {
        const updated = await api.updateUserProfile(data);
        setUser(updated);
        showToast("Business profile updated successfully", "success");
        triggerRefresh();
      } catch (e: any) {
        showToast(e.message || "Failed to update profile", "error");
        throw e;
      }
    },
    [showToast, triggerRefresh]
  );

  const refreshConfig = useCallback(async () => {
    try {
      const data = await api.getPayPalConfig();
      setConfig(data);
    } catch (e) {
      console.error("Failed to load PayPal config", e);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    refreshConfig();
  }, [refreshUser, refreshConfig, refreshKey]);

  return (
    <AppContext.Provider
      value={{
        user,
        refreshUser,
        updateUser,
        config,
        refreshConfig,
        refreshKey,
        triggerRefresh,
        isSettingsOpen,
        openSettings: () => setIsSettingsOpen(true),
        closeSettings: () => setIsSettingsOpen(false),
        isRecipientModalOpen,
        openRecipientModal: () => setIsRecipientModalOpen(true),
        closeRecipientModal: () => setIsRecipientModalOpen(false),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

