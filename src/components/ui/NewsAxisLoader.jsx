import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDEO_SOURCE = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';

/**
 * NewsAxisLoader — Fullscreen Premium Cinematic Loading Screen
 *
 * Designed exclusively for NewsAxis with:
 * - 100vw × 100vh full-screen background video
 * - Dark cinematic overlay, vignette, and subtle film noise
 * - Simplified transparent NewsAxis emblem & wordmark logo
 * - Smooth Framer Motion entrance and exit easing curves
 * - Responsive sizing across mobile, tablet, laptop, and PC
 * - Video fallback and prefers-reduced-motion support
 */
export function NewsAxisLoader({ minDuration = 2200, onComplete }) {
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

  // Smooth progress animation over minDuration
  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId;
    let exitTimeoutId;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      // Exponential ease-out progression
      const rawProgress = Math.min(100, (elapsed / minDuration) * 100);
      setProgress(rawProgress);

      if (elapsed < minDuration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        // Begin exit transition
        setIsExiting(true);
        exitTimeoutId = setTimeout(() => {
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }, 750);
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

  // Framer motion variants respecting reduced motion
  const contentVariants = {
    initial: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.92, y: 15, filter: 'blur(8px)' },
    animate: reducedMotion
      ? { opacity: 1 }
      : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
    exit: reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 1.03, filter: 'blur(4px)' }
  };

  const transitionConfig = {
    duration: reducedMotion ? 0.4 : 1.1,
    ease: [0.16, 1, 0.3, 1]
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="newsaxis-loader"
          role="status"
          aria-live="polite"
          aria-label="NewsAxis is loading the latest stories"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden select-none bg-[#07090e] flex items-center justify-center pointer-events-auto"
        >
          {/* Layer 1: Cinematic Video Background or Fallback */}
          {!videoError ? (
            <video
              ref={videoRef}
              src={VIDEO_SOURCE}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none scale-105"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-[#07090e] bg-[radial-gradient(ellipse_at_center,rgba(169,27,13,0.22)_0%,rgba(7,9,14,0.98)_70%)] z-0" />
          )}

          {/* Layer 2: Dark Cinematic Shading & Blur Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px] z-10 pointer-events-none" />

          {/* Layer 3: Vertical Editorial Vignette & Vignette Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-black/90 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.88)_100%)] z-10 pointer-events-none" />

          {/* Layer 4: Subtle Film Grain Noise Overlay (SVG Data URI) */}
          <div
            className="absolute inset-0 z-10 pointer-events-none opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />

          {/* Layer 5: Centered NewsAxis Brand Focus & Loading Indicator */}
          <motion.div
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionConfig}
            className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto space-y-6 sm:space-y-7"
          >
            {/* Transparent Simplified NewsAxis Logo (Shield & Wordmark) */}
            <div className="relative group">
              {/* Subtle ambient golden backglow */}
              <div className="absolute -inset-6 bg-gradient-to-r from-[#a91b0d]/25 via-[#d4af37]/20 to-[#a91b0d]/25 rounded-full blur-2xl opacity-70 animate-pulse pointer-events-none" />
              
              <img
                src="/assets/newsaxis-loading-logo.png"
                alt="NewsAxis"
                className="relative w-[76vw] sm:w-[58vw] md:w-[44vw] lg:w-[34vw] xl:w-[28vw] max-w-[420px] h-auto object-contain mx-auto drop-shadow-[0_14px_35px_rgba(0,0,0,0.9)] select-none"
              />
            </div>

            {/* Editorial Brand Tagline */}
            <p className="font-serif text-xs sm:text-sm tracking-[0.28em] uppercase text-amber-100/90 font-medium drop-shadow-md">
              Discover what matters.
            </p>

            {/* Minimal Premium Progress Line & Counter */}
            <div className="flex flex-col items-center space-y-2 pt-1 w-full">
              {/* Horizontal Progress Track */}
              <div className="w-48 sm:w-64 h-[2px] bg-white/15 rounded-full overflow-hidden relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#a91b0d] via-[#d4af37] to-[#fff3c4] shadow-[0_0_12px_rgba(212,175,55,0.7)] transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Progress Percentage */}
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-slate-300/80 font-medium">
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NewsAxisLoader;
