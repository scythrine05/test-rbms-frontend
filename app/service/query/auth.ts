import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/auth';
import { LoginInput } from '@/app/validation/auth';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export const useAuth = () => {
    const router = useRouter();

    const loginMutation = useMutation({
        mutationFn: (data: LoginInput) => authService.login(data),
        onSuccess: async (data) => {
            try {
                const result = await signIn('credentials', {
                    redirect: false,
                    accessToken: data.data.access_token,
                    refreshToken: data.data.refresh_token,
                    user: JSON.stringify(data.data.user),
                });

                if (result?.error) {
                    throw new Error(result.error);
                }

                router.push('/dashboard');
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        },
    });

    return {
        login: loginMutation.mutate,
        isLoading: loginMutation.isPending,
        error: loginMutation.error,
    };
};
