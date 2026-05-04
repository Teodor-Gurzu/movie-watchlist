import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';

function App() {
  const [query, setQuery] = useState('');
  const [movie, setMovie] = useState(null);
  const [watchlist, setWatchlist] = useState([]); 
  
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const apiKey = '42a9bb73'; 

  const searchMovie = async (searchTitle = query) => {
    if (!searchTitle) return;
    setShowSuggestions(false); 
    setQuery(searchTitle); 
    
    try {
      const response = await fetch(`https://www.omdbapi.com/?t=${searchTitle}&apikey=${apiKey}`);
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error("Eroare la preluarea datelor:", error);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=${apiKey}`);
        const data = await res.json();
        if (data.Search) {
          setSuggestions(data.Search.slice(0, 5)); 
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Eroare sugestii:", error);
      }
    };

    const timeoutId = setTimeout(() => fetchSuggestions(), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0) {
        searchMovie(suggestions[activeIndex].Title);
      } else {
        searchMovie();
      }
    } else if (e.key === 'ArrowUp') {
      if (activeIndex > 0) setActiveIndex(activeIndex - 1);
    } else if (e.key === 'ArrowDown') {
      if (activeIndex < suggestions.length - 1) setActiveIndex(activeIndex + 1);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "movies"), (snapshot) => {
      const moviesArray = [];
      snapshot.forEach((doc) => {
        moviesArray.push({ id: doc.id, ...doc.data() });
      });
      setWatchlist(moviesArray); 
    });
    return () => unsubscribe();
  }, []);

  const addToWatchlist = async () => {
    if (!movie) return;
    try {
      await addDoc(collection(db, "movies"), {
        title: movie.Title, 
        year: movie.Year, 
        poster: movie.Poster, 
        rating: movie.imdbRating,
        status: 'planned' // Setăm eticheta inițială
      });
      alert("Film planificat pentru vizionare!");
      setMovie(null); 
      setQuery(''); 
    } catch (error) { console.error(error); }
  };

  const removeFromWatchlist = async (id) => {
    try { await deleteDoc(doc(db, "movies", id)); } 
    catch (error) { console.error(error); }
  };

  // --- Functia de modificare status ---
  const markAsWatched = async (id) => {
    try {
      // updateDoc modifică DOAR câmpurile specificate
      await updateDoc(doc(db, "movies", id), {
        status: 'watched'
      });
    } catch (error) { console.error(error); }
  };

  const plannedMovies = watchlist.filter(m => !m.status || m.status === 'planned');
  const watchedMovies = watchlist.filter(m => m.status === 'watched');

  return (
    <div className="container">
      <h1>🎬 Movie Watchlist Inteligent</h1>
      
      <div className="search-box">
        <div className="input-wrapper">
          <input 
            type="text" 
            className="glowing-input" 
            placeholder="Caută un film (ex: Matrix)..." 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0); 
            }}
            onKeyDown={handleKeyDown}
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((item, index) => (
                <li 
                  key={item.imdbID} 
                  className={index === activeIndex ? "active" : ""}
                  onClick={() => searchMovie(item.Title)}
                >
                  {item.Title} ({item.Year})
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={() => searchMovie()}>Caută</button>
      </div>

      {movie && movie.Response === "True" && (
        <div className="movie-card">
          <img src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450"} alt={movie.Title} />
          <h2>{movie.Title} ({movie.Year})</h2>
          <p><strong>Rating IMDb:</strong> ⭐ {movie.imdbRating}</p>
          <p className="plot">{movie.Plot}</p>
          
          {parseFloat(movie.imdbRating) >= 8.0 ? (
            <div className="rec-good">🌟 Recomandare: Ar trebui să vizionezi!</div>
          ) : parseFloat(movie.imdbRating) <= 5.0 ? (
            <div className="rec-bad">⚠️ Recomandare: Mai bine eviți acest film.</div>
          ) : (
            <div className="rec-neutral">🍿 Recomandare: Un film mediocru.</div>
          )}
          <button className="add-btn" onClick={addToWatchlist}>Adaugă în Planificate</button>
        </div>
      )}

      {movie && movie.Response === "False" && (
        <p className="error">Nu am găsit niciun film cu acest nume.</p>
      )}

      <div className="watchlist-section">
        <h2 className="section-title">⏳ Planificate pentru vizionare</h2>
        {plannedMovies.length === 0 ? (
          <p className="empty-msg">Nu ai niciun film planificat.</p>
        ) : (
          <div className="watchlist-grid">
            {plannedMovies.map((item) => (
              <div key={item.id} className="watchlist-item">
                <img src={item.poster !== "N/A" ? item.poster : "https://via.placeholder.com/150"} alt={item.title} />
                <div className="item-details">
                  <h3>{item.title} ({item.year})</h3>
                  <p>⭐ {item.rating}</p>
                  <div className="action-buttons">
                    <button className="mark-btn" onClick={() => markAsWatched(item.id)}>✅ Vizionat</button>
                    <button className="delete-btn" onClick={() => removeFromWatchlist(item.id)}>🗑️ Șterge</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- NOU: Secțiunea Vizionate --- */}
      <div className="watchlist-section">
        <h2 className="section-title">✔️ Filme Vizionate</h2>
        {watchedMovies.length === 0 ? (
          <p className="empty-msg">Nu ai vizionat niciun film încă.</p>
        ) : (
          <div className="watchlist-grid">
            {watchedMovies.map((item) => (
              <div key={item.id} className="watchlist-item watched-card">
                <img src={item.poster !== "N/A" ? item.poster : "https://via.placeholder.com/150"} alt={item.title} />
                <div className="item-details">
                  <h3>{item.title} ({item.year})</h3>
                  <p>⭐ {item.rating}</p>
                  <button className="delete-btn" onClick={() => removeFromWatchlist(item.id)}>🗑️ Șterge din istoric</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default App;