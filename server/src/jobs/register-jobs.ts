import cron from 'node-cron';
import { cleanupUnverifiedUsers } from './cleanup-unverified-users.js';
import { cleanupExpiredResetTokens } from './cleanup-expired-reset-tokens.js';
import { cleanupExpiredUserSessions } from './cleanup-expired-user-sessions.js';

export function registerJobs() {
  try {
    cleanupUnverifiedUsers().catch((error) => {
      console.error(
        '❌ Failed to run boot cleanup job (unverified users):',
        error,
      );
    });

    cleanupExpiredResetTokens().catch((error) => {
      console.error('❌ Failed to run boot cleanup job (reset tokens):', error);
    });

    cleanupExpiredUserSessions().catch((error) => {
      console.error(
        '❌ Failed to run boot cleanup job (user sessions):',
        error,
      );
    });

    cron.schedule('0 0 * * *', async () => {
      try {
        await cleanupUnverifiedUsers();
        await cleanupExpiredResetTokens();
        await cleanupExpiredUserSessions();
      } catch (error) {
        console.error('❌ Failed to run cleanup job:', error);
      }
    });
  } catch (error) {
    throw new Error('Failed to register cron jobs', {
      cause: error,
    });
  }
}
