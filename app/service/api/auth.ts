import axiosInstance,{axiosPublicInstance} from '@/app/utils/axiosInstance';
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
            console.log('Attempting login with:', { email: data.email });
            const response = await axiosPublicInstance.post<LoginResponse>('/api/auth/login', data);
            console.log('Login API response:', response.data);
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
            console.log('Attempting to refresh token');
            const response = await axiosInstance.post<RefreshTokenResponse>('/api/auth/refresh-token', {
                refresh_token: refreshToken,
            });
            console.log('Token refresh successful');
            return response.data;
        } catch (error: any) {
            console.error('Token refresh error:', error.response?.data || error.message);
            throw new Error('Session expired. Please login again.');
        }
    },

    logout: async () => {
        try {
            // Call logout API if available
            await axiosInstance.post('/api/auth/logout');
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage regardless of API success
            localStorage.removeItem('token');
        }
    },
};
