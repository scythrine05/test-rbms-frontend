import 'next-auth';

declare module 'next-auth' {
    interface User {
        id: string;
        name: string;
        email: string;
        role: string;
        department: string;
        phone: string;
        accessToken: string;
        refreshToken: string;
        location: string;
        depot: string;
    }

    interface Session {
        user: User;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        accessToken: string;
        refreshToken: string;
        role: string;
        department: string;
        phone: string;
        location: string;
        depot: string;
    }
}