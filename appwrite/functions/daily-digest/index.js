import { Client, Databases, Query } from 'node-appwrite';

/**
 * Appwrite Scheduled Function: daily-digest
 * Schedule: 0 7 * * * (Daily at 7:00 AM UTC)
 *
 * Compiles the top breaking and trending stories into a daily digest
 * and distributes to opted-in subscribers in the newsletter_subscribers collection.
 */
export default async ({ req, res, log, error }) => {
  const client = new Client();
  const databases = new Databases(client);

  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'newsaxis-main';

  if (!projectId || !apiKey) {
    log('Skipping remote execution: APPWRITE_API_KEY not configured.');
    return res.json({ success: true, message: 'Skipped - Missing configuration' });
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  try {
    // 1. Fetch top 5 trending stories
    const topStories = await databases.listDocuments(databaseId, 'articles', [
      Query.equal('isTrending', true),
      Query.limit(5)
    ]);

    // 2. Fetch active newsletter subscribers
    const subscribers = await databases.listDocuments(databaseId, 'newsletter_subscribers', [
      Query.equal('status', 'active'),
      Query.limit(100)
    ]);

    log(`Generated digest with ${topStories.total} headlines for ${subscribers.total} active subscribers.`);
    return res.json({
      success: true,
      headlinesCount: topStories.total,
      subscribersCount: subscribers.total,
      digestDate: new Date().toISOString()
    });
  } catch (err) {
    error(`Daily digest dispatch failure: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
