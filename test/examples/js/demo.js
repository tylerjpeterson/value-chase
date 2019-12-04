'use strict';

const ValueChase = require('../../..');

const ease = function (t, b, c, d) {
	t /= d;
	return (-c * (Math.sqrt(1 - (t * t)) - 1)) + b;
};

const valueChaser = new ValueChase({
	ease,
	initial: 0,
	idle: true
});

const easedRange = document.querySelector('.eased-range');
const rangeEl = document.querySelector('.raw-range');
const frictionEl = document.querySelector('#friction');
const toleranceEl = document.querySelector('#tolerance');

const render = function (evt) {
	easedRange.value = evt.progress;
};

const rangeChange = function () {
	valueChaser.setProgress(parseFloat(rangeEl.value));
};

const changeFriction = function (evt) {
	valueChaser.setFriction(evt.target.value);
};

const changeTolerance = function (evt) {
	valueChaser.setTolerance(evt.target.value);
};

frictionEl.addEventListener('change', changeFriction);
toleranceEl.addEventListener('change', changeTolerance);
rangeEl.addEventListener('input', rangeChange);
valueChaser.on('render', render);
valueChaser.start();
