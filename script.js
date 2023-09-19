'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;

navigator.geolocation.getCurrentPosition(
  function (position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    map = L.map('map').setView(coords, 13);

    L.tileLayer(
      'http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      },
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    //sets marker at your current location
    // L.marker(coords).addTo(map).bindPopup('Your current location').openPopup();
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    //adding click event on map
    map.on('click', function (mapE) {
      mapEvent = mapE;

      console.log(mapEvent);
      form.classList.remove('hidden');
      inputDistance.focus();
    });
  },
  function () {
    alert('Could not get position');
  }
);

form.addEventListener('submit', function (e) {
  e.preventDefault();

  //clearing input fields
  inputCadence.value = '';
  inputDistance.value = '';
  inputDuration.value = '';
  inputElevation.value = '';

  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      })
    )
    .setPopupContent('workout')
    .openPopup();
});

inputType.addEventListener('change', function (e) {
  console.log(e.target.value);
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});

inputDistance.addEventListener('onChange', function (e) {
  console.log(e.target.value);
});
