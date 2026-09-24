import { normalizeArticle } from '../utils/normalizeArticle';

/**
 * High-quality seed data for offline mode, testing, and initial instant rendering.
 * Clearly marked as 'Demo Content' where applicable in accordance with Rule 128.
 */
export const SEED_ARTICLES = [
  normalizeArticle({
    id: 'demo_breaking_1',
    title: 'ISRO Announces Next-Generation Space Station Module Launch Window',
    slug: 'isro-announces-next-generation-space-station-module-launch-window',
    summary: 'India space agency ISRO details timeline for Bharatiya Antariksh Station foundational module with orbital docking demonstration scheduled for late 2028.',
    content: `The Indian Space Research Organisation (ISRO) today announced key milestones for its upcoming space station initiative, the Bharatiya Antariksh Station (BAS). 

Senior mission engineers outlined the architectural blueprints for the first habitat module, scheduled for an orbital test demonstration in late 2028. The habitat will accommodate autonomous microgravity experiments in biological materials, metallurgy, and deep-space life-support testing.

"Our goal is sustained presence and indigenous capability," stated project leadership. "The docking validation trials scheduled for next quarter will solidify cross-module rendezvous systems." 

India has actively expanded aerospace manufacturing partnerships across Tamil Nadu, Karnataka, and Andhra Pradesh to accelerate commercial payload deliveries.`,
    imageUrl: 'https://images.unsplash.com/photo-1517976487502-53b34db06c9e?w=1200&auto=format&fit=crop&q=80',
    sourceName: 'NewsAxis Editorial',
    sourceType: 'editorial',
    contentType: 'news',
    categoryId: 'science',
    authorName: 'Dr. Anand Raman',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isBreaking: true,
    isFeatured: true,
    isTrending: true,
    views: 4820,
    reactions: { like: 240, helpful: 85, interesting: 194, insightful: 62 },
    commentsCount: 38
  }),
  normalizeArticle({
    id: 'demo_hero_ai',
    title: 'The Rise of Sovereign AI Models: Nations Race to Build Autonomous Compute Clusters',
    slug: 'the-rise-of-sovereign-ai-models-nations-race-to-build-autonomous-compute',
    summary: 'Governments worldwide are shifting investments towards national AI infrastructure, securing localized training data and custom silicon fabric to preserve digital autonomy.',
    content: `From New Delhi to Paris and Tokyo, sovereign artificial intelligence has swiftly transformed from an academic policy talking point into multi-billion-dollar infrastructure allocations.

Over twenty nations have now enacted formal sovereign AI mandates. These programs guarantee domestic compute capacity, protect native linguistic training corpora, and build specialized frontier models tuned for local governance and national security needs.

Industry leaders note that relying entirely on foreign hyperscalers introduces systemic vulnerability in supply chains, privacy controls, and data residency. With localized high-bandwidth interconnects and custom RISC-V accelerators gaining momentum, the next five years will redefine how national intelligence infrastructure operates.`,
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80',
    sourceName: 'NewsAxis Editorial',
    sourceType: 'editorial',
    contentType: 'news',
    categoryId: 'artificial-intelligence',
    authorName: 'Priya Sundaram',
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isBreaking: false,
    isFeatured: true,
    isTrending: true,
    views: 8940,
    reactions: { like: 520, helpful: 140, interesting: 310, insightful: 120 },
    commentsCount: 64
  }),
  normalizeArticle({
    id: 'demo_tech_quantum',
    title: 'Quantum Advantage in Cryptographic Resiliency: New Benchmark Published',
    slug: 'quantum-advantage-in-cryptographic-resiliency-new-benchmark-published',
    summary: 'Post-quantum lattice encryption standards transition into production implementations across financial networks as compliance deadlines loom.',
    content: `Enterprise cybersecurity architects are accelerating migrations to post-quantum cryptography (PQC). The latest lattice-based algorithms demonstrate minimal latency overhead in high-throughput payment gateways, proving ready for mainstream rollout.`,
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
    sourceName: 'Tech Wire',
    sourceType: 'external_news',
    contentType: 'news',
    categoryId: 'technology',
    authorName: 'Alex Mercer',
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    isTrending: true,
    views: 3120,
    reactions: { like: 180, helpful: 90, interesting: 75, insightful: 40 },
    commentsCount: 19
  }),
  normalizeArticle({
    id: 'demo_india_ev',
    title: 'Tamil Nadu Unveils $1.2B Clean Energy and Battery Gigafactory Corridor',
    slug: 'tamil-nadu-unveils-clean-energy-battery-gigafactory-corridor',
    summary: 'The southern industrial hub expands its manufacturing dominance with advanced solid-state cathode assembly facilities in Hosur and Coimbatore.',
    content: `Tamil Nadu has solidified its position as South Asia electric mobility leader with the signing of three major battery pack and component memorandums of understanding worth $1.2 billion. The facilities will create over 14,000 advanced technical engineering jobs.`,
    imageUrl: 'https://images.unsplash.com/photo-1558441719-79a0b38c0356?w=1200&auto=format&fit=crop&q=80',
    sourceName: 'NewsAxis Regional',
    sourceType: 'editorial',
    contentType: 'news',
    categoryId: 'tamil-nadu',
    authorName: 'M. K. Saravanan',
    publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    isTrending: false,
    views: 2650,
    reactions: { like: 210, helpful: 45, interesting: 60, insightful: 30 },
    commentsCount: 15
  }),
  normalizeArticle({
    id: 'demo_community_post_1',
    title: 'Architecting Resilient Offline-First Web Apps with Modern Browser Storage',
    slug: 'architecting-resilient-offline-first-web-apps-modern-storage',
    summary: 'A deep-dive into Service Workers, OPFS (Origin Private File System), and optimistic UI state management for data-intensive web experiences.',
    content: `When designing modern web applications, handling transient connectivity shouldn't be an afterthought. This article details practical synchronization queues, conflict-free replicated data strategies, and background sync APIs that keep users productive even in zero-signal environments.`,
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    sourceName: 'NewsAxis Community',
    sourceType: 'community_blog',
    contentType: 'blog',
    categoryId: 'programming',
    authorName: 'Kavitha Nathan',
    authorId: 'user_kavitha',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 54).toISOString(), // Strictly 72h from creation
    views: 1420,
    reactions: { like: 94, helpful: 52, interesting: 28, insightful: 41 },
    commentsCount: 14
  }),
  normalizeArticle({
    id: 'demo_community_post_2',
    title: 'From Monolith to Modular Microfrontends: Lessons from 10M Monthly Active Readers',
    slug: 'from-monolith-to-modular-microfrontends-lessons-learned',
    summary: 'How we restructured our media publishing pipeline to reduce LCP below 800ms while maintaining independent team deployments.',
    content: `Breaking down a large digital publishing platform requires disciplined boundary management. Here are our benchmarks, bundle size containment rules, and CDN caching patterns.`,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    sourceName: 'NewsAxis Community',
    sourceType: 'community_blog',
    contentType: 'blog',
    categoryId: 'technology',
    authorName: 'Rahul Varma',
    authorId: 'user_rahul',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 62).toISOString(),
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 62).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(), // Expiring in 10 hours!
    views: 2980,
    reactions: { like: 145, helpful: 68, interesting: 42, insightful: 55 },
    commentsCount: 22
  })
];
