'use strict';

const {EventEmitter} = require('events');
const Ticker = require('ticker-js');

/**
 * @class ValueChase
 *
 * @classdesc Creates a value chase incorporating an ease and friction.
 * @augments {EventEmitter}
 *
 * @param {Object} [options] - Object instantiation options
 * @param {Number} [options.initial=null] - Set an initial value
 * @param {Number} [options.min=0] - Min value to calculate completion percentage against
 * @param {Number} [options.max=1] - Max value to calculate completion percentage against
 * @param {Object} [options.ticker=Ticker] - Use an existing ticker instance if one's already available
 * @param {Boolean} [options.idle=true] - When enabled, the chaser will idle (disable itself until its progress is updated)
 */
class ValueChase extends EventEmitter {
	constructor(options) {
		super();

		const mergedOptions = {
			...ValueChase.DEFAULTS,
			...options
		};

		this._ticker = null;
		this._running = false;
		this._tolerance = null;
		this._targetVal = null;
		this._lastEvent = null;
		this._currentVal = null;
		this._currentRaw = null;
		this._needsUpdate = false;
		this._needsChange = false;

		for (const x in mergedOptions) {
			/* istanbul ignore else */
			if (Object.prototype.hasOwnProperty.call(mergedOptions, x)) {
				this[`_${x}`] = mergedOptions[x];
			}
		}

		this._onUpdate = this._onUpdate.bind(this);
		this._onRender = this._onRender.bind(this);
		this.setTolerance(this._tolerance);
	}

	/**
	 * Start the ticker / broadcasting of events
	 * @param  {Number} initial - optional initial value
	 */
	start(initial) {
		initial = initial || this._initial || null;

		/* istanbul ignore else */
		if (this._ticker && !this._running) {
			this._bindListeners();
			this._ticker.start();
			this._running = true;

			if (initial === null) {
				this.setProgress(0);
			} else {
				this.setProgress(initial);
			}
		}
	}

	/**
	 * Stop the ticker / broadcasting of events
	 */
	stop() {
		/* istanbul ignore else */
		if (this._ticker && this._running) {
			this._unbindListeners();
			this._running = false;
			this._ticker.stop();
		}
	}

	/**
	 * Determine if instance is currently running
	 * @return {Boolean} - True if running, false if not.
	 */
	isRunning() {
		return this._running;
	}

	/**
	 * Update the target value
	 * @param {Number} val - progress value
	 */
	setProgress(val) {
		if (val > this._max) {
			this._targetValue = this._max;
		}

		if (this._targetVal !== val) {
			if (this._idle) {
				this._ticker.start();
			}

			this._targetVal = val;
			this._needsUpdate = true;
		}
	}

	/**
	 * Set the friction property
	 * @param {Number} val - Amount of friction to apply (larger numbers result in greater resistance)
	 */
	setFriction(val) {
		this._friction = val;
	}

	/**
	 * Set the tolerance property
	 * @param {Number} val - Degree of specificity used to determine when value matches target
	 */
	setTolerance(val) {
		this._tolerance = 10 ** val;
	}

	/**
	 * Immediately jump to the provided value and force a render
	 * @param {Number} val - progress value
	 */
	setValue(val) {
		this._targetVal = val;
		this._currentVal = val;
		this._currentRaw = val;
		this._needsUpdate = false;
		this._needsChange = true;
		this._onRender(this._lastEvent);
	}

	/**
	 * Destroy the instance.
	 */
	destroy() {
		this.stop();
		this.removeAllListeners();

		this._running = false;
		this._ticker.destroy();

		for (const i in this) {
			if (Object.prototype.hasOwnProperty.call(this, i)) {
				this[i] = null;
			}
		}
	}

	/**
	 * Attach event listeners to ticker
	 * @private
	 */
	_bindListeners() {
		this._ticker.on('update', this._onUpdate);
		this._ticker.on('render', this._onRender);
	}

	/**
	 * Remove ticker event listeners
	 * @private
	 */
	_unbindListeners() {
		this._ticker.removeListener('update', this._onUpdate);
		this._ticker.removeListener('render', this._onRender);
	}

	/**
	 * Update current value based on ticker event data
	 * @private
	 * @param  {Object} evt - Ticker event data
	 */
	_updateValue(evt) {
		this._lastEvent = evt;
		let easedVelocity = 1;
		let fpsCoefficent = 1;

		if (this._currentVal === null) {
			this._currentVal = this._targetVal;
		}

		if (this._ease) {
			const maxDiff = this._max - this._min;
			const target = (this._max - (this._max - this._targetVal)) / maxDiff;
			const current = (this._max - (this._max - this._currentVal)) / maxDiff;
			const progress = 1 - Math.abs(target - current);
			const eased = this._ease(progress, 0, 1, 1);

			easedVelocity = 1 + (eased - progress);
		}

		/* istanbul ignore if */
		if (evt && evt.trueFps !== evt.fps) {
			fpsCoefficent = evt.trueFps / evt.fps;
		}

		const distance = this._targetVal - this._currentVal;
		const step = distance * easedVelocity * fpsCoefficent * (1 / this._friction);
		const newCurrent = Math.round((this._currentVal + step) * this._tolerance) / this._tolerance;

		if (newCurrent === this._currentVal) {
			this._currentRaw = newCurrent;
			this._currentVal = this._targetVal;
		} else {
			this._currentRaw = newCurrent;
			/* istanbul ignore next */
			this._currentVal = newCurrent;
		}

		this._needsChange = true;
	}

	/**
	 * Fire update event if necessary
	 * @private
	 * @param  {Object} evt - ticker event data
	 */
	_onUpdate(evt) {
		if (this._needsUpdate) {
			this._updateValue(evt);
		}

		if (this._needsChange) {
			evt.progress = this._currentVal;
			evt.raw = this._currentRaw;
			this.emit('update', evt);
		}
	}

	/**
	 * Fire render event if necessary
	 * @private
	 * @param  {Object} evt - ticker event data
	 */
	_onRender(evt) {
		if (!this._needsChange) {
			return;
		}

		evt.progress = this._currentVal;
		evt.raw = this._currentRaw;

		this.emit('render', evt);

		if (this._targetVal === this._currentVal) {
			this._needsUpdate = false;
			this._needsChange = false;

			if (this._idle) {
				this._ticker.stop();
			}

			this.emit('idle', evt);
		} else {
			this._needsUpdate = true;
		}
	}
}

ValueChase.DEFAULTS = {
	min: 0,
	max: 1,
	tolerance: 4,
	friction: 10,
	initial: null,
	ease: null,
	idle: true,
	ticker: new Ticker()
};

module.exports = ValueChase;
