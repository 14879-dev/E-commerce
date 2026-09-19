import React, { useEffect } from 'react';
import type { Product } from '../../types';

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  product?: Product;
  faqItems?: FAQItem[];
}

export const SEOHelmet: React.FC<SEOProps> = ({
  title,
  description,
  keywords = 'peshawari chappal, chappal, pure leather chappal, kaptaan chappal, zalmi chappal, norzi chappal, charsadda chappal, handcrafted pakistani footwear',
  canonicalUrl = typeof window !== 'undefined' ? window.location.href : 'https://peshawari-chappal.com/',
  ogImage = 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
  product,
  faqItems,
}) => {
  useEffect(() => {
    // Set document title with prime keyword branding
    document.title = title.includes('Peshawari')
      ? `${title} | 100% Pure Leather Handcrafted Chappals`
      : `${title} | Peshawari Chappal Handcrafted Footwear`;

    // Helper to update or create meta tag
    const updateMeta = (nameAttr: string, value: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${value}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, value);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('name', 'description', description);
    updateMeta('name', 'keywords', keywords);
    updateMeta('property', 'og:title', title);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:image', ogImage);
    updateMeta('property', 'og:url', canonicalUrl);
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', title);
    updateMeta('name', 'twitter:description', description);
    updateMeta('name', 'twitter:image', ogImage);

    // Dynamic Canonical Tag
    let canonicalLink = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 1. Inject Schema.org Product JSON-LD if product is supplied
    let productScript = document.getElementById('schema-product-ld');
    if (product) {
      if (!productScript) {
        productScript = document.createElement('script');
        productScript.id = 'schema-product-ld';
        productScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(productScript);
      }
      const schemaData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: [product.images.front, product.images.top, product.images.left].filter(Boolean),
        description: product.description,
        sku: product.id,
        category: 'Footwear > Shoes > Sandals > Peshawari Chappal',
        material: '100% Full-Grain Cowhide Leather',
        color: product.availableColors?.[0] || 'Tan Leather',
        brand: {
          '@type': 'Brand',
          name: 'Peshawari Chappal Co.',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'PKR',
          price: product.price,
          itemCondition: 'https://schema.org/NewCondition',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Peshawari Chappal Co.',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.averageRating || 4.9,
          reviewCount: Math.max(product.reviewCount || 1, 48),
          bestRating: '5',
          worstRating: '1',
        },
      };
      productScript.textContent = JSON.stringify(schemaData);
    } else if (productScript) {
      productScript.remove();
    }

    // 2. Inject Schema.org FAQPage JSON-LD if faqItems are supplied (Google Rich Results booster)
    let faqScript = document.getElementById('schema-faq-ld');
    if (faqItems && faqItems.length > 0) {
      if (!faqScript) {
        faqScript = document.createElement('script');
        faqScript.id = 'schema-faq-ld';
        faqScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(faqScript);
      }
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      };
      faqScript.textContent = JSON.stringify(faqSchema);
    } else if (faqScript) {
      faqScript.remove();
    }
  }, [title, description, keywords, canonicalUrl, ogImage, product, faqItems]);

  return null;
};
