import { usePlayer } from './PlayerContext.jsx'
import CoverArt from './CoverArt.jsx'

export function formatDuration(sec) {
  sec = Number(sec) || 0
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m + ':' + String(s).padStart(2, '0')
}

export function EmptyState({ children }) {
  return <div className="empty">{children}</div>
}

function PlayButton({ song, playlist }) {
  const { playSong, togglePlay, isCurrentlyPlaying, current } = usePlayer()
  const playing = isCurrentlyPlaying(song.id)
  const hasAudio = !!song.audioUrl

  function handleClick(e) {
    e.stopPropagation()
    if (current && current.id === song.id) togglePlay()
    else playSong(song, playlist)
  }

  return (
    <button
      className={'play-btn' + (!hasAudio ? ' play-btn-noaudio' : '')}
      onClick={handleClick}
      title={hasAudio ? (playing ? 'Pause' : 'Play') : 'No audio link for this song'}
    >
      {playing ? (
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 5l13 7-13 7V5z" /></svg>
      )}
    </button>
  )
}

export function SongTable({ songs, onDelete, playlist }) {
  const { isCurrentlyPlaying } = usePlayer()

  if (!songs || songs.length === 0) {
    return (
      <EmptyState>
        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
        <div>No songs found.</div>
      </EmptyState>
    )
  }

  const list = playlist || songs

  return (
    <table className="song-table">
      <thead>
        <tr>
          <th></th><th>Title</th><th>Artist</th><th>Genre</th><th>Duration</th><th>Rating</th><th></th>
        </tr>
      </thead>
      <tbody>
        {songs.map(s => (
          <tr key={s.id} className={isCurrentlyPlaying(s.id) ? 'row-playing' : ''}>
            <td className="cell-play">
              <div className="row-cover">
                <CoverArt song={s} size={36} playing={isCurrentlyPlaying(s.id)} />
                <PlayButton song={s} playlist={list} />
              </div>
            </td>
            <td>
              <div className="song-title-cell">{s.title}</div>
              <div className="song-id-cell">#{s.id}</div>
            </td>
            <td>{s.artist}</td>
            <td><span className="genre-pill">{s.genre}</span></td>
            <td>{formatDuration(s.duration)}</td>
            <td className="rating">★ {Number(s.rating).toFixed(1)}</td>
            <td>
              {onDelete && (
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(s.id)}>Delete</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ConsoleBlock({ text, loading }) {
  if (loading) return <div className="console">Loading…</div>
  if (!text || !text.trim()) return <div className="console empty-c">No output.</div>
  return <div className="console">{text}</div>
}
