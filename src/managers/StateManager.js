/**
 * StateManager — Simple state machine for the 2D app
 * States: LOADING → LANDING → ERA_MAP → PLANET_MAP → STORY
 */
export class StateManager {
  constructor() {
    this.currentState = 'LOADING';
    this.previousState = null;
    this.listeners = [];
  }

  /** Register a state change listener */
  on(callback) {
    this.listeners.push(callback);
  }

  /** Get current state */
  getState() {
    return this.currentState;
  }

  /** Transition to a new state with optional data */
  setState(newState, data = {}) {
    this.previousState = this.currentState;
    this.currentState = newState;
    this.listeners.forEach(cb => cb(newState, this.previousState, data));
  }

  /** Go back to previous state */
  goBack(data = {}) {
    if (this.previousState) {
      this.setState(this.previousState, data);
    }
  }
}
