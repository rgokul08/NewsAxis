import { Client, Databases, Query } from 'node-appwrite';

/**
 * Appwrite Scheduled Function: calculate-trending
 * Schedule: every 15 minutes (or as configured)
 *
 * Evaluates view velocity, bookmark counts, comment volume, and reactions
 * with gravity time decay to assign the isTrending flag to top ranked articles.
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
    const list = await databases.listDocuments(databaseId, 'articles', [
      Query.limit(100),
      Query.orderDesc('createdAt')
    ]);

    const scored = list.documents.map(art => {
      const views = art.views || 0;
      const bookmarks = (art.bookmarksCount || 0) * 3;
      const comments = (art.commentsCount || 0) * 2;
      const ageHours = Math.max(0.5, (Date.now() - new Date(art.publishedAt || art.createdAt).getTime()) / (1000 * 60 * 60));
      const score = (views + bookmarks + comments) / Math.pow(ageHours + 2, 1.5);
      return { id: art.$id, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top10Ids = new Set(scored.slice(0, 10).map(s => s.id));

    let updated = 0;
    for (const art of list.documents) {
      const shouldBeTrending = top10Ids.has(art.$id);
      if (art.isTrending !== shouldBeTrending) {
        await databases.updateDocument(databaseId, 'articles', art.$id, {
          isTrending: shouldBeTrending
        });
        updated++;
      }
    }

    log(`Trending re-ranked: ${updated} article states updated.`);
    return res.json({ success: true, updated });
  } catch (err) {
    error(`Trending calculation failure: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
