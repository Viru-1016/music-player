function hueFor(seed) {
  let h = 0
  const s = String(seed)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 360
}

export default function CoverArt({ song, size = 44, playing = false }) {
  const hue = hueFor((song && (song.id + song.title)) || 'x')
  const style = {
    width: size, height: size,
    background: `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${(hue + 55) % 360} 80% 32%))`
  }
  return (
    <div className={'cover' + (playing ? ' cover-playing' : '')} style={style}>
      {playing ? (
        <span className="cover-eq"><i></i><i></i><i></i></span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" width={Math.round(size * 0.42)} height={Math.round(size * 0.42)}>
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      )}
    </div>
  )
}
