import { Client, Account, Databases, Storage, Functions } from 'appwrite';
import { APP_CONFIG } from '../config/appConfig';

/**
 * Appwrite Client Initializer
 */
const client = new Client();

const isConfigured = Boolean(
  APP_CONFIG.appwrite.projectId && 
  APP_CONFIG.appwrite.projectId !== 'newsaxis-prod'
);

client
  .setEndpoint(APP_CONFIG.appwrite.endpoint)
  .setProject(APP_CONFIG.appwrite.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client, isConfigured };
export default client;
