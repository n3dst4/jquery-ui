/*
 * spinner_defaults.js
 */

var spinner_defaults = {
	value: null,
	precision: 0,
	radixPoint: ".",
	min: null,
	max: null,
	dir: "ltr",
	step: null,
	page: 10,
	showButtons: "always",
	useMouseWheel: true,
	buttonWidth: 16,
	currency: "",
	units: "",
	thousandSeparator: "",
	increments: [{count: 2, increment: 1, delay: 500},
				 {count: 50, increment: 1, delay: 50},
				 {count: null, increment: 10, delay: 50}],
	format: $.noop,
	parse: $.noop,
	next: $.noop,
	validate: $.noop
};

commonWidgetTests('spinner', { defaults: spinner_defaults });
