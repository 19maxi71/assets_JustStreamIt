// Fetch best movie
function fetchBestMovie() {
    fetch("http://localhost:8000/api/v1/titles/?sort_by=-imdb_score")
        .then(response => response.json())
        .then(data => {
            const bestMovie = data.results[0];

            const titleElement = document.querySelector('#best-film-title');
            const imageElement = document.querySelector('#best-film-image');
            const descriptionElement = document.querySelector('#best-film-description');
            const openBestFilmModal = document.getElementById('openBestFilmModal');

            titleElement.textContent = bestMovie.title;
            imageElement.src = bestMovie.image_url;
            imageElement.setAttribute('data-id', bestMovie.id);
            openBestFilmModal.setAttribute('data-id', bestMovie.id);

            fetch(`http://localhost:8000/api/v1/titles/${bestMovie.id}`)
                .then(response => response.json())
                .then(movieData => {
                    descriptionElement.textContent = movieData.description || "Description absente";
                })
                .catch(error => console.error('Error:', error));
        })
        .catch(error => console.error('Error:', error));
}


// Function to fetch all categories from API
function fetchAllCategories(pageNumber = 1, accumulatedCategories = []) {
    fetch(`http://localhost:8000/api/v1/genres/?page=${pageNumber}`)
        .then(response => response.json())
        .then(data => {
            const categories = data.results;
            const allCategories = accumulatedCategories.concat(categories);

            if (data.next) {
                // If there is a next page, make a recursive call with accumulated categories
                fetchAllCategories(pageNumber + 1, allCategories);
            } else {
                // If there are no more pages, call populateCategoryList with all accumulated categories
                populateCategoryList(allCategories);
            }
        })
        .catch(error => console.error('Error:', error));
}


// Function to populate the category dropdown lists
function populateCategoryList(categories) {
    for (let i = 1; i <= 2; i++) {
        const selectElement = document.getElementById(`categorySelect${i}`);
        selectElement.innerHTML = '<option value="">Sélectionnez une catégorie</option>';

        if (categories.length > 0) {
            let i = 0;
            while (i < categories.length) {
                const option = document.createElement('option');
                option.value = categories[i].name;
                option.textContent = categories[i].name;
                selectElement.appendChild(option);
                i++;
            }
        }
    }
}


// Function to create a movie grid
function createMovieList(section, films) {
    section.innerHTML = ''; // efface le contenu de la section avant de la remplir
  
    films.forEach(movie => {
      const movieDiv = document.createElement('div');
      movieDiv.className = 'col-12 col-md-6 col-lg-4 mb-3 box';
      movieDiv.innerHTML = `
          <div class="movie position-relative">
              <img src="${movie.image_url}" alt="${movie.title}" class="img-fluid" data-id="${movie.id}" data-toggle="modal" data-target="#bestFilmModal"></img>
              <div class="movie-banner">
                  <h1 class="movie-title">${movie.title}</h1>
                  <button class="details_button btn btn-dark btn-sm" data-id="${movie.id}">Détails</button>
              </div>
          </div>
      `;
      section.appendChild(movieDiv);
    });
  
    section.querySelectorAll('.details_button').forEach(button => {
      button.addEventListener('click', function() {
        const movieId = this.getAttribute('data-id');
        openModal(movieId);
      });
    });

    section.querySelectorAll('.img-fluid').forEach(image => {
        image.addEventListener('click', function() {
            const movieId = this.getAttribute('data-id');
            openModal(movieId);
        });
    });
}


// Function to fetch movies by category
function fetchCategoryMovies(category, sectionId) {
    let allFilms = []; // Étape 1: Initialiser allFilms

    fetch(`http://localhost:8000/api/v1/titles/?genre=${category}&sort_by=-imdb_score`)
        .then(response => response.json())
        .then(data => {
            allFilms = allFilms.concat(data.results); // Étape 2: Ajouter les films de la première page à allFilms

            // Vérifier s'il y a une deuxième page
            if (data.next) {
                fetch(data.next) // Utiliser l'URL de la prochaine page directement
                    .then(response => response.json())
                    .then(data => {
                        const nextFilm = data.results[0]; // Prendre uniquement le premier film de la deuxième page
                        allFilms.push(nextFilm); // Ajouter ce film à allFilms

                        const section = document.querySelector(sectionId);
                        if (!section) {
                            console.error(`L'élément avec l'ID ${sectionId} n'existe pas.`);
                            return;
                        }

                        createMovieList(section, allFilms); // Appeler createMovieList ici
                    })
                    .catch(error => console.error('Error:', error));
            } else {
                // S'il n'y a pas de deuxième page, appeler directement createMovieList
                const section = document.querySelector(sectionId);
                if (!section) {
                    console.error(`L'élément avec l'ID ${sectionId} n'existe pas.`);
                    return;
                }

                createMovieList(section, allFilms);
            }
        })
        .catch(error => console.error('Error:', error));
}

    
// Function to initialize category movies
function initCategoryMovies() {
    fetchCategoryMovies('mystery', '#sectionMystery');
    fetchCategoryMovies('action', '#sectionAction');
    fetchCategoryMovies('adventure', '#sectionAdventure');
}


// Function to open the modal with movie details
function openModal(movieId) {
    const filmDetailsContent = document.getElementById('filmDetailsContent');
    const bestFilmModalLabel = document.getElementById('bestFilmModalLabel');

    fetch(`http://localhost:8000/api/v1/titles/${movieId}`)
        .then(response => response.json())
        .then(movieData => {
            bestFilmModalLabel.innerHTML = `
                <h2><strong>${movieData.title}</strong></h2>
            `;
            filmDetailsContent.innerHTML = `
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-sm-12 col-md-6 col-lg-6">
                            <p class="modal-text1"><strong>${movieData.year}</strong> - <strong>${movieData.genres.join('/')}</strong></p>
                            <p class="modal-text1"><strong>${movieData.rated}</strong> - <strong>${movieData.duration} min </strong> - <strong>(${movieData.countries.join('/')})</strong></p>
                            <p class="modal-text1"><strong>IMDB score:</strong> ${movieData.imdb_score}/10</p>
                            <p class="modal-text"><strong>Réalisé par:</strong> <br>${movieData.directors.join(', ')}</br></p>
                            <p class="modal-text">${movieData.long_description || "Description absente"}</p>
                        </div>
                        <div class="col-sm-12 col-md-6 col-lg-6">
                            <img src="${movieData.image_url}" alt="${movieData.title}" class="img-fluid" id="film-logo">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <p class="modal-text"><strong>Avec: </strong> <br>${movieData.actors.join(', ')}</br></p>
                        </div>
                    </div>
                </div>
            `;
            const bootstrapModal = new bootstrap.Modal(document.getElementById('bestFilmModal'));
            bootstrapModal.show();
        })
        .catch(error => console.error('Error:', error));
}

for (let i = 1; i <= 2; i++) {
    const categorySelect = document.getElementById(`categorySelect${i}`);
    categorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        const sectionId = `#sectionAutre${i}`;
        fetchCategoryMovies(selectedCategory, sectionId);
    });
    
}


// Function for button to show more movies
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.showMoreBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Sélectionner la section précédant immédiatement le bouton
            const section = btn.previousElementSibling;
            // Sélectionner uniquement les .box dans cette section
            const boxes = section.querySelectorAll('.box');
            boxes.forEach(box => {
                if (box.style.display === 'none' || window.getComputedStyle(box).display === 'none') {
                    box.style.display = 'flex';
                }
            });
            // Vérifier si tous les .box dans la section sont visibles
            const allBoxesVisible = Array.from(boxes).every(box => 
                box.style.display === 'flex' || window.getComputedStyle(box).display === 'flex'
            );
            if (allBoxesVisible) {
                btn.style.display = 'none'; // Cacher le bouton si tous les .box dans la section sont visibles
            }
        });
    });
});



window.addEventListener('DOMContentLoaded', () => {
    fetchAllCategories();
    fetchBestMovie();
    initCategoryMovies();

    // doublon juste pour l'image de la meilleure film, sinon marche pas
    document.querySelectorAll('.details_button').forEach(button => {
        button.addEventListener('click', function() {
            const movieId = this.getAttribute('data-id');
            openModal(movieId);
        });
    });

    document.querySelectorAll('.img-fluid').forEach(image => {
        image.addEventListener('click', function() {
            const movieId = this.getAttribute('data-id');
            openModal(movieId);
        });
    });

});


// HIDE BOUTON 'VOIR PLUS' POUR LES CATEGORIES 'AUTREs'

document.addEventListener('DOMContentLoaded', function() {
    const showMoreButtons = document.querySelectorAll('.showMoreBtn');

    showMoreButtons.forEach(button => {
        const section = button.previousElementSibling;

        if (section && section.classList.contains('movies-grid')) {
            // Function to check the number of movies
            const checkMovies = () => {
                const numberOfMovies = section.children.length;
                console.log('Number of movies:', numberOfMovies);

                if (numberOfMovies > 0) {
                    button.style.display = 'block';
                    console.log('Button displayed');
                } else {
                    button.style.display = 'none';
                    console.log('Button hidden');
                }
            };

            // Initial check
            checkMovies();

            // Set up MutationObserver to watch for changes
            const observer = new MutationObserver(checkMovies);
            observer.observe(section, { childList: true });

        } else {
            console.log('No movies-grid section found or section has no children');
        }
    });
});
