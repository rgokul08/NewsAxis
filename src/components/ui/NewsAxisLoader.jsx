import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_SOURCE = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';

/**
 * NewsAxisLoader — Fullscreen Premium 4-Second Cinematic Loading Screen
 *
 * Enhanced features:
 * - 4-second cinematic duration (minDuration = 4000)
 * - Ken Burns slow background zoom
 * - Ambient dual-layer breathing aurora backlight
 * - Animated metallic gold shimmer light sweep across the NewsAxis logo
 * - Elegant tracking expansion on the brand tagline "Discover what matters."
 * - Glowing leading edge beacon on the progress bar
 * - Dynamic editorial status cycle synced to progression
 * - Elegant hairline corner broadcast metadata accents
 * - Video fallback and prefers-reduced-motion support
 */
export function NewsAxisLoader({ minDuration = 4000, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef(null);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Smooth 4-second progress animation with requestAnimationFrame
  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId;
    let exitTimeoutId;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      // Smooth eased progression over minDuration
      const rawProgress = Math.min(100, (elapsed / minDuration) * 100);
      setProgress(rawProgress);

      if (elapsed < minDuration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        setIsExiting(true);
        exitTimeoutId = setTimeout(() => {
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }, 850);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (exitTimeoutId) {
        clearTimeout(exitTimeoutId);
      }
    };
  }, [minDuration, onComplete]);

  // Dynamic editorial status message based on progress percentage
  const statusMessage = useMemo(() => {
    if (progress < 28) return 'CONNECTING TO GLOBAL WIRES';
    if (progress < 60) return 'CURATING VERIFIED DISPATCHES';
    if (progress < 88) return 'SYNCHRONIZING FRONT PAGE';
    return 'WELCOME TO NEWSAXIS';
  }, [progress]);

  // Framer motion variants
  const contentVariants = {
    initial: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.90, y: 18, filter: 'blur(10px)' },
    animate: reducedMotion
      ? { opacity: 1 }
      : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
    exit: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 1.04, filter: 'blur(6px)' }
  };

  const transitionConfig = {
    duration: reducedMotion ? 0.4 : 1.25,
    ease: [0.16, 1, 0.3, 1]
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="newsaxis-loader"
          role="status"
          aria-live="polite"
          aria-label="NewsAxis is loading verified global dispatches"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden select-none bg-[#05070b] flex items-center justify-center pointer-events-auto"
        >
          {/* Layer 1: Cinematic Video Background with Slow Ken Burns Zoom */}
          <motion.div
            initial={{ scale: 1 }}
            animate={reducedMotion ? { scale: 1 } : { scale: 1.08 }}
            transition={{ duration: 5.5, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {!videoError ? (
              <video
                ref={videoRef}
                src={VIDEO_SOURCE}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#05070b] bg-[radial-gradient(ellipse_at_center,rgba(169,27,13,0.28)_0%,rgba(5,7,11,0.98)_75%)]" />
            )}
          </motion.div>

          {/* Layer 2: Dark Cinematic Shading & Soft Blur */}
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[1.5px] z-10 pointer-events-none" />

          {/* Layer 3: Vertical Editorial Vignette & Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/35 to-black/95 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.92)_100%)] z-10 pointer-events-none" />

          {/* Layer 4: Subtle Film Grain Noise Texture (Inline SVG) */}
          <div
            className="absolute inset-0 z-10 pointer-events-none opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />

          {/* Layer 5: Delicate Editorial Corner Accents */}
          <div className="absolute top-6 left-6 z-20 hidden md:flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-slate-400/60 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>NEWSAXIS • LIVE BROADCAST</span>
          </div>

          <div className="absolute top-6 right-6 z-20 hidden md:flex items-center gap-1.5 text-[10px] font-mono tracking-[0.25em] text-slate-400/60 uppercase">
            <span>EDITION IST</span>
            <span className="text-amber-500/80">30-MIN</span>
          </div>

          <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-slate-400/60 uppercase">
            <span>INDEPENDENT JOURNALISM</span>
          </div>

          <div className="absolute bottom-6 right-6 z-20 hidden md:flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-slate-400/60 uppercase">
            <span>VERIFIED FEEDS</span>
          </div>

          {/* Layer 6: Centered NewsAxis Brand Focus & Loading Interface */}
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionConfig}
            className="relative z-30 flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto space-y-6 sm:space-y-7"
          >
            {/* Logo Container with Dual-Layer Breathing Aurora & Shimmer Light Sweep */}
            <div className="relative group">
              {/* Outer Deep Red & Gold Breathing Aura */}
              {!reducedMotion && (
                <motion.div
                  animate={{
                    scale: [1, 1.18, 1],
                    opacity: [0.45, 0.8, 0.45]
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="absolute -inset-10 bg-gradient-to-r from-[#a91b0d]/35 via-[#d4af37]/30 to-[#a91b0d]/35 rounded-full blur-3xl pointer-events-none"
                />
              )}

              {/* Inner Pulsing Core Light */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#a91b0d]/20 via-[#f5d77f]/25 to-[#a91b0d]/20 rounded-full blur-xl opacity-80 pointer-events-none" />

              {/* NewsAxis Logo with Masked Light Sweep Effect */}
              <div className="relative overflow-hidden p-2">
                <img
                  src="/assets/newsaxis-loading-logo.png"
                  alt="NewsAxis"
                  className="relative w-[76vw] sm:w-[58vw] md:w-[44vw] lg:w-[34vw] xl:w-[28vw] max-w-[430px] h-auto object-contain mx-auto drop-shadow-[0_16px_40px_rgba(0,0,0,0.95)] select-none"
                />

                {/* Animated Metallic Shimmer Light Ray across Logo */}
                {!reducedMotion && (
                  <motion.div
                    initial={{ x: '-160%', opacity: 0 }}
                    animate={{
                      x: ['-160%', '200%'],
                      opacity: [0, 0.55, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.6,
                      ease: 'easeInOut',
                      repeatDelay: 1.2
                    }}
                    className="absolute inset-0 w-2/3 h-full bg-gradient-to-r from-transparent via-amber-100/35 to-transparent skew-x-[-25deg] pointer-events-none"
                  />
                )}
              </div>
            </div>

            {/* Editorial Brand Tagline with Smooth Tracking Expansion */}
            <motion.p
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, letterSpacing: '0.14em', y: 6 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, letterSpacing: '0.34em', y: 0 }}
              transition={{ duration: 1.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-xs sm:text-sm uppercase text-amber-100/95 font-medium drop-shadow-lg select-none"
            >
              Discover what matters.
            </motion.p>

            {/* Premium Progress Bar with Glowing Tip Beacon */}
            <div className="flex flex-col items-center space-y-3 pt-1 w-full max-w-xs sm:max-w-sm">
              {/* Horizontal Track */}
              <div className="w-56 sm:w-72 h-[3px] bg-white/10 rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#a91b0d] via-[#d4af37] to-[#fff4d0] relative transition-all duration-75 ease-out shadow-[0_0_14px_rgba(212,175,55,0.7)]"
                  style={{ width: `${progress}%` }}
                >
                  {/* Glowing Leading Edge Beacon */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff,0_0_18px_#ffd700,0_0_26px_#a91b0d] -mr-1" />
                </div>
              </div>

              {/* Progression Metrics & Dynamic Status */}
              <div className="flex flex-col items-center gap-1">
                {/* Dynamic Status Text */}
                <motion.span
                  key={statusMessage}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-[10px] font-mono tracking-[0.2em] text-amber-200/75 uppercase"
                >
                  {statusMessage}
                </motion.span>

                {/* Percentage Display */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-slate-300/80 font-bold">
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NewsAxisLoader;
