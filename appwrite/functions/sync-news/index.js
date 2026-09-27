import { Client, Databases, Query, ID } from 'node-appwrite';
import { aggregateRealWorldContent } from '../../../server/aggregator.js';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  try {
    // 1. purge expired
    const nowIso = new Date().toISOString();
    const expired = await databases.listDocuments(databaseId, 'articles', [
      Query.lessThanEqual('expiresAt', nowIso),
      Query.limit(100)
    ]);
    for (const doc of expired.documents) {
      await databases.deleteDocument(databaseId, 'articles', doc.$id).catch(() => {});
    }

    // 2. fetch fresh real-world content
    const { articles } = await aggregateRealWorldContent(30);

    // 3. write into Appwrite
    let synced = 0;
    for (const art of articles.slice(0, 60)) {
      const docId = art.id.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
      const data = {
        title: art.title.slice(0, 255),
        slug: art.slug.slice(0, 150),
        summary: (art.summary || '').slice(0, 1000),
        content: (art.content || art.summary || '').slice(0, 5000),
        imageUrl: art.imageUrl || '',
        sourceName: art.sourceName || 'NewsAxis',
        sourceUrl: art.sourceUrl || '',
        authorName: art.authorName || 'Staff',
        categoryId: art.categoryId || 'world',
        contentType: art.contentType || 'news',
        sourceType: art.sourceType || 'external_news',
        tags: JSON.stringify(art.tags || []),
        publishedAt: art.publishedAt,
        createdAt: art.createdAt,
        expiresAt: art.expiresAt,
        isBreaking: Boolean(art.isBreaking),
        isFeatured: Boolean(art.isFeatured),
        views: art.views || 1,
        readingTime: art.readingTime || 3,
      };
      try {
        await databases.createDocument(databaseId, 'articles', docId, data);
      } catch {
        await databases.updateDocument(databaseId, 'articles', docId, data).catch(() => {});
      }
      synced++;
    }

    log(`Synced ${synced} articles, purged ${expired.total}.`);
    return res.json({ success: true, synced, purged: expired.total });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
