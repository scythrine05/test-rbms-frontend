import axiosInstance, { axiosPublicInstance } from '@/app/utils/axiosInstance';
import { LoginInput } from '@/app/validation/auth';


export interface LoginResponse {
    status: boolean;
    message: string;
    data: {
        access_token: string;
        refresh_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            department: string;
            phone: string;
        };
    };
}

export interface RefreshTokenResponse {
    status: boolean;
    message: string;
    data: {
        access_token: string;
        refresh_token: string;
    };
}

export interface ApiError {
    status: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export const authService = {
    login: async (data: LoginInput): Promise<LoginResponse> => {
        try {
            const response = await axiosPublicInstance.post<LoginResponse>('/api/auth/login', data);
            return response.data;
        } catch (error: any) {
            console.error('Login API error:', error.response?.data || error.message);
            if (error.response?.data) {
                throw error.response.data;
            }
            throw new Error(error.message || 'Login failed. Please try again.');
        }
    },

    refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
        try {
            const response = await axiosInstance.post<RefreshTokenResponse>('/api/auth/refresh-token', {
                refresh_token: refreshToken,
            });
            return response.data;
        } catch (error: any) {
            console.error('Token refresh error:', error.response?.data || error.message);
            throw new Error('Session expired. Please login again.');
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage regardless of API success
            localStorage.removeItem('token');
        }
    },
};
