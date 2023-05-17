import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios, { isCancel, AxiosError } from 'axios';

(() => {
  const galleryPixaBay = {
    formBind: document.querySelector('.search-form'),
    loadMoreBtn: document.querySelector('.load-more'),
    galleryArea: document.querySelector('.gallery'),
    instanceSimpleLightbox: {},
    searchedData: '',
    searchString: '',
    pagination: 1,
    galleryClickHandler: function (event) {
      event.preventDefault();
      if (event.target.nodeName !== 'IMG') {
        return;
      }
      this.instanceSimpleLightbox.on('error.simplelightbox', function (e) {
        Notiflix.Notify.failure(`${e}`);
      });
    },
    galleryDisplay: function (loadMore) {
      if (loadMore) {
        Notiflix.Notify.success('Adding pictures...');
      } else {
        Notiflix.Notify.success('Creating gallery...');
      }
      let galleryItem = [];
      for (const image of this.searchedData.hits) {
        const {
          webformatURL,
          largeImageURL,
          tags,
          likes,
          views,
          comments,
          downloads,
        } = image;
        galleryItem.push(`
        <div class="photo-card">
        <div class="gallery__pictureholder">
        <a  href="${largeImageURL}">
        <img class="gallery__picture" src="${webformatURL}" alt="${
          tags + ' - from pixabay'
        }" loading="lazy" />
        </a>
        </div>
        <div class="info">
          <p class="info-item">
            <b>Likes</b><span>${likes}</span>
          </p>
          <p class="info-item">
            <b>Views</b><span>${views}</span>
          </p>
          <p class="info-item">
            <b>Comments</b><span>${comments}</span>
          </p>
          <p class="info-item">
            <b>Downloads</b><span>${downloads}</span>
          </p>
        </div>
      </div>
        `);
      }
      let galleryToPublish = galleryItem.map(image => image).join(''); //building one string from array
      this.galleryArea.insertAdjacentHTML('beforeend', galleryToPublish); //adding elements to ul
      if (loadMore) {
        const { height: cardHeight } = document
          .querySelector('.gallery')
          .firstElementChild.getBoundingClientRect();
        window.scrollBy({
          top: cardHeight * 3,
          behavior: 'smooth',
        });
      }
      this.instanceSimpleLightbox.refresh();
    },
    apiRestAxios: function (searchString, pagination, loadMore = false) {
      let searchedDataLocal = {};
      let pointerObj = this;
      getData();
      async function getData() {
        try {
          const response = await axios(
            {
              method: 'get',
              baseURL: 'https://pixabay.com/api',
              params: {
                key: '34529652-cc8793dd1496f54354573213f',
                image_type: 'photo',
                orientation: 'horizontal',
                safesearch: true,
                per_page: 40,
                page: pagination,
                q: searchString,
              },
            },
            { signal: AbortSignal.timeout(5000) }
          );
          if (response.data.hits.length !== 0) {
            searchedDataLocal = response.data;
          } else {
            searchedDataLocal = -1;
          }
          if (searchedDataLocal === -1 && !loadMore) {
            Notiflix.Notify.info(
              'Sorry, there are no images matching your search query. Please try again.'
            );
          } else if (searchedDataLocal === -1 && loadMore) {
            pointerObj.loadMoreBtn.style.display = 'none';
            Notiflix.Notify.info(
              "We're sorry, but you've reached the end of search results."
            );
          } else {
            pointerObj.searchedData = searchedDataLocal;
            if (pagination < 13) {
              pointerObj.loadMoreBtn.style.display = '';
            }
            if (pagination === 1) {
              Notiflix.Notify.success(
                `Hooray! We found ${pointerObj.searchedData.totalHits} images.`
              );
            }
            pointerObj.galleryDisplay(loadMore);
          }
        } catch (error) {
          const errorMn = error.toJSON();
          Notiflix.Notify.failure(`${errorMn}`);
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            Notiflix.Notify.failure(`${error.response.data}`);
            Notiflix.Notify.failure(`${error.response.status}`);
            Notiflix.Notify.failure(`${error.response.headers}`);
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            Notiflix.Notify.failure(`${error.request}`);
          } else {
            // Something happened in setting up the request that triggered an Error
            Notiflix.Notify.failure(`Error ${error.message}`);
          }
          Notiflix.Notify.failure(`${error.config}`);
        }
      }
    },
    formSubmit: function (event) {
      event.preventDefault();
      this.loadMoreBtn.style.display = 'none';
      if (event.currentTarget.searchQuery.value !== '') {
        Notiflix.Notify.info('Submitting...');
        if (this.galleryArea.hasChildNodes()) {
          this.galleryArea.replaceChildren();
        }
        this.pagination = 1;
        this.searchString = event.currentTarget.searchQuery.value;
        this.apiRestAxios(this.searchString, this.pagination);
      } else {
        Notiflix.Notify.failure(
          'There is nothing to search. Write something in search field'
        );
      }
    },
    loadMorePictures: function () {
      Notiflix.Notify.info('Loading more pictures...');
      this.pagination++;
      if (this.pagination === 13) {
        this.loadMoreBtn.style.display = 'none';
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
      }
      this.apiRestAxios(this.searchString, this.pagination, true);
    },
    init: function () {
      this.loadMoreBtn.style.display = 'none';
      this.instanceSimpleLightbox = new SimpleLightbox('.gallery a', {
        captionsData: 'alt',
        captionDelay: '250',
      });
      this.formBind.addEventListener(
        'submit',
        function (event) {
          this.formSubmit(event);
        }.bind(this)
      );
      this.loadMoreBtn.addEventListener(
        'click',
        function () {
          this.loadMorePictures();
        }.bind(this)
      );
      this.galleryArea.addEventListener(
        'click',
        function (event) {
          this.galleryClickHandler(event);
        }.bind(this)
      );
      window.addEventListener(
        'scroll',
        function () {
          if (
            window.innerHeight + window.scrollY >=
            document.body.offsetHeight
          ) {
            if (this.pagination === 13) {
              this.loadMoreBtn.style.display = 'none';
              Notiflix.Notify.info(
                "We're sorry, but you've reached the end of search results."
              );
              return;
            }
            this.loadMorePictures();
          }
        }.bind(this)
      );
    },
  };
  galleryPixaBay.init();
})();

//---------------------------------------------------------------------------------------

// https://axios-http.com/
// https://github.com/axios/axios
// https://axios-http.com/docs/intro
// https://github.com/notiflix/Notiflix#readme
// https://pixabay.com/api/docs/
// https://github.com/search?q=pixabay
// https://simplelightbox.com/

// Zadanie - wyszukiwanie obrazów
// Utwórz frontend aplikacji wyszukiwania i przeglądania obrazków według słów kluczowych. Popraw wizualnie elementy interfejsu. Obejrzyj wersję demonstracyjną wideo o działaniu aplikacji.

// Formularz wyszukiwania
// Formularz początkowo znajduje się w dokumencie HTML. Użytkownik będzie wprowadzał treść, którą chce wyszukać, w pole tekstowe, a po wysłaniu formularza koniecznym jest spełnienie żądania HTTP.

// <form class="search-form" id="search-form">
//   <input
//     type="text"
//     name="searchQuery"
//     autocomplete="off"
//     placeholder="Search images..."
//   />
//   <button type="submit">Search</button>
// </form>

// Żądania HTTP
// Jako backendu używaj publicznego API serwisu Pixabay. Zarejestruj się, otrzymaj swój unikalny klucz dostępu i zapoznaj się z dokumentacją.

// Lista parametrów treści żądania, które należy podać:

// - key - Twój unikalny klucz dostępu do API.
// -q - termin, który chce się wyszukać. To, co będzie wpisywał użytkownik.
// - image_type - typ obrazka. Chcemy tylko zdjęć, dlatego określ wartość photo.
// - orientation - orientacja zdjęcia. Określ wartość horizontal.
// - safesearch - weryfikacja wieku. Określ wartość true.

// W odpowiedzi pojawi się tablica obrazów odpowiadających kryteriom parametrów żądania. Każdy obraz opisany jest obiektem, z których interesują cię tylko następujące właściwości:

// webformatURL - link do małego obrazka.
// largeImageURL - link do dużego obrazka.
// tags - wiersz z opisem obrazka. Będzie pasować do atrybutu alt.
// likes - liczba lajków.
// views - liczba wyświetleń.
// comments - liczba komentarzy.
// downloads - liczba pobrań.

// Jeśli backend przekazuje pustą tablicę, oznacza to, że nic odpowiedniego nie znaleziono. W takim wypadku pokaż powiadomienie o treści "Sorry, there are no images matching your search query. Please try again.". Do powiadomień używaj biblioteki notiflix.

// Galeria i obraz karty
// Element div.gallery znajduje się początkowo w dokumencie HTML, należy wykonać w nim znacznik obrazu karty. Przy wyszukiwaniu według nowego słowa kluczowego, należy całkowicie wyczyścić zawartość galerii, aby nie mieszać wyników.

// <div class="gallery">
//   <!-- Obraz karty -->
// </div>

// Szablon znacznika karty jednego obrazka do galerii.

// <div class="photo-card">
//   <img src="" alt="" loading="lazy" />
//   <div class="info">
//     <p class="info-item">
//       <b>Likes</b>
//     </p>
//     <p class="info-item">
//       <b>Views</b>
//     </p>
//     <p class="info-item">
//       <b>Comments</b>
//     </p>
//     <p class="info-item">
//       <b>Downloads</b>
//     </p>
//   </div>
// </div>

// Paginacja
// Pixabay API podtrzymuje paginację i dostarcza parametry page i per_page. Zrób tak, aby w każdej odpowiedzi pojawiało się po 40 obiektów (domyślnie 20).

// Początkowo wartość parametru page powinna wynosić 1.
// Przy każdym kolejnym żądaniu, koniecznym jest zwiększenie wartości o 1.
// Przy wyszukiwaniu według nowego słowa kluczowego wartość page należy cofnąć do początkowego stanu, ponieważ będzie miała miejsce paginacja według nowej kolekcji obrazków.

// W dokumencie HTML istnieje już znacznik przycisku, po kliknięciu którego koniecznym jest spełnienie żądania według następnej grupy obrazków i dodanie znacznika do już istniejących elementów galerii.

// Początkowo przycisk powinien być ukryty.
// Po pierwszym żądaniu przycisk pojawia się w interfejsie pod galerią.
// Po ponownym wysłaniu formularza przycisk najpierw się ukrywa, a po spełnieniu żądania ponownie się wyświetla.

// W odpowiedzi backend przekazuje właściwość totalHits - wspólną liczbę obrazków, które odpowiadają kryteriom wyszukiwania (dla bezpłatnego konta). Jeśli użytkownik doszedł do końca kolekcji, ukryj przycisk i pokaż powiadomienie o treści "We're sorry, but you've reached the end of search results.".

// Dodatkowo
// UWAGA
// Następna funkcja nie jest obowiązkowa przy oddawaniu zadania, ale będzie dobrą dodatkową praktyką.

// Powiadomienie
// Po pierwszym żądaniu przy każdym nowym wyszukiwaniu pokaż powiadomienie, w którym będzie napisane ile w sumie znaleziono obrazków (właściwość totalHits). Tekst powiadomienia "Hooray! We found totalHits images."

// Biblioteka SimpleLightbox
// Dodaj funkcję wyświetlania większej wersji obrazka z biblioteką SimpleLightbox.

// W znaczniku trzeba będzie zamienić każdy obraz karty w link, tak jak pokazano w dokumentacji.
// Biblioteka zawiera metodę refresh() którą trzeba koniecznie zrealizować za każdym razem po dodaniu nowej grupy obrazów karty.
// Aby połączyć kod CSS biblioteki z projektem, koniecznym jest dodanie jeszcze jednego importu, oprócz tego opisanego w dokumentacji.

// // Opisany w dokumentacji
// import SimpleLightbox from "simplelightbox";
// // Dodatkowy import stylów
// import "simplelightbox/dist/simple-lightbox.min.css";

// Przewijanie strony
// Stwórz płynne przewijanie strony po spełnieniu żądania i po renderowaniu każdej następnej grupy obrazków. Oto kod-wskazówka, uporaj się z nią samodzielnie.

// const { height: cardHeight } = document
//   .querySelector(".gallery")
//   .firstElementChild.getBoundingClientRect();

// window.scrollBy({
//   top: cardHeight * 2,
//   behavior: "smooth",
// });

// Nieskończone przewijanie
// Zamiast przycisku «Load more» można zrobić nieskończone przewijanie obrazów podczas przewijania strony. Zapewniamy Ci pełną swobodę w realizacji, możesz użyć dowolnej biblioteki.
