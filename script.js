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

navigator.geolocation.getCurrentPosition(
  function (position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    let map = L.map('map').setView(coords, 13);

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

    L.marker(coords).addTo(map).bindPopup('Your current location').openPopup();
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    //adding click event on map
    map.on('click', function (mapEvent) {
      const { lat, lng } = mapEvent.latlng;
      console.log(mapEvent);
      L.marker([lat, lng]).addTo(map).bindPopup('workout').openPopup();
    });
  },
  function () {
    alert('Could not get position');
  }
);
