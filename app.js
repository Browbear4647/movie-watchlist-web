const titleInput = document.getElementById('titleInput');
const yearInput = document.getElementById('yearInput');
const genresInput = document.getElementById('genresInput');
const addForm = document.getElementById('addForm');
const addBtn = document.getElementById('addBtn');
const showAllBtn = document.getElementById('showAllBtn');
const showWatchedBtn = document.getElementById('showWatchedBtn');
const showUnwatchedBtn = document.getElementById('showUnwatchedBtn');
const suggestBtn = document.getElementById('suggestBtn');
const genreFilters = document.getElementById('genreFilters');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const movieList = document.getElementById('movieList');
const message = document.getElementById('message');
let activeGenre = '';

const watchlist = new Watchlist();
watchlist.loadFromLocalStorage();

if (watchlist.movies.length === 0) {
  watchlist.addMovie('Inception', 2010, ['Sci-Fi', 'Thriller']);
  watchlist.addMovie('The Matrix', 1999, ['Sci-Fi', 'Action']);
  watchlist.addMovie('Titanic', 1997, ['Romance', 'Drama']);
}

function normalizeGenres(genresString) {
  return genresString
    .split(',')
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0);
}

function setActiveFilter(button) {
  document.querySelectorAll('.btn-filter').forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
}

function renderGenres(genres) {
  if (!genres || genres.length === 0) {
    return '<span class="genre-tag">No genres</span>';
  }

  return genres.map((genre) => `<span class="genre-tag">${genre}</span>`).join('');
}

function renderGenreFilters() {
  if (!genreFilters) {
    return;
  }

  genreFilters.innerHTML = '';
  const genres = watchlist.getAllGenreNames();

  if (genres.length === 0) {
    genreFilters.innerHTML = '<span class="genre-tag">No genres yet</span>';
    return;
  }

  genres.forEach((genre) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = genre;
    button.className = 'genre-btn';
    if (activeGenre === genre) {
      button.classList.add('active');
    }
    button.addEventListener('click', () => {
      activeGenre = activeGenre === genre ? '' : genre;
      document.querySelectorAll('.btn-filter').forEach((btn) => btn.classList.remove('active'));
      renderGenreFilters();

      if (activeGenre) {
        displayMovies(watchlist.getMoviesByGenre(activeGenre));
        showMessage(`Filtering by genre: ${activeGenre}`);
      } else {
        displayMovies(watchlist.movies);
        showMessage('Showing all movies.');
      }
    });
    genreFilters.appendChild(button);
  });
}

function displayMovies(moviesArray) {
  movieList.innerHTML = '';

  if (!moviesArray || moviesArray.length === 0) {
    movieList.innerHTML = '<p class="empty-message">No movies found.</p>';
    return;
  }

  moviesArray.forEach((movie) => {
    const card = document.createElement('div');
    card.className = `movie-card ${movie.isWatched ? 'watched' : 'unwatched'}`;

    card.innerHTML = `
      <div class="movie-header">
        <h3>${movie.title}</h3>
        <span class="status-pill">${movie.isWatched ? '✓ Watched' : '○ Unwatched'}</span>
      </div>
      <p class="movie-year">Year: ${movie.year || 'Unknown'}</p>
      <div class="movie-genres">${renderGenres(movie.genres)}</div>
      <div class="movie-actions">
        <button class="btn btn-action watch-btn" data-id="${movie.id}">
          ${movie.isWatched ? 'Mark Unwatched' : 'Mark Watched'}
        </button>
        <button class="btn btn-action delete-btn" data-id="${movie.id}">Delete</button>
      </div>
    `;

    movieList.appendChild(card);
  });
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? 'message error' : 'message success';

  clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = setTimeout(() => {
    message.textContent = '';
    message.className = 'message';
  }, 3000);
}

function saveAndRender() {
  watchlist.saveToLocalStorage();
  displayMovies(watchlist.movies);
}

addBtn.addEventListener('click', () => {
  const title = titleInput.value.trim();
  const year = Number(yearInput.value.trim());
  const genres = normalizeGenres(genresInput.value);
  const currentYear = new Date().getFullYear();

  if (!title) {
    showMessage('Title cannot be empty.', true);
    return;
  }

  if (!year || year < 1888 || year > currentYear) {
    showMessage(`Year must be between 1888 and ${currentYear}.`, true);
    return;
  }

  if (genres.length === 0) {
    showMessage('Please enter at least one genre.', true);
    return;
  }

  const duplicates = watchlist.findDuplicates(title, year);
  if (duplicates.length > 0) {
    const duplicateText = duplicates
      .map((movie) => `${movie.title} (${movie.year})`)
      .join('\n');

    const addAnyway = window.confirm(
      `⚠️ Possible duplicate found:\n${duplicateText}\n\nPress OK to add anyway, Cancel to update the existing duplicate.`
    );

    if (!addAnyway) {
      const updateExisting = window.confirm(
        'Update existing duplicate movie with new genres? Press OK to update, Cancel to skip.'
      );

      if (updateExisting) {
        watchlist.updateMovie(duplicates[0].id, title, year, genres);
        showMessage(`Updated existing duplicate: ${duplicates[0].title}`);
        addForm.reset();
        renderGenreFilters();
        saveAndRender();
        return;
      }

      showMessage('Movie addition canceled.');
      return;
    }
  }

  watchlist.addMovie(title, year, genres);
  showMessage(`Added "${title}" to your watchlist.`);
  addForm.reset();
  setActiveFilter(showAllBtn);
  saveAndRender();
});

showAllBtn.addEventListener('click', function () {
  activeGenre = '';
  renderGenreFilters();
  setActiveFilter(this);
  displayMovies(watchlist.getMoviesByStatus(null));
});

showWatchedBtn.addEventListener('click', function () {
  activeGenre = '';
  renderGenreFilters();
  setActiveFilter(this);
  displayMovies(watchlist.getMoviesByStatus(true));
});

showUnwatchedBtn.addEventListener('click', function () {
  activeGenre = '';
  renderGenreFilters();
  setActiveFilter(this);
  displayMovies(watchlist.getMoviesByStatus(false));
});

suggestBtn.addEventListener('click', () => {
  const suggestion = watchlist.suggestMovie();
  if (!suggestion) {
    showMessage('No movies to suggest right now.', true);
    return;
  }

  displayMovies([suggestion]);
  showMessage(`Suggested: ${suggestion.title} (${suggestion.year})`);
});

searchBtn.addEventListener('click', () => {
  const term = searchInput.value.trim();

  if (!term) {
    showMessage('Please enter a search term.', true);
    return;
  }

  const movie = watchlist.findMovieByTitle(term);

  if (!movie) {
    showMessage(`Movie "${term}" not found.`, true);
    displayMovies([]);
    return;
  }

  displayMovies([movie]);
});

searchInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchBtn.click();
  }
});

movieList.addEventListener('click', (event) => {
  const id = Number(event.target.dataset.id);
  if (!id) {
    return;
  }

  if (event.target.classList.contains('watch-btn')) {
    const movie = watchlist.findMovieById(id);
    if (movie) {
      movie.isWatched = !movie.isWatched;
      saveAndRender();
      showMessage(`${movie.title} is now ${movie.isWatched ? 'watched' : 'unwatched'}.`);
    }
    return;
  }

  if (event.target.classList.contains('delete-btn')) {
    const movie = watchlist.findMovieById(id);
    if (movie) {
      watchlist.removeMovie(id);
      saveAndRender();
      showMessage(`Deleted "${movie.title}" from the watchlist.`);
    }
  }
});

setActiveFilter(showAllBtn);
renderGenreFilters();
displayMovies(watchlist.movies);
showMessage('Welcome to your Movie Watchlist! 🎬');
