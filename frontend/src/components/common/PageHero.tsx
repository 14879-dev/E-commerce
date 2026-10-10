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
    <section className="relative w-full overflow-hidden min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] mb-8 select-none rounded-2xl sm:rounded-3xl shadow-sm border border-[#565449]/20">
      {/* Background Media Layer (First Slider Only) */}
      <div className="absolute inset-0 w-full h-full">
        {firstSlide.type === 'video' ? (
          <video
            src={normalizeAssetUrl(firstSlide.url)}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <img
            src={normalizeAssetUrl(firstSlide.url) || '/uploads/hero.webp'}
            alt={displayTitle}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('/uploads/hero.webp')) {
                target.src = '/uploads/hero.webp';
              }
            }}
          />
        )}
      </div>

      {/* Contrast Overlay: Olive Drab rich gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#565449]/95 via-[#565449]/75 to-[#565449]/30 pointer-events-none z-[1]" />

      {/* Content Layer */}
      <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-12">
        <div className="max-w-2xl flex flex-col items-start text-left space-y-2 sm:space-y-3">
          {/* Badge */}
          {displayBadge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#565449]/80 border border-[#F7F4EB]/40 backdrop-blur-sm text-[11px] font-semibold text-[#F7F4EB] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#F7F4EB] shrink-0" />
              <span>{displayBadge}</span>
            </div>
          )}

          {/* Heading */}
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-[#F7F4EB] drop-shadow-md">
            <span>{displayTitle}</span>
            {displaySubtitle && (
              <span className="block text-[#F7F4EB]/90 text-lg sm:text-2xl font-light italic mt-1 font-serif">
                {displaySubtitle}
              </span>
            )}
          </h1>

          {/* Description */}
          {displayDescription && (
            <p className="text-xs sm:text-sm text-[#F7F4EB]/90 max-w-xl leading-relaxed">
              {displayDescription}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
