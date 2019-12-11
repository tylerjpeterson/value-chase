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
	const chaser = new ValueChase();
	chaser.on('render', () => {
		assert.pass('Render event fired.');
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should fire update method', assert => {
	const chaser = new ValueChase();
	chaser.on('update', () => {
		assert.pass('Update event fired.');
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should stop when stopped', assert => {
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
	const chaser = new ValueChase();
	chaser.on('update', () => {
		assert.equal(chaser.isRunning(), true);
		assert.end();
	});
	chaser.start();
	chaser.setProgress(0.5);
});

tape('should not have properties after being destroyed', assert => {
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
	const chaser = new ValueChase({max: 1, initial: 2});
	chaser.start();
	assert.equal(chaser._targetValue, 1);
	assert.end();
});

tape('should emit destroyed when destroyed', assert => {
	const chaser = new ValueChase({initial: 0.5});
	setTimeout(() => {
		assert.equal(chaser.isRunning(), true);
		assert.end();
	}, 100);
	chaser.start();
	chaser.setProgress(0.15);
});

tape('should update friction when set', assert => {
	const chaser = new ValueChase();
	chaser.start();
	chaser.setFriction(10);
	assert.equal(chaser._friction, 10);
	assert.end();
});

tape('should apply ease when set', assert => {
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

tape('`setValue` should immediately update current value when called', assert => {
	const ease = function (t, b, c, d) {
		t /= d;
		return (-c * (Math.sqrt(1 - (t * t)) - 1)) + b;
	};

	const chaser = new ValueChase({max: 10, initial: 1, ease});
	chaser.start();
	setTimeout(() => {
		chaser.on('render', evt => {
			assert.equal(evt.progress, 5);
			assert.end();
		});
		chaser.setValue(5);
	}, 100);
});

tape('when false, idle option should prevent ticker from pausing', {timeout: 500}, assert => {
	const ease = function (t, b, c, d) {
		t /= d;
		return (-c * (Math.sqrt(1 - (t * t)) - 1)) + b;
	};

	const chaser = new ValueChase({idle: false, ease});
	let time = null;

	chaser._ticker.once('render', e => {
		time = e.time;
	});

	chaser.start();
	chaser.setProgress(1);
	setTimeout(() => {
		chaser._ticker.once('render', e => {
			assert.notEqual(e.time, time);
			assert.end();
		});
	}, 250);
});

tape('should emit destroyed when destroyed', assert => {
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
