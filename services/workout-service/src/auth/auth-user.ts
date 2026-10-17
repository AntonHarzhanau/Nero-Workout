import type { Request } from 'express';

export interface AuthUser {
    id: string;
    role: 'standard' | 'admin';
}

export type AuthenticatedRequest = Request & {
    user?: AuthUser;
}