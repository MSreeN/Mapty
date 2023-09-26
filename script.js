'use strict';

// prettier-ignore
const months = [
  'January','February','March','April','May','June','July','August','September','October','November','December',
];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let workout;

let map, mapEvent;

class Workout {
  date = new Date();
  id = (new Date().getTime() + ' ').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([1, 2], 5, 10, 5);
// const cyc1 = new Cycling([1, 2], 5, 10, 5);
// console.log(run1, cyc1);

///////////////Application architecture;
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //get users position
    this._getPosition();

    //get data form local storage
    this._getLocalStorage();

    //attaching event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get position');
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

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
    ).addTo(this.#map);

    //sets marker at your current location
    // L.marker(coords).addTo(map).bindPopup('Your current location').openPopup();
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    //adding click event on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    console.log(this);
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    form.style.display = 'grid';
  }

  _toggleElevationField(e) {
    // console.log(e.target.value);
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) => inputs.every(ip => Number.isFinite(ip));

    const allPositive = (...inputs) => inputs.every(ip => ip >= 0);

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    //Check if data is valid

    //If activity running, create running object
    if (type == 'running') {
      console.log('running');
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs has to be number');

      workout = new Running(this.#mapEvent.latlng, distance, duration, cadence);
    }
    //If activity cycling, create cycling object
    if (type == 'cycling') {
      console.log('cycling');
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs has to be number');
      workout = new Cycling(this.#mapEvent.latlng, distance, duration);
    }
    // Add new object to workout array
    this.#workouts.unshift(workout);
    // console.log(workout);

    //Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout on list
    this._renderWorkout(workout);

    //Hide form and clear input fields
    this._hideForm();

    //clearing input fields
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';

    //set local storage storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
       <h2 class="workout__title"${workout.description}</h2>
       <div class="workout__details">
         <span class="workout__icon">${
           workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
         }</span>
         <span class="workout__value">${workout.distance}</span>
         <span class="workout__unit">km</span>
       </div>
       <div class="workout__details">
         <span class="workout__icon">⏱</span>
         <span class="workout__value">${workout.duration}</span>
         <span class="workout__unit">min</span>
       </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
       <span class="workout__icon">⚡️</span>
       <span class="workout__value">${workout.pace.toFixed(1)}</span>
       <span class="workout__unit">km/h</span>
     </div>
     <div class="workout__details">
       <span class="workout__icon">🦶🏼</span>
       <span class="workout__value">${workout.cadence}</span>
       <span class="workout__unit">m</span>
     </div>
   </li> `;

    if (workout.type == 'cycling')
      html += ` <div class="workout__details">
   <span class="workout__icon">⚡️</span>
   <span class="workout__value">${workout.speed.toFixed(1)}</span>
   <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
   <span class="workout__icon">⛰</span>
   <span class="workout__value">${workout.elevationGain}</span>
   <span class="workout__unit">m</span>
  </div>
  </li> -->`;

    form.insertAdjacentHTML('afterend', html);
    // console.log(workout);
    // console.log(workout.type);
  }

  _moveToPopup(e) {
    const ele = e.target.closest('.workout');
    console.log(this);
    const workoutId = ele?.dataset.id;
    const clickedWorkout = this.#workouts.find(
      workout => workout.id === workoutId
    );
    console.log(clickedWorkout);
    if (!clickedWorkout) return;
    this.#map.setView(clickedWorkout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    this.#workouts = JSON.parse(localStorage.getItem('workouts'));
    this.#workouts.forEach(workout => this._renderWorkout(workout));
  }
}

//creating obj from App class

const app = new App();
