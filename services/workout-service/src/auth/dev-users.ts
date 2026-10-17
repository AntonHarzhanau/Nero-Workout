import { AuthUser } from "./auth-user.js";

export const DEV_USERS = new Map<string, AuthUser>([
  [
    'user1',
    {
      id: '11111111-1111-4111-8111-111111111111',
      role: 'standard',
    },
  ],
  [
    'user2',
    {
      id: '22222222-2222-4222-8222-222222222222',
      role: 'standard',
    },
  ],
  [
    'admin',
    {
      id: '33333333-3333-4333-8333-333333333333',
      role: 'admin',
    },
  ],
]);