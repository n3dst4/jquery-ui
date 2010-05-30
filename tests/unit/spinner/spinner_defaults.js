/*
 * spinner_defaults.js
 */

var spinner_defaults = {
	value: null,
	precision: null,
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
	width: null,
	padding: null,
	thousandSeparator: "",
	increments: [{count: 2, increment: 1, delay: 500},
					 {count: 50, increment: 1, delay: 100},
					 {count: null, increment: 50, delay: 500}],
	format: $.noop,
	parse: $.noop,
	next: $.noop,
	validate: $.noop
};

commonWidgetTests('spinner', { defaults: spinner_defaults });
