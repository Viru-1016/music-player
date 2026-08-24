import React, { useState, useEffect } from 'react'

export default function CoverArt({ url, title }) {
  const [hasError, setHasError] = useState(false)

  // Auto-format path (e.g., 'image/1.jpeg' -> '/image/1.jpeg')
  const formatCoverUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return null
    let clean = rawUrl.trim().replace(/\\/g, '/')
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
      return clean
    }
    // Ensure leading slash for public assets
    return clean.startsWith('/') ? clean : `/${clean}`
  }

  const finalSrc = formatCoverUrl(url)

  useEffect(() => {
    setHasError(false)
  }, [url])

  // If image URL exists and hasn't encountered load error
  if (finalSrc && !hasError) {
    return (
      <img
        src={finalSrc}
        alt={title || 'Track Cover'}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          borderRadius: 'inherit'
        }}
      />
    )
  }

  // Fallback Album Art with First Letter & Violet Gradient
  const initial = title ? title.trim().charAt(0).toUpperCase() : '🎵'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: initial.length === 1 ? '16px' : '18px',
        fontFamily: 'var(--inter)',
        borderRadius: 'inherit',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}
    >
      {initial}
    </div>
  )
}