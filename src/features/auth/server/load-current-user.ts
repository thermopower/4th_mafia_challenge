import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { CurrentUserSnapshot } from "../types";

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { status: "unauthenticated", user: null };
  }

  // Fetch profile from public.users
  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profileData) {
    return { status: "unauthenticated", user: null };
  }

  const profile = profileData as {
    nickname: string;
    profile_image_url: string;
    account_status: 'active' | 'inactive' | 'suspended' | 'withdrawn';
  };

  return {
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
};
