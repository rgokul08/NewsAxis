// scripts/sync-news.js
/**
 * NewsAxis 30-Minute News Synchronization CLI & Action Runner
 * Can be executed locally, via cron daemon, or via GitHub Actions.
 */
import { aggregateRealWorldContent, formatIST } from '../server/aggregator.js';
import { syncArticlesToAppwrite, purgeExpiredFromAppwrite, getAppwriteStatus } from '../server/appwrite.js';

async function main() {
  const startTime = new Date();
  console.log('\n========================================================');
  console.log('       NEWSAXIS SCHEDULED NEWS SYNCHRONIZATION         ');
  console.log(`       Triggered at: ${formatIST(startTime)}`);
  console.log('========================================================\n');

  try {
    // 1. Purge expired articles from Appwrite
    console.log('[Step 1/3] Purging expired articles (>30 mins old)...');
    const purgedCount = await purgeExpiredFromAppwrite(startTime).catch(err => {
      console.warn('  ⚠️ Purge note:', err.message);
      return 0;
    });
    console.log(`  ✓ Purged ${purgedCount} expired articles.\n`);

    // 2. Fetch fresh real-world content from RSS feeds and APIs
    console.log('[Step 2/3] Fetching real-world news from verified feeds...');
    const { articles, batchId } = await aggregateRealWorldContent(30);
    console.log(`  ✓ Aggregated ${articles.length} fresh real-world articles (Batch: ${batchId})\n`);

    // 3. Write articles to Appwrite Cloud
    console.log('[Step 3/3] Syncing articles to Appwrite Database...');
    const appwriteResult = await syncArticlesToAppwrite(articles, batchId);
    const errCount = Array.isArray(appwriteResult.errors) ? appwriteResult.errors.length : (appwriteResult.errors || 0);
    console.log(`  ✓ Appwrite Result: ${appwriteResult.synced || 0} synced, ${appwriteResult.skipped || 0} skipped, ${errCount} errors\n`);

    const appStatus = getAppwriteStatus();
    console.log('========================================================');
    console.log(`  Status:       ${appStatus.configured ? 'Connected to Appwrite Cloud' : 'Appwrite unconfigured / skipped'}`);
    console.log(`  Project:      ${appStatus.projectId || 'N/A'}`);
    console.log(`  Synced:       ${appwriteResult.synced || 0}`);
    console.log(`  Elapsed:      ${((Date.now() - startTime.getTime()) / 1000).toFixed(1)}s`);
    console.log(`  Completed at: ${formatIST(new Date())}`);
    console.log('========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  }
}

main();
