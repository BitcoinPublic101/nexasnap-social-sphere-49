
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOMetaTagsProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  modifiedAt?: string;
  authorName?: string;
}

const SEOMetaTags: React.FC<SEOMetaTagsProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedAt,
  modifiedAt,
  authorName,
}) => {
  // Format the title to include the site name
  const formattedTitle = `${title} | NexaSnap`;
  const siteUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://nexasnap.com');
  const imageUrl = image || 'https://nexasnap.com/default-og-image.jpg'; // Replace with your default image

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={siteUrl} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Article Specific (for type="article") */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {type === 'article' && modifiedAt && (
        <meta property="article:modified_time" content={modifiedAt} />
      )}
      {type === 'article' && authorName && (
        <meta property="article:author" content={authorName} />
      )}
      
      {/* Schema.org markup for Google */}
      <script type="application/ld+json">
        {JSON.stringify(
          type === 'article'
            ? {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: title,
                image: imageUrl,
                author: {
                  '@type': 'Person',
                  name: authorName || 'NexaSnap User',
                },
                publisher: {
                  '@type': 'Organization',
                  name: 'NexaSnap',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://nexasnap.com/logo.png', // Replace with your logo URL
                  },
                },
                datePublished: publishedAt,
                dateModified: modifiedAt || publishedAt,
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': siteUrl,
                },
                description,
              }
            : {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'NexaSnap',
                url: 'https://nexasnap.com', // Replace with your site URL
                description,
              }
        )}
      </script>
      
      {/* Canonical link */}
      <link rel="canonical" href={siteUrl} />
    </Helmet>
  );
};

export default SEOMetaTags;
