import axios, { isAxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: localStorage에서 토큰을 읽어 Authorization 헤더에 추가
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
