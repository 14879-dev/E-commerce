import React, { useEffect } from 'react';
import type { Product } from '../../types';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  product?: Product;
}

export const SEOHelmet: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl = window.location.href,
  ogImage = 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
  product
}) => {
  useEffect(() => {
    // Set document title
    document.title = `${title} | Peshawari Handcrafted Leather Chappal`;

    // Helper to update meta tag
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
    updateMeta('property', 'og:title', title);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:image', ogImage);
    updateMeta('property', 'og:url', canonicalUrl);
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', title);
    updateMeta('name', 'twitter:description', description);
    updateMeta('name', 'twitter:image', ogImage);

    // Inject Schema.org Product JSON-LD if product is supplied
    let scriptTag = document.getElementById('schema-json-ld');
    if (product) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'schema-json-ld';
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      const schemaData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        'name': product.name,
        'image': [product.images.front, product.images.top, product.images.left],
        'description': product.description,
        'sku': product.id,
        'brand': {
          '@type': 'Brand',
          'name': 'Peshawari Chappal Co.'
        },
        'offers': {
          '@type': 'Offer',
          'url': canonicalUrl,
          'priceCurrency': 'USD',
          'price': product.price,
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': 'https://schema.org/InStock'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': product.averageRating,
          'reviewCount': product.reviewCount
        }
      };
      scriptTag.textContent = JSON.stringify(schemaData);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, canonicalUrl, ogImage, product]);

  return null;
};
