import { randomBytes } from 'crypto';
export const newGuestToken = () => randomBytes(12).toString('base64url');
