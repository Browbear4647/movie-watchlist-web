class Movie {
  constructor(title, year, genreNames) {
    this.title = title;
    this.year = year;
    this.genres = Array.isArray(genreNames)
      ? genreNames.map((g) => g.trim()).filter((g) => g)
      : [];
    this.isWatched = false;
    this.id = Date.now() + Math.floor(Math.random() * 1000);
  }

  markAsWatched() {
    this.isWatched = true;
  }

  getInfo() {
    return `${this.title} (${this.year}) — ${this.genres.join(', ')}`;
  }
}

class Genre {
  constructor(name) {
    this.name = name;
  }
}

class Watchlist {
  constructor() {
    this.movies = [];
  }

  addMovie(title, year, genreNames) {
    const movie = new Movie(title, year, genreNames);
    this.movies.push(movie);
    this.saveToLocalStorage();
    return movie;
  }

  removeMovie(id) {
    this.movies = this.movies.filter((movie) => movie.id !== id);
    this.saveToLocalStorage();
  }

  updateMovie(id, newTitle, newYear, newGenres) {
    const movie = this.findMovieById(id);
    if (!movie) {
      return null;
    }

    movie.title = newTitle;
    movie.year = newYear;
    movie.genres = Array.isArray(newGenres)
      ? newGenres.map((genre) => genre.trim()).filter((genre) => genre)
      : movie.genres;

    this.saveToLocalStorage();
    return movie;
  }

  cleanTitle(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/^(the |a |an )/, '')
      .replace(/\s+/g, ' ');
  }

  findDuplicates(title, year) {
    const normalizedTitle = this.cleanTitle(title);

    return this.movies.filter((movie) => {
      const movieTitle = this.cleanTitle(movie.title);
      const yearDiff = Math.abs(movie.year - year);
      return movieTitle === normalizedTitle && yearDiff <= 1;
    });
  }

  suggestMovie() {
    const unwatched = this.getMoviesByStatus(false);
    if (unwatched.length === 0) {
      return null;
    }

    const watched = this.getMoviesByStatus(true);
    const genreCounts = {};

    watched.forEach((movie) => {
      movie.genres.forEach((genre) => {
        const key = genre.trim();
        if (!key) return;
        genreCounts[key] = (genreCounts[key] || 0) + 1;
      });
    });

    const sortedGenres = Object.keys(genreCounts).sort(
      (a, b) => genreCounts[b] - genreCounts[a]
    );

    for (const genre of sortedGenres) {
      const candidates = unwatched.filter((movie) =>
        movie.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
      );
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    return unwatched[Math.floor(Math.random() * unwatched.length)];
  }

  getAllGenreNames() {
    const genreSet = new Set();
    this.movies.forEach((movie) => {
      movie.genres.forEach((genre) => {
        const cleanGenre = genre.trim();
        if (cleanGenre) {
          genreSet.add(cleanGenre);
        }
      });
    });
    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }

  getMoviesByGenre(genreName) {
    const normalizedGenre = genreName.trim().toLowerCase();
    return this.movies.filter((movie) =>
      movie.genres.some((genre) => genre.toLowerCase() === normalizedGenre)
    );
  }

  addGenreToMovie(movieId, genreName) {
    const movie = this.findMovieById(movieId);
    if (!movie) {
      return false;
    }

    const newGenre = genreName.trim();
    if (!newGenre) {
      return false;
    }

    const exists = movie.genres.some(
      (genre) => genre.toLowerCase() === newGenre.toLowerCase()
    );
    if (!exists) {
      movie.genres.push(newGenre);
      this.saveToLocalStorage();
    }
    return true;
  }

  removeGenreFromMovie(movieId, genreName) {
    const movie = this.findMovieById(movieId);
    if (!movie) {
      return false;
    }

    const normalizedGenre = genreName.trim().toLowerCase();
    movie.genres = movie.genres.filter(
      (genre) => genre.toLowerCase() !== normalizedGenre
    );
    this.saveToLocalStorage();
    return true;
  }

  findMovieByTitle(searchTerm) {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return this.movies.find(
      (movie) => movie.title.trim().toLowerCase() === normalizedTerm
    ) || null;
  }

  findMovieById(id) {
    return this.movies.find((movie) => movie.id === id) || null;
  }

  getMoviesByStatus(watchedStatus) {
    if (watchedStatus === null || watchedStatus === undefined) {
      return this.movies;
    }

    return this.movies.filter((movie) => movie.isWatched === watchedStatus);
  }

  getMovieCount() {
    return this.movies.length;
  }

  getWatchedCount() {
    return this.movies.filter((movie) => movie.isWatched).length;
  }

  getUnwatchedCount() {
    return this.movies.filter((movie) => !movie.isWatched).length;
  }

  saveToLocalStorage() {
    localStorage.setItem('watchlistMovies', JSON.stringify(this.movies));
  }

  loadFromLocalStorage() {
    const savedData = localStorage.getItem('watchlistMovies');

    if (!savedData) {
      return;
    }

    try {
      const plainMovies = JSON.parse(savedData);
      this.movies = plainMovies.map((m) => {
        const movie = new Movie(m.title, m.year, m.genres || []);
        movie.isWatched = !!m.isWatched;
        movie.id = m.id || Date.now() + Math.floor(Math.random() * 1000);
        return movie;
      });
    } catch (error) {
      console.error('Failed to load watchlist from localStorage', error);
      this.movies = [];
    }
  }
}


    



