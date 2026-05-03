import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase'; 
// Observă că am înlocuit 'getDocs' cu 'onSnapshot'
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

function App() {
  const [query, setQuery] = useState('');
  const [movie, setMovie] = useState(null);
  const [watchlist, setWatchlist] = useState([]); 
  
  const apiKey = '42a9bb73'; 

  const searchMovie = async () => {
    if (!query) return;
    try {
      const response = await fetch(`https://www.omdbapi.com/?t=${query}&apikey=${apiKey}`);
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error("Eroare la preluarea datelor:", error);
    }
  };

  // --- REZOLVAREA ERORII: Citire în timp real (Real-time listener) ---
  useEffect(() => {
    // onSnapshot ascultă modificările din colecția "movies"
    const unsubscribe = onSnapshot(collection(db, "movies"), (snapshot) => {
      const moviesArray = [];
      snapshot.forEach((doc) => {
        moviesArray.push({ id: doc.id, ...doc.data() });
      });
      // Actualizăm starea o singură dată, la orice schimbare din baza de date
      setWatchlist(moviesArray); 
    });

    // Curățăm ascultătorul când închidem aplicația (good practice)
    return () => unsubscribe();
  }, []);

  // --- Funcțiile de scriere / ștergere devin mult mai simple ---
  const addToWatchlist = async () => {
    if (!movie) return;
    try {
      await addDoc(collection(db, "movies"), {
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster,
        rating: movie.imdbRating
      });
      alert("Film adăugat cu succes în Watchlist!");
      setMovie(null); 
      setQuery(''); 
      // Nu mai avem nevoie să apelăm manual preluarea datelor, onSnapshot o face automat!
    } catch (error) {
      console.error("Eroare la adăugare: ", error);
    }
  };

  const removeFromWatchlist = async (id) => {
    try {
      await deleteDoc(doc(db, "movies", id));
      // La fel, ștergerea declanșează automat onSnapshot, interfața se actualizează singură.
    } catch (error) {
      console.error("Eroare la ștergere: ", error);
    }
  };

  return (
    <div className="container">
      <h1>🎬 Movie Watchlist Inteligent</h1>
      
      <div className="search-box">
        <input 
          type="text" 
          placeholder="Caută un film (ex: Inception, Matrix)..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchMovie()}
        />
        <button onClick={searchMovie}>Caută</button>
      </div>

      {movie && movie.Response === "True" && (
        <div className="movie-card">
          <img src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=Fara+Poster"} alt={movie.Title} />
          <h2>{movie.Title} ({movie.Year})</h2>
          <p><strong>Rating IMDb:</strong> ⭐ {movie.imdbRating}</p>
          <p className="plot">{movie.Plot}</p>
          
          {parseFloat(movie.imdbRating) >= 8.0 ? (
            <div className="rec-good">🌟 Recomandare: Ar trebui să vizionezi acest film chiar acum!</div>
          ) : parseFloat(movie.imdbRating) <= 5.0 ? (
            <div className="rec-bad">⚠️ Recomandare: Ar fi bine să eviți acest film.</div>
          ) : (
            <div className="rec-neutral">🍿 Recomandare: Un film mediocru, vizionează-l dacă ai timp liber.</div>
          )}
          
          <button className="add-btn" onClick={addToWatchlist}>Adaugă în Watchlist</button>
        </div>
      )}

      {movie && movie.Response === "False" && (
        <p className="error">Nu am găsit niciun film cu acest nume. Încearcă din nou!</p>
      )}

      <div className="watchlist-section">
        <h2>🍿 Lista mea de vizionări</h2>
        {watchlist.length === 0 ? (
          <p>Lista este goală. Caută un film și adaugă-l!</p>
        ) : (
          <div className="watchlist-grid">
            {watchlist.map((item) => (
              <div key={item.id} className="watchlist-item">
                <img src={item.poster !== "N/A" ? item.poster : "https://via.placeholder.com/150x225?text=Fara+Poster"} alt={item.title} />
                <div className="item-details">
                  <h3>{item.title} ({item.year})</h3>
                  <p>⭐ {item.rating}</p>
                  <button className="delete-btn" onClick={() => removeFromWatchlist(item.id)}>✅ Vizionat (Șterge)</button>
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