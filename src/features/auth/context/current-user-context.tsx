"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { match, P } from "ts-pattern";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type {
  CurrentUserContextValue,
  CurrentUserSnapshot,
} from "../types";

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

type CurrentUserProviderProps = {
  children: ReactNode;
  initialState: CurrentUserSnapshot;
};

export const CurrentUserProvider = ({
  children,
  initialState,
}: CurrentUserProviderProps) => {
  const queryClient = useQueryClient();
  const [snapshot, setSnapshot] = useState<CurrentUserSnapshot>(initialState);

  const refresh = useCallback(async () => {
    setSnapshot((prev) => ({ status: "loading", user: prev.user }));
    const supabase = getSupabaseBrowserClient();

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        const fallbackSnapshot: CurrentUserSnapshot = {
          status: "unauthenticated",
          user: null,
        };
        setSnapshot(fallbackSnapshot);
        queryClient.setQueryData(["currentUser"], fallbackSnapshot);
        return;
      }

      // Fetch profile from public.users
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        const fallbackSnapshot: CurrentUserSnapshot = {
          status: "unauthenticated",
          user: null,
        };
        setSnapshot(fallbackSnapshot);
        queryClient.setQueryData(["currentUser"], fallbackSnapshot);
        return;
      }

      const profile = profileData as {
        nickname: string;
        profile_image_url: string;
        account_status: 'active' | 'inactive' | 'suspended' | 'withdrawn';
      };

      const nextSnapshot: CurrentUserSnapshot = {
        status: "authenticated",
        user: {
          id: authData.user.id,
          email: authData.user.email ?? null,
          nickname: profile.nickname,
          profileImageUrl: profile.profile_image_url,
          accountStatus: profile.account_status,
          appMetadata: authData.user.app_metadata ?? {},
          userMetadata: authData.user.user_metadata ?? {},
        },
      };

      setSnapshot(nextSnapshot);
      queryClient.setQueryData(["currentUser"], nextSnapshot);
    } catch (error) {
      const fallbackSnapshot: CurrentUserSnapshot = {
        status: "unauthenticated",
        user: null,
      };
      setSnapshot(fallbackSnapshot);
      queryClient.setQueryData(["currentUser"], fallbackSnapshot);
    }
  }, [queryClient]);

  const value = useMemo<CurrentUserContextValue>(() => {
    return {
      ...snapshot,
      refresh,
      isAuthenticated: snapshot.status === "authenticated",
      isLoading: snapshot.status === "loading",
    };
  }, [refresh, snapshot]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUserContext = () => {
  const value = useContext(CurrentUserContext);

  if (!value) {
    throw new Error("CurrentUserProvider가 트리 상단에 필요합니다.");
  }

  return value;
};
