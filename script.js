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
const cancel = document.querySelector('.cancel');
const saveBtn = document.querySelector('.save');
const optionsBtn = document.querySelector('.option_buttons');
const submitBtn = document.querySelector('.submit_btn');
const modal = document.querySelector('.modal');
const overlay = document.querySelector('.overlay');
let editIcon;

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
    console.log(form);
    //get users position
    this._getPosition();

    //get data form local storage
    this._getLocalStorage();

    //attaching event handlers
    // form.addEventListener('submit', this._newWorkout.bind(this));
    submitBtn.addEventListener('click', this._newWorkout.bind(this));
    // modal.addEventListener('click', this._modalHandler.bind(this));

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
    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }

  _showForm(mapE) {
    cancel.classList.add('cancel_hidden');
    saveBtn.classList.add('cancel_hidden');
    submitBtn.classList.remove('cancel_hidden');
    this._clearFormFields();
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

  _areInputsValidated(...inputs) {
    const validInputs = inputs.every(ip => Number.isFinite(ip) && ip > 0);

    // const allPositive = inputs.every(ip => ip > 0);
    // console.log(allPositive, 'allpositive');
    console.log(validInputs, 'validinputs');

    return validInputs;
  }

  _newWorkout(e) {
    e.preventDefault();
    console.log('from newWorkout method');

    // const validInputs = (...inputs) => inputs.every(ip => Number.isFinite(ip));

    // const allPositive = (...inputs) => inputs.every(ip => ip > 0);

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    //Check if data is valid

    //If activity running, create running object
    if (type == 'running') {
      console.log('running');
      const cadence = +inputCadence.value;
      if (!this._areInputsValidated(distance, duration, cadence))
        return alert('Inputs has to be number');

      console.log(duration, cadence, distance, 'checking');
      workout = new Running(this.#mapEvent.latlng, distance, duration, cadence);
    }
    //If activity cycling, create cycling object
    if (type == 'cycling') {
      console.log('cycling');
      const elevation = +inputElevation.value;
      if (!this._areInputsValidated(distance, duration, elevation))
        return alert('Inputs has to be number');
      // prettier-ignore
      workout = new Cycling(this.#mapEvent.latlng, distance, duration, elevation);
    }
    // Add new object to workout array
    this.#workouts.push(workout);
    // console.log(workout);

    //Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout on list
    this._renderWorkout(workout);

    //Hide form and clear input fields
    this._hideForm();

    //clearing input fields
    this._clearFormFields();

    //set local storage storage to all workouts
    this._setLocalStorage();
    console.log(workout);
  }
  _clearFormFields() {
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';
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
    <ion-icon class="edit-icon" name="create-outline"></ion-icon>
    <ion-icon class="delete-icon" name="trash-outline"></ion-icon>
       <h2 class="workout__title"$>${workout.description}</h2>
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
      <span class="workout__value">${
        workout.pace ? workout.pace.toFixed(1) : '-'
      }</span>
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
  </li>`;

    optionsBtn.insertAdjacentHTML('afterend', html);
    // console.log(workout);
    // console.log(workout.type);
    editIcon = document.querySelectorAll('.edit-icon');
    // console.log('from render workout method');
    // editIcon.forEach(icon => {
    //   icon.removeEventListener('click', this._editWorkout.bind(this));
    //   icon.addEventListener('click', this._editWorkout.bind(this));
    // });
  }

  _moveToPopup(e) {
    // const ele = e.target.closest('.workout');
    // // console.log(this);
    // const workoutId = ele?.dataset.id;
    // const clickedWorkout = this.#workouts.find(
    //   workout => workout.id === workoutId
    // );
    // // console.log(clickedWorkout);
    // if (!clickedWorkout) return;
    // this.#map.setView(clickedWorkout.coords, 13, {
    //   animate: true,
    //   pan: {
    //     duration: 1,
    //   },
    // });

    const ele = e.target;
    if (ele.classList.contains('edit-icon')) {
      const editMethod = this._editWorkout.bind(this);
      editMethod(e);
      console.log('from button ');
    }

    if (ele.classList.contains('delete-icon')) {
      console.log('delete method');
      overlay.classList.remove('cancel_hidden');
      modal.classList.remove('cancel_hidden');
      const workoutEle = ele.closest('.workout');
      const workoutId = workoutEle.dataset.id;
      this.deleteHandler = this._modalHandler.bind(this, workoutId);
      modal.addEventListener('click', this.deleteHandler);
    }

    if (ele.closest('.workout')) {
      const ele = e.target.closest('.workout');
      console.log('closest is workout');
      const workoutId = ele?.dataset.id;
      const clickedWorkout = this.#workouts.find(
        workout => workout.id === workoutId
      );
      if (!clickedWorkout) return;
      this.#map.setView(clickedWorkout.coords, 13, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
    }
    if (ele.closest('.cancel')) {
      console.log('clicked on cancel');
      const cancelMethod = this._cancelEdit.bind(this);
      cancelMethod(e);
    }

    if (ele.closest('.save')) {
      console.log('clicked on save');
      const saveMethod = this._saveEditedWorkout.bind(this);
      saveMethod(e);
    }
  }

  _deleteWorkout(workoutId) {
    const workoutIndex = this.#workouts.findIndex(
      workout => workout.id === workoutId
    );
    console.log(workoutIndex);
    this.#workouts.splice(workoutIndex, 1);
    this._setLocalStorage();
    // const allWorkouts = document.querySelectorAll('.workout');
    // allWorkouts.forEach(workout => workout.remove());
    this._getLocalStorage();
  }

  _modalHandler(workoutId, e) {
    if (e.target.closest('.delete-button')) {
      console.log('delete button');
      const workoutIndex = this.#workouts.findIndex(
        workout => workout.id === workoutId
      );
      console.log(workoutIndex);
      this.#workouts.splice(workoutIndex, 1);
      this._setLocalStorage();
      const allWorkouts = document.querySelectorAll('.workout');
      allWorkouts.forEach(workout => workout.remove());
      this._getLocalStorage();
      modal.removeEventListener('click', this.deleteHandler);
      modal.classList.add('cancel_hidden');
      overlay.classList.add('cancel-hidden');
    }
    if (e.target.closest('.cancel-button')) {
      console.log('cancel button');
      modal.removeEventListener('click', this.deleteHandler);
      modal.classList.add('cancel_hidden');
      overlay.classList.add('cancel-hidden');
    }
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    if (!localStorage.getItem('workouts')) return;
    this.#workouts = JSON.parse(localStorage.getItem('workouts'));
    console.log(typeof this.#workouts);

    console.log('before prototype', this.#workouts);
    this.#workouts = this.#workouts.map(workout =>
      workout.type == 'running'
        ? Object.assign(new Running(), workout)
        : Object.assign(new Cycling(), workout)
    );
    console.log('after prototype', this.#workouts);

    // this.#workouts = this.#workouts.map()
    // this.#workouts.forEach(workout => {
    //   workout.__proto__ = Object.create(
    //     workout.type == 'running' ? Running.prototype : Cycling.prototype
    //   );
    // });
    console.log('after workout');
    // console.log(this.#workouts);
    const allWorkouts = document.querySelectorAll('.workout');
    allWorkouts.forEach(workout => workout.remove());
    this.#workouts.forEach(workout => this._renderWorkout(workout));

    // console.log(editIcon);
    // console.log(editIcon);
  }

  _editWorkout(e) {
    // console.log(e);
    submitBtn.classList.add('cancel_hidden');
    const selectedWorkoutId = e.target.closest('.workout').dataset.id;
    const selectedWorkout = this.#workouts.find(
      workout => workout.id == selectedWorkoutId
    );
    console.log(selectedWorkout);
    this._showForm();
    this._setFormFieldValues(selectedWorkout);
    // this._toggleElevationField(this);
    // // console.log('in editWorkout method');
    // // console.log(this.#workouts);
    form.classList.add('being-edited');
    cancel.classList.remove('cancel_hidden');
    saveBtn.classList.remove('cancel_hidden');
    // // console.log(cancel);

    //creating new workout is not working if below line uncommented

    // cancel.addEventListener('click', this._cancelEdit.bind(this));
    // saveBtn.removeEventListener('click', this._saveEditedWorkout.bind(this));
    // saveBtn.addEventListener('click', this._saveEditedWorkout.bind(this));
  }
  _setFormFieldValues(workout) {
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;
    if (workout.type === 'running') {
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputCadence.value = workout.cadence;
    }
    // if (workout.type === 'cycling') {
    else {
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputElevation.value = workout.elevationGain;
    }
    form.dataset.editId = workout.id;
  }

  _cancelEdit(e) {
    e.preventDefault();
    if (e.target.closest('.cancel')) {
      submitBtn.classList.remove('cancel_hidden');
      console.log('clicked on cancel');
      form.classList.remove('being-edited');
      cancel.classList.add('cancel_hidden');
      saveBtn.classList.add('cancel_hidden');
      this._clearFormFields();
      this._hideForm();
      // form.addEventListener('submit', this._newWorkout.bind(this));
    }
  }

  _saveEditedWorkout(e) {
    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let cadence, elevation;
    if (type === 'running') {
      cadence = +inputCadence.value;
      console.log('inside running condi', type, distance, duration, cadence);
      if (!this._areInputsValidated(distance, duration, cadence))
        return alert('Inputs should not be empty or non numerical');
    }
    if (type === 'cycling') {
      console.log('inside cycling condi', type, distance, duration, elevation);
      elevation = +inputElevation.value;
      if (!this._areInputsValidated(distance, duration, elevation))
        return alert('Inputs should not be empty or non numerical');
    }
    const workoutId = form.dataset.editId;
    console.log(workoutId);
    ///editing workout using for each

    this.#workouts.forEach(workout => {
      if (workout.id === workoutId) {
        workout.distance = distance;
        workout.duration = duration;
        if (type === 'running') {
          workout.cadence = cadence;
          workout.calcPace();
        }
        if (type === 'cycling') {
          workout.elevationGain = elevation;
          workout.calcSpeed();
        }
      }
    });

    const workout = this.#workouts.filter(workout => workout.id === workoutId);
    console.log(workout);
    this._setLocalStorage();
    submitBtn.classList.remove('cancel_hidden');
    cancel.classList.add('cancel_hidden');
    saveBtn.classList.add('cancel_hidden');
    this._getLocalStorage();
    this._clearFormFields();
    this._hideForm();
    let workoutElement;
    document.querySelectorAll('.workout').forEach(workout => {
      if (workout.dataset.id == workoutId) {
        workoutElement = workout;
      }
    });
    this._scrollAndGlow(workoutElement);
  }

  _scrollAndGlow(workoutElement) {
    workoutElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    workoutElement.classList.add('glow-up');
    setTimeout(() => {
      workoutElement.classList.remove('glow-up');
    }, 1500);
  }
}

//creating obj from App class

const app = new App();
