
import { useState } from 'react'
import './App.css'
import SongEditor from './components/SongEditor'
import ChordLibrary from './components/ChordLibrary'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [pendingChord, setPendingChord] = useState(null)

  const goHome = () => {
    setCurrentPage('home')
  }

  // Receive a chord from the Chord Library
  const handleUseChord = (chord) => {
    setPendingChord(chord)
    setCurrentPage('editor')
  }

  // Clear the selected chord after Song Editor receives it
  const handleChordAdded = () => {
    setPendingChord(null)
  }

  return (
    <div className="app">

      {/* Navigation */}
      <header className="navbar">
        <div
          className="logo"
          onClick={goHome}
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-icon">♫</span>
          <span>Hira Music Studio</span>
        </div>

        <nav>
          <a href="#home" onClick={goHome}>
            Home
          </a>

          <a href="#libraries" onClick={goHome}>
            Libraries
          </a>

          <a
            href="#workspace"
            onClick={() => setCurrentPage('editor')}
          >
            My Workspace
          </a>

          <a
            href="#chords"
            onClick={() => setCurrentPage('chords')}
          >
            Chord Library
          </a>

          <a href="#about" onClick={goHome}>
            About
          </a>
        </nav>

        <span className="login-btn" aria-label="Shared music workspace">
          Shared Studio
        </span>
      </header>

      {/* Homepage */}
      {currentPage === 'home' && (
        <main id="home">

          <section className="hero">
            <p className="welcome">
              WELCOME TO HIRA MUSIC STUDIO
            </p>

            <h1>
              Your Music.
              <br />
              Your <span>Arrangement.</span>
            </h1>

            <p className="hero-description">
              Discover Malagasy hymns, organize your chords,
              write lyrics and create your own musical arrangements.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-btn"
                onClick={() => {
                  document.getElementById('libraries')?.scrollIntoView({
                    behavior: 'smooth'
                  })
                }}
              >
                Explore Libraries
              </button>

              <button
                className="secondary-btn"
                onClick={() => setCurrentPage('editor')}
              >
                Create a Song
              </button>
            </div>
          </section>

          {/* Music libraries */}
          <section className="libraries" id="libraries">

            <div className="section-heading">
              <p>YOUR MUSIC COLLECTION</p>
              <h2>Explore Music Libraries</h2>
            </div>

            <div className="library-grid">

              <div className="library-card">
                <div className="library-icon">♫</div>

                <h3>Fihirana Solfa</h3>

                <p>
                  Malagasy church hymns with traditional
                  solfa notation and lyrics.
                </p>

                <button onClick={() => setCurrentPage('editor')}>
                  Open Library →
                </button>
              </div>

              <div className="library-card">
                <div className="library-icon">♪</div>

                <h3>Asafa 2</h3>

                <p>
                  Your dedicated collection of church
                  songs and musical arrangements.
                </p>

                <button onClick={() => setCurrentPage('editor')}>
                  Open Library →
                </button>
              </div>

              <div className="library-card">
                <div className="library-icon">🌍</div>

                <h3>World Songs</h3>

                <p>
                  International songs with chords,
                  lyrics, keys and capo settings.
                </p>

                <button onClick={() => setCurrentPage('editor')}>
                  Open Library →
                </button>
              </div>

              <div className="library-card">
                <div className="library-icon">🎹</div>

                <h3>Chord Library</h3>

                <p>
                  Explore musical chords, discover piano
                  notes and guitar chord shapes.
                </p>

                <button onClick={() => setCurrentPage('chords')}>
                  Explore Chords →
                </button>
              </div>

            </div>
          </section>

        </main>
      )}

      {/* Song Editor */}
      {currentPage === 'editor' && (
        <main id="workspace" className="workspace">

          <button
            className="secondary-btn"
            onClick={goHome}
            style={{ margin: '25px 0' }}
          >
            ← Back to Home
          </button>

          <SongEditor
            pendingChord={pendingChord}
            onChordAdded={handleChordAdded}
          />

        </main>
      )}

      {/* Chord Library */}
      {currentPage === 'chords' && (
        <main id="chords" className="workspace">

          <button
            className="secondary-btn"
            onClick={goHome}
            style={{ margin: '25px 0' }}
          >
            ← Back to Home
          </button>

          <ChordLibrary onUseChord={handleUseChord} />

        </main>
      )}

      {/* Footer */}
      <footer id="about">
        <p>© 2026 Hira Music Studio. Built for musicians.</p>
      </footer>

    </div>
  )
}

export default App
