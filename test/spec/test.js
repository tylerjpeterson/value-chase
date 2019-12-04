'use strict';

// Tape - https://github.com/substack/tape
const tape = require('tape');
const ValueChase = require('../..');

tape.onFinish(() => {
	setTimeout(() => window.close(), 500);
});

tape('should be a constructor', assert => {
	assert.equal(typeof ValueChase, 'function');
	assert.end();
});

tape('should fire render method', assert => {
	assert.plan(1);

	const chaser = new ValueChase();
	chaser.on('render', () => {
		assert.pass('Render event fired.');
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should fire update method', assert => {
	assert.plan(1);

	const chaser = new ValueChase();
	chaser.on('update', () => {
		assert.pass('Update event fired.');
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should stop when stopped', assert => {
	assert.plan(1);

	const chaser = new ValueChase();
	chaser.on('update', () => {
		chaser.stop();
		assert.equal(chaser.isRunning(), false);
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should run when started', assert => {
	assert.plan(1);

	const chaser = new ValueChase();
	chaser.on('update', () => {
		assert.equal(chaser.isRunning(), true);
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should not have properties after being destroyed', assert => {
	assert.plan(1);

	const chaser = new ValueChase();
	chaser.on('update', () => {
		chaser.destroy();
		assert.equal(chaser._min, null);
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should update targetValue based on initial option', assert => {
	assert.plan(1);
	const chaser = new ValueChase({max: 1, initial: 2});
	chaser.start();
	assert.equal(chaser._targetValue, 1);
});

tape('should emit destroyed when destroyed', assert => {
	assert.plan(1);
	const chaser = new ValueChase({initial: 0.5});
	setTimeout(() => {
		assert.equal(chaser.isRunning(), true);
		assert.end();
	}, 100);
	chaser.start();
	chaser.setProgress(0.15);
});

tape('should update friction when set', assert => {
	assert.plan(1);
	const chaser = new ValueChase();
	chaser.start();
	chaser.setFriction(10);
	assert.equal(chaser._friction, 10);
	assert.end();
});

tape('should apply ease when set', assert => {
	assert.plan(1);
	const ease = function (t, b, c, d) {
		t /= d;
		return (-c * (Math.sqrt(1 - (t * t)) - 1)) + b;
	};

	const chaser = new ValueChase({ease});
	chaser.on('update', () => {
		assert.equal(typeof chaser._ease, 'function');
		assert.end();
	});
	chaser.start();
});

tape('should emit destroyed when destroyed', assert => {
	assert.plan(1);
	const ease = function (t, b, c, d) {
		t /= d;
		return (-c * (Math.sqrt(1 - (t * t)) - 1)) + b;
	};

	const chaser = new ValueChase({ease, initial: 0});
	setTimeout(() => {
		chaser.setProgress(1);
		assert.equal(typeof chaser._ease, 'function');
		assert.end();
	}, 100);
	chaser.start();
});
