
import { useEffect, useState } from 'react'
import './SongEditor.css'
import { cloudEnabled, getCloudSongs, saveCloudSong, deleteCloudSong } from '../cloudStorage'

const KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B'
]

const SECTION_TYPES = [
  'Intro', 'Verse 1', 'Verse 2', 'Verse 3',
  'Chorus', 'Bridge', 'Pre-Chorus', 'Instrumental', 'Outro'
]

const STORAGE_KEY = 'hiraMusicSongs'

function getSavedSongs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function getKeyDifference(originalKey, targetKey) {
  return (
    KEYS.indexOf(targetKey) - KEYS.indexOf(originalKey) + 12
  ) % 12
}

function transposeChord(chord, semitones) {
  if (!chord || semitones === 0) return chord

  const match = chord.match(
    /^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/
  )

  if (!match) return chord

  const [, root, accidental, suffix, bass, bassAccidental] = match

  const getNoteIndex = (note, acc) => {
    let index = KEYS.indexOf(note)
    if (acc === '#') index += 1
    if (acc === 'b') index -= 1
    return (index + 12) % 12
  }

  const getTransposedNote = index =>
    KEYS[(index + semitones) % 12]

  const newRoot = getTransposedNote(
    getNoteIndex(root, accidental)
  )

  let newChord = newRoot + suffix

  if (bass) {
    const newBass = getTransposedNote(
      getNoteIndex(bass, bassAccidental)
    )
    newChord += '/' + newBass
  }

  return newChord
}

function createLyricLine() {
  return {
    id: Date.now() + Math.random(),
    type: 'lyric',
    lyrics: '',
    chords: []
  }
}

function SongEditor({ pendingChord, onChordAdded }) {
  const [songTitle, setSongTitle] = useState('')
  const [songKey, setSongKey] = useState('C')
  const [targetKey, setTargetKey] = useState('C')
  const [songTempo, setSongTempo] = useState(100)

  const [lines, setLines] = useState([createLyricLine()])
  const [viewMode, setViewMode] = useState(false)

  const [savedSongs, setSavedSongs] = useState(getSavedSongs)
  const [currentSongId, setCurrentSongId] = useState(null)
  const [selectedSongId, setSelectedSongId] = useState('')
  const [activeLineId, setActiveLineId] = useState(null)

  useEffect(() => {
    if (!cloudEnabled) return
    let active = true
    ;(async () => {
      try {
        const cloudSongs = await getCloudSongs()
        if (!active) return
        if (cloudSongs.length === 0) {
          const localSongs = getSavedSongs()
          for (const song of localSongs) await saveCloudSong(song)
          if (localSongs.length) setSavedSongs(localSongs)
        } else {
          setSavedSongs(cloudSongs)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudSongs))
        }
      } catch (error) {
        console.error('Could not load shared songs:', error)
        if (active) alert(`Could not connect to the shared music library: ${error.message}`)
      }
    })()
    return () => { active = false }
  }, [])

  const semitones = getKeyDifference(songKey, targetKey)

  // Receive a chord selected from the Chord Library.
  // Use the active lyric line, or the last lyric line if none is active.
  useEffect(() => {
    if (!pendingChord) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(previous => {
      let targetLine = previous.find(
        line => line.id === activeLineId && line.type !== 'section'
      )

      if (!targetLine) {
        targetLine = [...previous].reverse().find(
          line => line.type !== 'section'
        )
      }

      if (!targetLine) {
        const newLine = createLyricLine()

        return [
          ...previous,
          {
            ...newLine,
            chords: [{
              id: Date.now() + Math.random(),
              name: pendingChord,
              wordIndex: 0,
              beat: '1'
            }]
          }
        ]
      }

      return previous.map(line =>
        line.id === targetLine.id
          ? {
              ...line,
              chords: [
                ...line.chords,
                {
                  id: Date.now() + Math.random(),
                  name: pendingChord,
                  wordIndex: line.lyrics.trim() ? 1 : 0,
                  beat: '1'
                }
              ]
            }
          : line
      )
    })

    if (onChordAdded) onChordAdded()
}, [pendingChord, activeLineId, onChordAdded])

  // Add a new section heading.
  const addSection = () => {
    const nextSectionNumber =
      lines.filter(item => item.type === 'section').length + 1

    setLines(previous => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        type: 'section',
        title: `Verse ${nextSectionNumber}`
      },
      createLyricLine()
    ])
  }

  // Add another lyric line.
  const addLine = () => {
    const newLine = createLyricLine()
    setLines(previous => [...previous, newLine])
    setActiveLineId(newLine.id)
  }

  const updateSection = (id, value) => {
    setLines(previous =>
      previous.map(item =>
        item.id === id
          ? { ...item, title: value }
          : item
      )
    )
  }

  const deleteSection = id => {
    setLines(previous =>
      previous.filter(item => item.id !== id)
    )
  }

  const updateLyrics = (id, value) => {
    setLines(previous =>
      previous.map(line =>
        line.id === id
          ? { ...line, lyrics: value }
          : line
      )
    )
  }

  const addChord = id => {
    setLines(previous =>
      previous.map(line =>
        line.id === id
          ? {
              ...line,
              chords: [
                ...line.chords,
                {
                  id: Date.now() + Math.random(),
                  name: 'C',
                  wordIndex: 1,
                  beat: '1'
                }
              ]
            }
          : line
      )
    )
  }

  const updateChord = (lineId, chordId, field, value) => {
    setLines(previous =>
      previous.map(line =>
        line.id === lineId
          ? {
              ...line,
              chords: line.chords.map(chord =>
                chord.id === chordId
                  ? { ...chord, [field]: value }
                  : chord
              )
            }
          : line
      )
    )
  }

  const deleteChord = (lineId, chordId) => {
    setLines(previous =>
      previous.map(line =>
        line.id === lineId
          ? {
              ...line,
              chords: line.chords.filter(
                chord => chord.id !== chordId
              )
            }
          : line
      )
    )
  }

  const deleteLine = id => {
    setLines(previous =>
      previous.filter(line => line.id !== id)
    )

    if (activeLineId === id) {
      setActiveLineId(null)
    }
  }

  const changeOriginalKey = key => {
    setSongKey(key)
    setTargetKey(key)
  }

  const resetSong = () => {
    setSongTitle('')
    setSongKey('C')
    setTargetKey('C')
    setSongTempo(100)
    setLines([createLyricLine()])
    setCurrentSongId(null)
    setSelectedSongId('')
    setActiveLineId(null)
    setViewMode(false)
  }

  const saveSong = async () => {
    if (!songTitle.trim()) {
      alert('Please enter a song title before saving.')
      return
    }

    const song = {
      id: currentSongId || Date.now(),
      title: songTitle,
      key: songKey,
      tempo: songTempo,
      lines
    }

    const updatedSongs = currentSongId
      ? savedSongs.map(item =>
          item.id === currentSongId ? song : item
        )
      : [...savedSongs, song]

    try {
      if (cloudEnabled) await saveCloudSong(song)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSongs))
      setSavedSongs(updatedSongs)
    } catch (error) {
      alert(`Could not save song online: ${error.message}`)
      return
    }

    
    setCurrentSongId(song.id)
    setSelectedSongId(String(song.id))

    alert('Song saved successfully!')
  }

  const openSong = () => {
    const song = savedSongs.find(
      item => String(item.id) === selectedSongId
    )

    if (!song) {
      alert('Please select a saved song.')
      return
    }

    // Supports older saved songs that have no section headings.
    const loadedLines = song.lines.map(item => ({
      ...item,
      type: item.type || 'lyric',
      chords: item.chords || []
    }))

    setSongTitle(song.title)
    setSongKey(song.key)
    setTargetKey(song.key)
    setSongTempo(song.tempo)
    setLines(loadedLines)
    setCurrentSongId(song.id)
    setActiveLineId(null)
    setViewMode(false)
  }

  const deleteSavedSong = async () => {
    const song = savedSongs.find(
      item => String(item.id) === selectedSongId
    )

    if (!song) {
      alert('Please select a song to delete.')
      return
    }

    if (!window.confirm(`Delete "${song.title}" permanently?`)) {
      return
    }

    const updatedSongs = savedSongs.filter(
      item => item.id !== song.id
    )

    try {
      if (cloudEnabled) await deleteCloudSong(song.id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSongs))
      setSavedSongs(updatedSongs)
    } catch (error) {
      alert(`Could not delete song online: ${error.message}`)
      return
    }

    setSelectedSongId('')

    if (currentSongId === song.id) {
      setCurrentSongId(null)
    }
  }

  const renderChord = chord =>
    transposeChord(chord, semitones)

  const lyricLineCount = lines.filter(
    item => item.type !== 'section'
  ).length

  return (
    <div className="song-editor">

      {/* EDITING VIEW */}

      {!viewMode && (
        <>
          <div className="editor-heading">
            <div>
              <p className="editor-label">MUSIC WORKSPACE</p>
              <h2>Create Your Song</h2>
              <p>Organize your sections, lyrics and chords.</p>
            </div>
          </div>

          {/* SAVED SONGS */}

          <div className="saved-songs-panel">
            <h3>My Saved Songs</h3>

            <div className="saved-song-controls">
              <select
                value={selectedSongId}
                onChange={e => setSelectedSongId(e.target.value)}
              >
                <option value="">Select a saved song</option>

                {savedSongs.map(song => (
                  <option key={song.id} value={song.id}>
                    {song.title} ({song.key})
                  </option>
                ))}
              </select>

              <button
                onClick={openSong}
                disabled={!selectedSongId}
              >
                Open
              </button>

              <button
                className="danger-button"
                onClick={deleteSavedSong}
                disabled={!selectedSongId}
              >
                Delete
              </button>
            </div>
          </div>

          {/* SONG INFORMATION */}

          <div className="song-information">

            <div className="field">
              <label>Song Title</label>
              <input
                type="text"
                placeholder="Enter song title..."
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Original Musical Key</label>
              <select
                value={songKey}
                onChange={e => changeOriginalKey(e.target.value)}
              >
                {KEYS.map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Tempo (BPM)</label>
              <input
                type="number"
                min="1"
                max="300"
                value={songTempo}
                onChange={e => setSongTempo(Number(e.target.value))}
              />
            </div>

          </div>

          {/* TRANSPOSE */}

          <div className="transpose-panel">
            <div>
              <h3>Transpose Song</h3>
              <p>Original key: <strong>{songKey}</strong></p>
            </div>

            <div className="transpose-controls">
              <label>Display key</label>

              <select
                value={targetKey}
                onChange={e => setTargetKey(e.target.value)}
              >
                {KEYS.map(key => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>

              <button
                className="reset-transpose"
                onClick={() => setTargetKey(songKey)}
              >
                Reset
              </button>
            </div>

            <p className="transpose-note">
              {targetKey === songKey
                ? 'Original chords are displayed.'
                : `Temporary transpose: ${songKey} → ${targetKey}. Original chords are preserved.`}
            </p>
          </div>

          {/* LYRICS AND SECTIONS */}

          <div className="lyrics-editor">

            <div className="lyrics-heading">
              <h3>Lyrics & Chords</h3>
              <span>{lyricLineCount} lyric lines</span>
            </div>

            {lines.map(line => {

              // SECTION HEADING
              if (line.type === 'section') {
                return (
                  <div className="section-editor-card" key={line.id}>
                    <div className="section-editor-title">
                      <span>SONG SECTION</span>
                      <button onClick={() => deleteSection(line.id)}>
                        Remove section
                      </button>
                    </div>

                    <div className="section-editor-controls">
                      <select
                        value={SECTION_TYPES.includes(line.title)
                          ? line.title
                          : 'Custom'}
                        onChange={e => updateSection(
                          line.id,
                          e.target.value === 'Custom'
                            ? 'New Section'
                            : e.target.value
                        )}
                      >
                        {SECTION_TYPES.map(type => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                        <option value="Custom">Custom section</option>
                      </select>

                      <input
                        type="text"
                        value={line.title}
                        onChange={e => updateSection(
                          line.id,
                          e.target.value
                        )}
                        placeholder="Section name..."
                      />
                    </div>
                  </div>
                )
              }

              // LYRIC LINE

              const words = line.lyrics.trim()
                .split(/\s+/)
                .filter(Boolean)

              return (
                <div className="lyric-line" key={line.id}>

                  <div className="line-header">
                    <strong>Lyric line</strong>

                    <button
                      className="delete-line"
                      onClick={() => deleteLine(line.id)}
                    >
                      Delete line
                    </button>
                  </div>

                  <input
                    className="lyrics-input"
                    type="text"
                    placeholder="Enter this line of lyrics..."
                    value={line.lyrics}
                    onFocus={() => setActiveLineId(line.id)}
                    onChange={e => updateLyrics(line.id, e.target.value)}
                  />

                  <div className="chord-list">

                    {line.chords.map(chord => (
                      <div className="song-chord-control" key={chord.id}>

                        <input
                          className="chord-name"
                          value={chord.name}
                          onChange={e => updateChord(
                            line.id, chord.id, 'name', e.target.value
                          )}
                          placeholder="Chord"
                        />

                        <label>Word position</label>

                        <select
                          value={chord.wordIndex}
                          onChange={e => updateChord(
                            line.id,
                            chord.id,
                            'wordIndex',
                            Number(e.target.value)
                          )}
                        >
                          <option value={0}>Before first word</option>

                          {words.map((word, i) => (
                            <option key={i} value={i + 1}>
                              {i + 1}. {word}
                            </option>
                          ))}
                        </select>

                        <label>Beat</label>

                        <select
                          value={chord.beat}
                          onChange={e => updateChord(
                            line.id, chord.id, 'beat', e.target.value
                          )}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="R">R (Rest)</option>
                        </select>

                        <button
                          className="delete-chord"
                          onClick={() => deleteChord(line.id, chord.id)}
                        >
                          ×
                        </button>

                      </div>
                    ))}

                  </div>

                  <button
                    className="add-chord"
                    onClick={() => {
                      setActiveLineId(line.id)
                      addChord(line.id)
                    }}
                  >
                    + Add chord
                  </button>

                  {/* PREVIEW */}

                  <div className="line-preview">
                    <span className="preview-label">
                      PREVIEW — {targetKey}
                    </span>

                    <div className="preview-words">
                      {words.map((word, i) => {
                        const chords = line.chords.filter(
                          chord => chord.wordIndex === i + 1
                        )

                        return (
                          <span className="preview-word" key={i}>
                            <span className="preview-chords">
                              {chords.map(chord => (
                                <span className="preview-chord" key={chord.id}>
                                  {renderChord(chord.name)}
                                </span>
                              ))}
                            </span>

                            <span>{word}</span>
                          </span>
                        )
                      })}
                    </div>
                  </div>

                </div>
              )
            })}

            {/* ADD CONTENT BUTTONS */}

            <div className="section-actions">
              <button className="add-section" onClick={addSection}>
                + Add Song Section
              </button>

              <button className="add-line" onClick={addLine}>
                + Add another lyric line
              </button>
            </div>

          </div>

          {/* MAIN ACTIONS */}

          <div className="editor-actions">
            <button className="save-song-button" onClick={saveSong}>
              Save Song
            </button>

            <button
              className="view-song-button"
              onClick={() => setViewMode(true)}
            >
              View All Lyrics & Chords
            </button>

            <button className="new-song-button" onClick={resetSong}>
              New Song
            </button>
          </div>
        </>
      )}

      {/* FULL SONG VIEW */}

      {viewMode && (
        <div className="full-song-view">

          <div className="full-song-toolbar">
            <button onClick={() => setViewMode(false)}>
              ← Back to Editor
            </button>

            <button onClick={() => window.print()}>
              Print / Save PDF
            </button>
          </div>

          <div className="full-song-header">
            <p>HIRA MUSIC STUDIO</p>
            <h1>{songTitle || 'Untitled Song'}</h1>

            <div className="full-song-meta">
  <span>Key: {targetKey}</span>
</div>
          </div>

          <div className="full-song-transpose">
            <label>Temporary display key:</label>

            <select
              value={targetKey}
              onChange={e => setTargetKey(e.target.value)}
            >
              {KEYS.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>

            <button onClick={() => setTargetKey(songKey)}>
              Original key
            </button>
          </div>

          <div className="complete-lyrics">

            {lines.map(line => {

              if (line.type === 'section') {
                return (
                  <h2 className="complete-section-heading" key={line.id}>
                    [{line.title}]
                  </h2>
                )
              }

              const words = line.lyrics.trim()
                .split(/\s+/)
                .filter(Boolean)

              return (
                <div className="complete-lyric-line" key={line.id}>
                  <div className="complete-line-content">

                    {line.chords
                      .filter(chord => chord.wordIndex === 0)
                      .map(chord => (
                        <span className="complete-chord" key={chord.id}>
                          {renderChord(chord.name)}
                        </span>
                      ))}

                    {words.map((word, i) => {
                      const chords = line.chords.filter(
                        chord => chord.wordIndex === i + 1
                      )

                      return (
                        <span className="complete-word" key={i}>
                          <span className="complete-chords">
                            {chords.map(chord => (
                              <span className="complete-chord" key={chord.id}>
                                {renderChord(chord.name)}
                              </span>
                            ))}
                          </span>

                          <span>{word}</span>
                        </span>
                      )
                    })}

                  </div>
                </div>
              )
            })}

          </div>

          <div className="full-song-footer">
            <p>© Hira Music Studio</p>
          </div>

        </div>
      )}

    </div>
  )
}

export default SongEditor
