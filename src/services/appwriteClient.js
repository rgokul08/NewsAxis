import { Client, Account, Databases, Storage, Functions } from 'appwrite';
import { APP_CONFIG } from '../config/appConfig';

/**
 * Appwrite Client Initializer
 */
const client = new Client();

const isConfigured = Boolean(
  import.meta.env.VITE_APPWRITE_PROJECT_ID && 
  import.meta.env.VITE_APPWRITE_PROJECT_ID !== 'newsaxis-prod'
);

if (isConfigured) {
  client
    .setEndpoint(APP_CONFIG.appwrite.endpoint)
    .setProject(APP_CONFIG.appwrite.projectId);
} else {
  // Configured with default endpoint to allow graceful client initialization
  client
    .setEndpoint(APP_CONFIG.appwrite.endpoint)
    .setProject(APP_CONFIG.appwrite.projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client, isConfigured };
export default client;
