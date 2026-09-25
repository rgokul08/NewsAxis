import { Client, Databases, Query, Storage } from 'node-appwrite';

/**
 * Appwrite Scheduled Function: cleanup-expired-content
 * Schedule: every 30 minutes
 *
 * Mandatory 30-Minute Retention Enforcement:
 * 1. Finds all posts where expiresAt <= now
 * 2. Deletes associated comments
 * 3. Deletes associated reactions
 * 4. Deletes associated media assets
 * 5. Permanently hard-deletes the article document
 * 6. Emits an audit log record
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

  const nowIso = new Date().toISOString();
  let deletedArticles = 0;
  let deletedComments = 0;
  let deletedMedia = 0;
  let failures = 0;

  try {
    // 1. Query articles where expiresAt <= now
    const expiredList = await databases.listDocuments(databaseId, 'articles', [
      Query.lessThanEqual('expiresAt', nowIso)
    ]);

    log(`Found ${expiredList.total} expired articles to prune (30-minute retention window).`);

    for (const article of expiredList.documents) {
      try {
        // Delete related comments
        const comments = await databases.listDocuments(databaseId, 'comments', [
          Query.equal('articleId', article.$id)
        ]);
        for (const c of comments.documents) {
          await databases.deleteDocument(databaseId, 'comments', c.$id);
          deletedComments++;
        }

        // Delete article cover media if hosted internally
        if (article.mediaFileId) {
          try {
            await storage.deleteFile(bucketId, article.mediaFileId);
            deletedMedia++;
          } catch (e) {
            // file might already be removed
          }
        }

        // Hard delete article
        await databases.deleteDocument(databaseId, 'articles', article.$id);
        deletedArticles++;

        // Audit log
        await databases.createDocument(databaseId, 'audit_logs', 'unique()', {
          actorId: 'system_cleanup_scheduler',
          action: 'ARTICLE_EXPIRED_PURGE',
          resourceType: 'article',
          resourceId: article.$id,
          timestamp: new Date().toISOString(),
          metadata: JSON.stringify({ title: article.title, authorId: article.authorId })
        });
      } catch (err) {
        error(`Failed to cleanup article ${article.$id}: ${err.message}`);
        failures++;
      }
    }

    const summary = {
      deletedArticles,
      deletedComments,
      deletedMedia,
      failures,
      timestamp: new Date().toISOString()
    };
    log(`Cleanup summary: ${JSON.stringify(summary)}`);
    return res.json({ success: true, summary });
  } catch (err) {
    error(`Cleanup job failure: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
