import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  metaAppId: process.env.META_APP_ID || '',
  metaAppSecret: process.env.META_APP_SECRET || '',
  metaRedirectUri: process.env.META_REDIRECT_URI || 'http://localhost:4000/api/auth/facebook/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export function isMetaConfigured() {
  return Boolean(config.metaAppId && config.metaAppSecret);
}
