import React from 'react';
import { Sparkles } from 'lucide-react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { normalizeAssetUrl } from '../../utils/assetUrl';

interface PageHeroProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({
  badge,
  title,
  subtitle,
  description,
}) => {
  const { settings } = useStoreSettings();

  const firstSlide = React.useMemo(() => {
    if (Array.isArray(settings.heroSlides) && settings.heroSlides.length > 0) {
      const active = settings.heroSlides.filter(s => s.active !== false);
      if (active.length > 0) return active[0];
    }
    if (settings.heroMediaUrl) {
      return {
        url: settings.heroMediaUrl,
        type: settings.heroMediaType || 'image',
        badge: 'Heritage Re-imagined With AI Fit',
        title: 'Authentic Peshawari Chappal',
        subtitle: 'Crafted for Royalty.',
        description: 'Hand-tanned full-grain cowhide leather, double-stitched by master craftsmen in Khyber Pakhtunkhwa.',
      };
    }
    return {
      url: '/uploads/hero.webp',
      type: 'image',
      badge: 'Heritage Re-imagined With AI Fit',
      title: 'Authentic Peshawari Chappal',
      subtitle: 'Crafted for Royalty.',
      description: 'Hand-tanned full-grain cowhide leather, double-stitched by master craftsmen in Khyber Pakhtunkhwa.',
    };
  }, [settings.heroSlides, settings.heroMediaUrl, settings.heroMediaType]);

  const displayBadge = badge || firstSlide.badge || 'Heritage Re-imagined';
  const displayTitle = title || firstSlide.title || 'Authentic Peshawari Chappal';
  const displaySubtitle = subtitle || firstSlide.subtitle;
  const displayDescription = description || firstSlide.description;

  return (
    <section className="psh-hero relative w-full overflow-hidden select-none bg-[#ECE6DA]">
      <style>{`@media(min-width:1024px){.psh-hero-banner{height:50vh!important;min-height:420px!important;max-height:500px!important}}`}</style>

      {/* Unified Banner for Desktop, Tablet, and Mobile with exact same height as Home */}
      <div className="psh-hero-banner relative w-full aspect-[1024/523] min-h-[250px] sm:min-h-[420px] max-h-[500px] overflow-hidden">
        {firstSlide.type === 'video' ? (
          <video
            src={normalizeAssetUrl(firstSlide.url)}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />
        ) : (
          <img
            src={normalizeAssetUrl(firstSlide.url) || '/uploads/hero.webp'}
            alt={displayTitle}
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('/uploads/hero.webp')) {
                target.src = '/uploads/hero.webp';
              } else if (!target.src.endsWith('/uploads/hero-bg.png')) {
                target.src = '/uploads/hero-bg.png';
              }
            }}
          />
        )}

        {/* Content Layer directly over full banner, matching Home layout */}
        <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-4 sm:py-6">
          <div className="max-w-xl flex flex-col items-start text-left space-y-1.5 sm:space-y-3">
            {/* Badge */}
            {displayBadge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#565449]/80 border border-[#F7F4EB]/40 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-[#F7F4EB] uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F7F4EB] shrink-0" />
                <span>{displayBadge}</span>
              </div>
            )}

            {/* Heading */}
            <h1 className="font-serif text-2xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-[#F7F4EB] drop-shadow-md">
              <span>{displayTitle}</span>
              {displaySubtitle && (
                <span className="block text-[#EDE3CF] text-base sm:text-2xl lg:text-3xl font-light italic mt-0.5 sm:mt-1 font-serif drop-shadow-sm">
                  {displaySubtitle}
                </span>
              )}
            </h1>

            {/* Description */}
            {displayDescription && (
              <p className="text-[11px] sm:text-sm text-[#ECE4D2] max-w-lg leading-snug sm:leading-relaxed font-normal drop-shadow-sm line-clamp-3 sm:line-clamp-none">
                {displayDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
