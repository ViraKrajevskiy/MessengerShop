import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { SITE_NAME, absoluteUrl } from '../config/site'

// Per-route <head> metadata. Uses React 19 native document metadata:
// <title>/<meta>/<link> rendered here are hoisted into <head>.
//
// Props:
//   title       — page title (site name is appended automatically)
//   description — meta description / OG / Twitter description
//   path        — canonical path; defaults to the current route
//   image       — absolute or site-relative OG/Twitter image
//   type        — OG type (default "website"; use "article" / "profile")
//   noindex     — emit robots noindex,nofollow (auth/private pages)
//   jsonLd      — object serialized into a JSON-LD <script>
const OG_LOCALE = { ru: 'ru_RU', en: 'en_US', tr: 'tr_TR' }

export default function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const { lang } = useLanguage()
  const { pathname } = useLocation()

  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const canonical = absoluteUrl(path || pathname || '/')
  const ogImage = image ? absoluteUrl(image) : undefined

  // SEO-relevant for assistive tech and crawlers; static index.html can't
  // know the user's chosen language.
  useEffect(() => {
    if (lang) document.documentElement.setAttribute('lang', lang)
  }, [lang])

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={OG_LOCALE[lang] || 'ru_RU'} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLd && (
        <script
          type="application/ld+json"
          // Escape <, >, & so user-supplied fields (business/product names)
          // can't break out of the <script> with a literal </script>.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g, '\\u003c')
              .replace(/>/g, '\\u003e')
              .replace(/&/g, '\\u0026'),
          }}
        />
      )}
    </>
  )
}
