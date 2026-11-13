
import { useMemo, useState } from 'react'
import './ChordLibrary.css'

const NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B'
]

const CHORD_TYPES = [
  { label: 'Major', value: 'major', intervals: [0, 4, 7], suffix: '' },
  { label: 'Minor', value: 'minor', intervals: [0, 3, 7], suffix: 'm' },
  { label: '7th', value: '7', intervals: [0, 4, 7, 10], suffix: '7' },
  { label: 'Major 7th', value: 'maj7', intervals: [0, 4, 7, 11], suffix: 'maj7' },
  { label: 'Minor 7th', value: 'm7', intervals: [0, 3, 7, 10], suffix: 'm7' },
  { label: 'Sus2', value: 'sus2', intervals: [0, 2, 7], suffix: 'sus2' },
  { label: 'Sus4', value: 'sus4', intervals: [0, 5, 7], suffix: 'sus4' },
  { label: 'Diminished', value: 'dim', intervals: [0, 3, 6], suffix: 'dim' },
  { label: 'Augmented', value: 'aug', intervals: [0, 4, 8], suffix: 'aug' }
]

// Common open guitar chord shapes.
// String order: low E, A, D, G, B, high e.
// -1 = muted; 0 = open string.
const OPEN_CHORDS = {
  C: [-1, 3, 2, 0, 1, 0],
  Cm: [-1, 3, 5, 5, 4, 3],
  D: [-1, -1, 0, 2, 3, 2],
  Dm: [-1, -1, 0, 2, 3, 1],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  Gm: [3, 5, 5, 3, 3, 3],
  A: [-1, 0, 2, 2, 2, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  Bm: [-1, 2, 4, 4, 3, 2],
  A7: [-1, 0, 2, 0, 2, 0],
  D7: [-1, -1, 0, 2, 1, 2],
  E7: [0, 2, 0, 1, 0, 0],
  G7: [3, 2, 0, 0, 0, 1]
}

// Movable E-rooted chord shapes.
// These are simplified barre-style shapes.
const MOVABLE_SHAPES = {
  major: [0, 2, 2, 1, 0, 0],
  minor: [0, 2, 2, 0, 0, 0],
  '7': [0, 2, 0, 1, 0, 0],
  maj7: [0, 2, 1, 1, 0, 0],
  m7: [0, 2, 0, 0, 0, 0],
  sus2: [0, 2, 4, 4, 0, 0],
  sus4: [0, 2, 2, 2, 0, 0],
  dim: [0, 1, 2, 0, 2, 0],
  aug: [0, 3, 2, 1, 1, 0]
}

function getChordNotes(root, intervals) {
  const rootIndex = NOTES.indexOf(root)

  return intervals.map(interval =>
    NOTES[(rootIndex + interval) % 12]
  )
}

function getGuitarShape(root, type, chordName) {
  if (OPEN_CHORDS[chordName]) {
    return {
      frets: OPEN_CHORDS[chordName],
      startingFret: 1,
      openPosition: true
    }
  }

  const shape = MOVABLE_SHAPES[type]

  if (!shape) return null

  // The low E string is E, not C.
  // Calculate the correct fret for the selected root.
  const rootFret =
    (NOTES.indexOf(root) - NOTES.indexOf('E') + 12) % 12

  const frets = shape.map(fret =>
    fret === -1 ? -1 : fret + rootFret
  )

  const positiveFrets = frets.filter(fret => fret > 0)
  const startingFret = positiveFrets.length
    ? Math.max(1, Math.min(...positiveFrets))
    : 1

  return {
    frets,
    startingFret,
    openPosition: false
  }
}

function PianoKeyboard({ chordNotes, root }) {
  const whiteNotes = [
    'C', 'D', 'E', 'F', 'G', 'A', 'B'
  ]

  const blackNotes = [
    { note: 'C#', position: 0.7 },
    { note: 'D#', position: 1.7 },
    { note: 'F#', position: 3.7 },
    { note: 'G#', position: 4.7 },
    { note: 'A#', position: 5.7 }
  ]

  const active = note => chordNotes.includes(note)

  return (
    <div className="piano-keyboard">
      <div className="piano-keys">
        {whiteNotes.map(note => (
          <div
            className={`piano-white-key ${active(note) ? 'active-key' : ''} ${root === note ? 'root-key' : ''}`}
            key={note}
          >
            <span>{note}</span>
          </div>
        ))}

        {blackNotes.map(item => (
          <div
            className={`piano-black-key ${active(item.note) ? 'active-key' : ''} ${root === item.note ? 'root-key' : ''}`}
            key={item.note}
            style={{ left: `${(item.position + 0.5) * (100 / 7)}%` }}
          >
            <span>{item.note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GuitarDiagram({ chordName, guitarShape }) {
  if (!guitarShape) {
    return <p className="guitar-unavailable">No guitar shape available.</p>
  }

  const { frets, startingFret, openPosition } = guitarShape

  return (
    <div className="guitar-diagram">
      {!openPosition && (
        <p className="guitar-caption">
          Starting fret: {startingFret}
        </p>
      )}

      <div className="guitar-string-labels">
        {['E', 'A', 'D', 'G', 'B', 'e'].map(string => (
          <span key={string}>{string}</span>
        ))}
      </div>

      <div className="guitar-grid">
        {frets.map((fret, index) => (
          <div className="guitar-string" key={index}>
            <span className="guitar-string-line" />
            <span className="guitar-finger">
              {fret === -1 ? '×' : fret === 0 ? '○' : fret}
            </span>
          </div>
        ))}
      </div>

      <p className="guitar-caption">
        {chordName} — strings from low E to high E
      </p>

      <p className="guitar-caption">
        Numbers = fret, ○ = open string, × = muted string.
      </p>
    </div>
  )
}

function ChordLibrary({ onUseChord }) {
  const [selectedRoot, setSelectedRoot] = useState('C')
  const [selectedType, setSelectedType] = useState('major')
  const [instrument, setInstrument] = useState('piano')
  const [search, setSearch] = useState('')

  const chordType = CHORD_TYPES.find(
    item => item.value === selectedType
  )

  const chordName = selectedRoot + chordType.suffix

  const chordNotes = useMemo(
    () => getChordNotes(selectedRoot, chordType.intervals),
    [selectedRoot, chordType]
  )

  const guitarShape = useMemo(
    () => getGuitarShape(selectedRoot, selectedType, chordName),
    [selectedRoot, selectedType, chordName]
  )

  const filteredChords = useMemo(() => {
    return NOTES.flatMap(root =>
      CHORD_TYPES.map(type => ({
        name: root + type.suffix,
        root,
        type: type.value,
        label: type.label
      }))
    ).filter(chord =>
      chord.name.toLowerCase().includes(search.toLowerCase()) ||
      chord.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const selectChord = chord => {
    setSelectedRoot(chord.root)
    setSelectedType(chord.type)
    setSearch('')
  }

  const addChordToSong = () => {
    if (typeof onUseChord === 'function') {
      onUseChord(chordName)
    } else {
      alert('The Song Editor connection is not available.')
    }
  }

  return (
    <div className="chord-library">
      <div className="chord-library-header">
        <p className="chord-library-label">MUSICAL REFERENCE</p>
        <h2>Chord Library</h2>
        <p>
          Discover chords, learn their notes and explore piano
          and guitar positions.
        </p>
      </div>

      <div className="chord-search">
        <input
          type="search"
          placeholder="Search chords... Example: C, Am, G7"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {search && (
        <div className="chord-search-results">
          {filteredChords.length > 0 ? (
            filteredChords.slice(0, 12).map(chord => (
              <button
                key={chord.name}
                onClick={() => selectChord(chord)}
              >
                <strong>{chord.name}</strong>
                <span>{chord.label}</span>
              </button>
            ))
          ) : (
            <p>No matching chords found.</p>
          )}
        </div>
      )}

      <div className="chord-selection-panel">
        <div className="chord-selection-field">
          <label>Root Note</label>
          <select
            value={selectedRoot}
            onChange={e => setSelectedRoot(e.target.value)}
          >
            {NOTES.map(note => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </div>

        <div className="chord-selection-field">
          <label>Chord Type</label>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
          >
            {CHORD_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chord-result">
        <div className="chord-result-header">
          <div>
            <p>SELECTED CHORD</p>
            <h3>{chordName}</h3>
            <span>{chordType.label}</span>
          </div>

          <button
            className="add-chord-to-song"
            onClick={addChordToSong}
          >
            + Use Chord
          </button>
        </div>

        <div className="chord-notes">
          <h4>Chord Notes</h4>
          <div className="chord-note-list">
            {chordNotes.map((note, index) => (
              <div className="chord-note" key={index}>
                {note}
              </div>
            ))}
          </div>
        </div>

        <div className="instrument-tabs">
          <button
            className={instrument === 'piano' ? 'active' : ''}
            onClick={() => setInstrument('piano')}
          >
            Piano
          </button>

          <button
            className={instrument === 'guitar' ? 'active' : ''}
            onClick={() => setInstrument('guitar')}
          >
            Guitar
          </button>
        </div>

        {instrument === 'piano' && (
          <div className="instrument-view">
            <h4>Piano Keyboard</h4>
            <p>Highlighted keys belong to {chordName}.</p>
            <PianoKeyboard
              chordNotes={chordNotes}
              root={selectedRoot}
            />
          </div>
        )}

        {instrument === 'guitar' && (
          <div className="instrument-view">
            <h4>Guitar Fingering</h4>
            <p>Finger positions for {chordName}.</p>
            <GuitarDiagram
              chordName={chordName}
              guitarShape={guitarShape}
            />
            <p className="guitar-caption">
              Some movable shapes are simplified learning examples.
              Check the fingering before using them in performance.
            </p>
          </div>
        )}
      </div>

      <div className="chord-categories">
        <h3>Chord Categories</h3>
        <div className="chord-category-grid">
          {CHORD_TYPES.map(type => (
            <button
              key={type.value}
              className={selectedType === type.value ? 'selected' : ''}
              onClick={() => setSelectedType(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChordLibrary
