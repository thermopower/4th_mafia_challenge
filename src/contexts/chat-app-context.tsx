'use client';

import React, { createContext, useContext, useReducer, useMemo } from 'react';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  mfaRequired: boolean;
};

export type AuthProfile = {
  id: string;
  nickname: string;
  profileImageUrl: string;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'withdrawn';
};

export type AuthError = {
  code: string;
  message: string;
};

export type AuthState = {
  session: AuthSession | null;
  profile: AuthProfile | null;
  error: AuthError | null;
};

export type ChatAppState = {
  auth: AuthState;
};

export type ChatAppAction =
  | {
      type: 'AUTH/SIGNIN_SUCCESS';
      payload: {
        session: AuthSession;
        profile: AuthProfile;
      };
    }
  | {
      type: 'AUTH/ERROR';
      payload: AuthError;
    }
  | {
      type: 'AUTH/SIGNOUT';
    };

type ChatAppContextValue = {
  state: ChatAppState;
  actions: {
    signInSuccess: (payload: {
      session: AuthSession;
      profile: AuthProfile;
    }) => void;
    authError: (error: AuthError) => void;
    signOut: () => void;
  };
};

const ChatAppContext = createContext<ChatAppContextValue | null>(null);

const initialState: ChatAppState = {
  auth: {
    session: null,
    profile: null,
    error: null,
  },
};

const chatAppReducer: React.Reducer<ChatAppState, ChatAppAction> = (
  state,
  action,
) => {
  switch (action.type) {
    case 'AUTH/SIGNIN_SUCCESS': {
      return {
        ...state,
        auth: {
          session: action.payload.session,
          profile: action.payload.profile,
          error: null,
        },
      };
    }

    case 'AUTH/ERROR': {
      return {
        ...state,
        auth: {
          ...state.auth,
          error: action.payload,
        },
      };
    }

    case 'AUTH/SIGNOUT': {
      return {
        ...state,
        auth: {
          session: null,
          profile: null,
          error: null,
        },
      };
    }

    default:
      return state;
  }
};

export const ChatAppProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(chatAppReducer, initialState);

  const actions = useMemo(
    () => ({
      signInSuccess: (payload: {
        session: AuthSession;
        profile: AuthProfile;
      }) => {
        dispatch({ type: 'AUTH/SIGNIN_SUCCESS', payload });
      },
      authError: (error: AuthError) => {
        dispatch({ type: 'AUTH/ERROR', payload: error });
      },
      signOut: () => {
        dispatch({ type: 'AUTH/SIGNOUT' });
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions],
  );

  return (
    <ChatAppContext.Provider value={value}>{children}</ChatAppContext.Provider>
  );
};

export const useChatApp = () => {
  const context = useContext(ChatAppContext);
  if (!context) {
    throw new Error('useChatApp must be used within ChatAppProvider');
  }
  return context;
};
