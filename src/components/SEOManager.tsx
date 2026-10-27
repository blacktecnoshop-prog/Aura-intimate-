import React, { useEffect } from 'react';
import { Product, Category, StoreSettings } from '../types/store';

interface SEOManagerProps {
  product: Product | null;
  activeCategory: string;
  activePolicyPage: string | null;
  sizeGuideOpen: boolean;
  settings: StoreSettings;
  categories: Category[];
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  product,
  activeCategory,
  activePolicyPage,
  sizeGuideOpen,
  settings,
  categories,
}) => {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://auraintimates.com';
    const brandName = settings.brandName || 'Aura Intimates';

    // 1. Determine Title, Description, Canonical URL, and Image
    let pageTitle = settings.metaTitle || `${brandName} | Women's Innerwear`;
    let pageDesc =
      settings.metaDescription ||
      `Shop luxury women's innerwear, wireless everyday bras, seamless panties, and matching lingerie sets at ${brandName}. 100% discreet packaging across India.`;
    let canonicalUrl = `${origin}/`;
    let pageImage = `${origin}/images/aura-intimates-logo.png`;
    let pageType = 'website';
    let breadcrumbs: Array<{ name: string; url: string }> = [{ name: 'Home', url: `${origin}/` }];

    if (product) {
      pageTitle = product.metaTitle || `${product.name} — Luxury Women's Innerwear | ${brandName}`;
      pageDesc =
        product.metaDescription ||
        (product.description
          ? `${product.description.slice(0, 140)}... Free discreet packaging in India.`
          : `Buy ${product.name} online at ${brandName}. Ultra-soft comfort, genuine sizing, and 100% confidential delivery.`);
      canonicalUrl = `${origin}/product/${product.id}`;
      pageImage = product.images?.[0]
        ? product.images[0].startsWith('http')
          ? product.images[0]
          : `${origin}${product.images[0].startsWith('/') ? '' : '/'}${product.images[0]}`
        : pageImage;
      pageType = 'product';

      const cat = categories.find((c) => c.id === product.categoryId || c.name === product.categoryName);
      if (cat) {
        breadcrumbs.push({ name: cat.name, url: `${origin}/category/${cat.slug || cat.id}` });
      }
      breadcrumbs.push({ name: product.name, url: canonicalUrl });
    } else if (sizeGuideOpen) {
      pageTitle = `Women's Innerwear Size Guide & Bra Fit Calculator | ${brandName}`;
      pageDesc = `Accurately measure your underbust and bust to calculate your perfect bra band and cup size. Sister size guidance and panty hip charts from ${brandName}.`;
      canonicalUrl = `${origin}/size-guide`;
      breadcrumbs.push({ name: 'Size & Fit Guide', url: canonicalUrl });
    } else if (activePolicyPage) {
      switch (activePolicyPage) {
        case 'size-guide':
          pageTitle = `Women's Innerwear Size Guide & Bra Fit Calculator | ${brandName}`;
          pageDesc = `Accurately measure your underbust and bust to calculate your perfect bra band and cup size. Sister size conversion matrix and panty hip charts from ${brandName}.`;
          canonicalUrl = `${origin}/size-guide`;
          breadcrumbs.push({ name: 'Size & Fit Guide', url: canonicalUrl });
          break;
        case 'about':
          pageTitle = `About Us — Artisanal Women's Innerwear & Silhouette Perfection | ${brandName}`;
          pageDesc = `Discover ${brandName}'s commitment to buttery-soft fabrics, inclusive cup sizing, wire-free support, and intimate hygiene integrity across India.`;
          canonicalUrl = `${origin}/about`;
          breadcrumbs.push({ name: 'About Us', url: canonicalUrl });
          break;
        case 'contact':
          pageTitle = `Customer Concierge & Sizing Guidance | ${brandName}`;
          pageDesc = `Connect directly with ${brandName} for intimate sizing consultations, order inquiries, and confidential order assistance via Instagram DM and email.`;
          canonicalUrl = `${origin}/contact`;
          breadcrumbs.push({ name: 'Contact Us', url: canonicalUrl });
          break;
        case 'shipping':
          pageTitle = `100% Discreet Packaging & Express Delivery Policy | ${brandName}`;
          pageDesc = `All ${brandName} orders are delivered in unmarked plain packaging with zero lingerie labels. Free express shipping on orders over ₹${settings.freeShippingThreshold || 999}.`;
          canonicalUrl = `${origin}/policy/shipping`;
          breadcrumbs.push({ name: 'Shipping Policy', url: canonicalUrl });
          break;
        case 'returns':
          pageTitle = `Intimate Hygiene, Returns & 7-Day Size Exchange Policy | ${brandName}`;
          pageDesc = `Transparent exchange rules adhering to intimate sanitary regulations. 7-day size exchange on unworn bras with protective seal integrity.`;
          canonicalUrl = `${origin}/policy/returns`;
          breadcrumbs.push({ name: 'Hygiene & Exchange Policy', url: canonicalUrl });
          break;
        case 'privacy':
          pageTitle = `Confidential Shopping & Data Privacy Policy | ${brandName}`;
          pageDesc = `Your personal measurements and orders remain strictly confidential. Zero third-party marketing sharing and anonymous courier dispatch.`;
          canonicalUrl = `${origin}/policy/privacy`;
          breadcrumbs.push({ name: 'Privacy Policy', url: canonicalUrl });
          break;
        case 'terms':
          pageTitle = `Terms & Conditions of Service | ${brandName}`;
          pageDesc = `Review ordering terms, Instagram DM booking confirmation processes, and genuine pricing standards for ${brandName}.`;
          canonicalUrl = `${origin}/policy/terms`;
          breadcrumbs.push({ name: 'Terms & Conditions', url: canonicalUrl });
          break;
      }
    } else if (activeCategory && activeCategory !== 'all') {
      const currentCat = categories.find((c) => c.slug === activeCategory || c.id === activeCategory);
      if (currentCat) {
        pageTitle = currentCat.metaTitle || `${currentCat.name} for Women — Buy Online in India | ${brandName}`;
        pageDesc =
          currentCat.metaDescription ||
          (currentCat.description
            ? `${currentCat.description} Explore our curated ${currentCat.name.toLowerCase()} range at ${brandName}.`
            : `Shop premium ${currentCat.name.toLowerCase()} with breathable fabrics and flawless support at ${brandName}.`);
        canonicalUrl = `${origin}/category/${currentCat.slug || currentCat.id}`;
        breadcrumbs.push({ name: currentCat.name, url: canonicalUrl });
      }
    }

    // 2. Apply Meta Tags to Head
    document.title = pageTitle;

    const setMeta = (nameAttr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${nameAttr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(nameAttr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', pageDesc);
    setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', pageDesc);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', pageImage);
    setMeta('property', 'og:type', pageType);
    setMeta('property', 'og:site_name', brandName);
    setMeta('property', 'og:locale', 'en_IN');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', pageDesc);
    setMeta('name', 'twitter:image', pageImage);

    // Google Search Console Verification Tag
    if (settings.googleSiteVerification) {
      setMeta('name', 'google-site-verification', settings.googleSiteVerification);
    }

    // 3. Set Canonical Link Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // 4. Inject Schema.org JSON-LD structured data
    const injectJsonLd = (id: string, data: object) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(data);
    };

    // Schema 1: OnlineStore & Organization
    injectJsonLd('ld-store', {
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      name: brandName,
      url: origin,
      logo: `${origin}/images/aura-intimates-logo.png`,
      description: "Luxury women's innerwear, supportive wire-free bras, silk knickers, and seamless sets in India.",
      currenciesAccepted: 'INR',
      priceRange: '₹₹',
      telephone: settings.contactPhone || '+91 98765 43210',
      email: settings.contactEmail || 'contact@auraintimates.com',
      paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
      sameAs: [settings.instagramUrl].filter(Boolean),
    });

    // Schema 2: WebSite with SearchAction
    injectJsonLd('ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: brandName,
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });

    // Schema 3: BreadcrumbList
    if (breadcrumbs.length > 1) {
      injectJsonLd('ld-breadcrumbs', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.url,
        })),
      });
    } else {
      const el = document.getElementById('ld-breadcrumbs');
      if (el) el.remove();
    }

    // Schema 4: Product Schema (when on product page)
    if (product) {
      injectJsonLd('ld-product', {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images?.map((img) =>
          img.startsWith('http') ? img : `${origin}${img.startsWith('/') ? '' : '/'}${img}`
        ),
        description: pageDesc,
        sku: product.sku,
        category: product.categoryName || 'Women Innerwear',
        brand: {
          '@type': 'Brand',
          name: brandName,
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'INR',
          price: product.sellingPrice,
          priceValidUntil: '2027-12-31',
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: brandName,
          },
        },
      });
    } else {
      const el = document.getElementById('ld-product');
      if (el) el.remove();
    }

    // Schema 5: FAQ Schema on Size Guide & Policies
    if (sizeGuideOpen || activePolicyPage === 'returns' || activePolicyPage === 'shipping') {
      injectJsonLd('ld-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I calculate my bra size accurately?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Measure your snug underbust in inches to determine your band size (round odd numbers up to the next even integer). Then measure the fullest part of your bust. The difference between bust and underbust determines your cup size: 1 inch = A, 2 inches = B, 3 inches = C, 4 inches = D.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are orders shipped in discreet packaging?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, 100% of orders are dispatched in plain, unmarked kraft boxes or opaque security flyers with no intimate product labels or descriptions on the exterior.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the return and exchange policy for innerwear?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Bras are eligible for a 7-day one-time size exchange if unworn, unwashed, and original security tags remain intact. For strict sanitary health standards, panties with opened protective seals are final sale.',
            },
          },
        ],
      });
    } else {
      const el = document.getElementById('ld-faq');
      if (el) el.remove();
    }
  }, [product, activeCategory, activePolicyPage, sizeGuideOpen, settings, categories]);

  return null;
};
