// AppState.js or at the top of script.js
class AppState {
    constructor() {
        this._rackString = '';
    }

    get rackString() {
        return this._rackString;
    }

    set rackString(value) {
        this._rackString = value;
        this.notifyChange('rackString', value);
    }

    _listeners = {};

    subscribe(property, listener) {
        if (!this._listeners[property]) {
            this._listeners[property] = [];
        }
        this._listeners[property].push(listener);
    }

    notifyChange(property, newValue) {
        if (this._listeners[property]) {
            this._listeners[property].forEach(listener => listener(newValue));
        }
    }
}
