import { Client, Databases, Query, Storage } from 'node-appwrite';

/**
 * Appwrite Scheduled Function: cleanup-expired-media
 * Schedule: every 1 hour (0 * * * *)
 *
 * Scans Appwrite Storage bucket 'newsaxis-media' and deletes orphaned
 * image assets no longer referenced by any active article document.
 */
export default async ({ req, res, log, error }) => {
  const client = new Client();
  const databases = new Databases(client);
  const storage = new Storage(client);

  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'newsaxis-main';
  const bucketId = process.env.APPWRITE_BUCKET_ID || 'newsaxis-media';

  if (!projectId || !apiKey) {
    log('Skipping remote execution: APPWRITE_API_KEY not configured.');
    return res.json({ success: true, message: 'Skipped - Missing configuration' });
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  try {
    const files = await storage.listFiles(bucketId);
    let deletedCount = 0;

    for (const file of files.files) {
      // Check if file is still associated with any existing article
      const matching = await databases.listDocuments(databaseId, 'articles', [
        Query.equal('mediaFileId', file.$id),
        Query.limit(1)
      ]);

      if (matching.total === 0) {
        log(`Deleting orphaned media asset: ${file.$id} (${file.name})`);
        await storage.deleteFile(bucketId, file.$id);
        deletedCount++;
      }
    }

    log(`Orphaned media cleanup completed: ${deletedCount} files deleted.`);
    return res.json({ success: true, deletedCount });
  } catch (err) {
    error(`Orphaned media cleanup failure: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
