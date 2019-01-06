import { ReactiveVar } from 'meteor/reactive-var';
import { Router } from 'meteor/iron:router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import Events from '/imports/api/events/events.js';

import '/imports/ui/components/events/list/event-list.js';
import '/imports/ui/components/loading/loading.js';

import './week-frame.html';

Template.frameWeek.onCreated(function() {
	var instance = this;
	instance.startOfWeek = new ReactiveVar();
	instance.weekdays = new ReactiveVar([]);

	this.autorun(function() {
		minuteTime.get();
		instance.startOfWeek.set(moment().startOf('week'));
	});

	this.autorun(function() {
		var filter = Events.Filtering()
		             .read(Router.current().params.query)
		             .done();

		var filterParams = filter.toParams();
		var startOfWeek = instance.startOfWeek.get();
		filterParams.after = startOfWeek.toDate();
		filterParams.before = moment(startOfWeek).add(1, 'week').toDate();

		instance.subscribe('Events.findFilter', filterParams, 200);
	});

	this.autorun(function() {
		var filter = Events.Filtering()
		             .read(Router.current().params.query)
		             .done();

		var start = instance.startOfWeek.get();
		var end = moment(start).add(1, 'week');

		var weekdays = [];
		var current = moment(start);
		while (current.isBefore(end)) {
			var next = moment(current).add(1, 'day');
			var filterParams = filter.toParams();
			filterParams.after = current.toDate();
			filterParams.before = next.toDate();

			weekdays.push({
				date: current,
				dayEvents: Events.findFilter(filterParams, 200)
			});
			current = next;
		}
		instance.weekdays.set(weekdays);
	});
});

Template.frameWeek.helpers({
	calendarDay: function(day) {
		Session.get('timeLocale');
		return moment(day.toDate()).format('dddd, Do MMMM');
	},

	hasDayEvents: function() {
		return this.dayEvents.count() > 0;
	},

	weekdays: function() {
		return Template.instance().weekdays.get();
	}
});

Template.frameWeek.onRendered(function() {
	var instance = this;
	this.autorun(function() {
		// rerun when subscriptions become ready
		instance.subscriptionsReady();
		// wait until subtemplates are rendered
		setTimeout(function(){
			instance.$("a").attr("target", "_blank");
		}, 0);
	});
});
