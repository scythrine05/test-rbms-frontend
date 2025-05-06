import axios from 'axios';
import { getSession, signIn } from 'next-auth/react';
import { authService } from '@/app/service/api/auth';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Axios instance WITH token (for authenticated APIs)
const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios instance WITHOUT token (for public APIs like login, register, etc.)
export const axiosPublicInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh handling
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor (only for private instance)
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (only for private instance)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const session = await getSession();
        const refreshToken = session?.user?.refreshToken;

        if (!refreshToken) throw new Error('No refresh token available');

        const response = await authService.refreshToken(refreshToken);

        await signIn('credentials', {
          redirect: false,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          user: JSON.stringify(session?.user),
        });

        processQueue(null, response.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
