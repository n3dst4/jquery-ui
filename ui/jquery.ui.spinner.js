/*
 * jQuery UI Spinner @VERSION
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Spinner
 *
 * Depends:
 *  ui.core.js
 */
(function($) {

// shortcut constants
var hover = 'ui-state-hover',
	active = 'ui-state-active',
	namespace = '.spinner',
	alwaysShow = 'always',
	neverShow = "never",
	autoShow = "auto",
	fastShow = "fast", // suits you, sir
	slowShow = "slow",
	uiSpinnerClasses = 'ui-spinner ui-widget ui-corner-all ';
	

$.widget('ui.spinner', {
	_create: function() {
		var attrVal,
			el = this.element,
			o = this.options,
			prevVal = this.element.val(),
			value =  o.parse.call(o, (o.value !== null) ? o.value :
									(prevVal !== "") ? prevVal :
									0);

		// html5 attributes
		$.each(["min", "max", "step"], function (i, name) {
			attrVal = el.attr(name);
			if (o[name] === null) {
				if (typeof attrVal !== "undefined" && attrVal !== "") {
					o[name] = attrVal;
				}
			}
			else { el.attr(name, o[name]); }
		});
		
		// TODO: rephrase this
		if (o.precision === null) {
			if (o.value !== null && typeof value === "number" && value % 1) {
				o.precision = /\.(\d+)/.exec(value.toString())[1].length;
			}
			else if (o.step !== null && typeof o.step === "number" && o.step % 1) {
				o.precision = /\.(\d+)/.exec(o.step.toString())[1].length;
			}
			else {
				o.precision = 0;
			}
		}		
		
		if (o.step === null) { o.step = 1; el.attr("step", "1"); }
		if (o.width === null) { o.width = this.element.outerWidth(); }
		
		this.value(value, true);
		this._draw();
		this._ariaValue();
		this._ariaMinMax();
		if (o.showButtons !== alwaysShow) { this.buttons.hide(); }
		if (o.disabled) { this.disable(); }
	},
	
	destroy: function() {
		if ($.fn.mousewheel) { this.element.unmousewheel(); }
		
		this.element
			.removeClass('ui-spinner-input')
			.removeAttr('disabled')
			.removeAttr('autocomplete')
			.removeData('spinner')
			.css(this.elementCSS)
			.unbind(namespace)
			;
		
		if (this.uiSpinner) {
			if (this.uiSpinner.parent()[0] != null) {
				this.uiSpinner.replaceWith(this.element);	
			}
			else {
				return this.element.clone(true);
			}
		}
	},
	
	_draw: function() {
		var self = this,
			o = self.options,
			el = self.element;
			//inputWidth = el.width() - o.buttonWidth;
			
		this.elementCSS = {
			"margin-left": el.css("margin-left"),
			"margin-right": el.css("margin-right"),
			"margin-top": el.css("margin-top"),
			"margin-bottom": el.css("margin-bottom"),
			"width": el.css("width")
		};

		this.wrapperCSS = {
			"margin-left": el.css("margin-left"),
			"margin-right": el.css("margin-right"),
			"margin-top": el.css("margin-top"),
			"margin-bottom": el.css("margin-bottom")
		};
		
		var uiSpinner = this.uiSpinner = el
			.addClass('ui-spinner-input')
			.attr('autocomplete', 'off') // switch off autocomplete in opera
			.css({
				"margin": 0
			})
			.wrap(self._uiSpinnerHtml())
			.bind('keydown'+namespace, function(event) {
				return self._keyDown(event);
			})
			.bind('keyup'+namespace, function(event) {
				return self._keyUp(event);
			})
			.bind('blur'+namespace, function(event) {
				if (self.source == "keyboard") { self._stop(); }
				self._readValue();
				self.focused = false;
				self._showButtons();
			})
			.bind("focus"+namespace, function(event) {
				self.focused = true;
				self._showButtons();
			})
			.parent()
				.append(self._buttonHtml())
				.css(this.wrapperCSS)
				.hover(function() {
					self.hovering = true;
					self._showButtons();
				}, function() {
					self.hovering = false;
					self._showButtons();
					if (self.source == "mouse") { self._stop(); }
				});
			
		this.resize();

		// TODO: need a better way to exclude IE8 without resorting to $.browser.version
		// fix inline-block issues for IE. Since IE8 supports inline-block we need to exclude it.
		if (!$.support.opacity && uiSpinner.css('display') == 'inline-block' && $.browser.version < 8) {
			uiSpinner.css('display', 'inline');
		}

		// element bindings
		el
			// Give the spinner casing a unique id only if one exists in original input 
			// - this should aid targetted customisations if a page contains multiple instances
			.attr('id', function(){
				if (this.id) {
					uiSpinner.attr('id', 'ui-spinner-'+ this.id);
				}
			});

		// button bindings
		this.buttons = uiSpinner.find('.ui-spinner-button')
			.css("width", o.buttonWidth -1)
			.bind('mousedown'+namespace, function (event) {
				var direction = $(this).hasClass('ui-spinner-up') ? 1 : -1;
				self._stop();
				self.source = "mouse";
				self._spin(direction, event.shiftKey);
				
				if (!self.options.disabled) {
					$(this).addClass(active);
				}
				return true;
			})
			.bind('mouseup'+namespace, function (event) {
				self._stop();
				self.element.focus();
				$(this).removeClass(active);
			})
			.hover(function () {
				if (!self.options.disabled) {
					$(this).addClass(hover);					
				}
			}, function (event) {
				$(this).removeClass(active + ' ' + hover);
			});
			
		// mousewheel bindings
		if ($.fn.mousewheel && self.options.useMouseWheel) {
			this.element.mousewheel(function(event, delta) {
				self._mouseWheel(event, delta);
			});
		}
			
		// ie doesn't fire mousedown on 2nd click, so have to fake it
		if ($.browser.msie) {
			this.buttons.bind("dblclick", function () {
				$(this).trigger("mousedown")
					.trigger("mouseup");
			});
		}
	},
	
	resize: function () {
		var o = this.options,
			el = this.element;
		this.uiSpinner.css({
			"height": el.outerHeight(),
			"width": o.width	
		});
		el.css("width", this.uiSpinner.width() - o.buttonWidth - (el.outerWidth() - el.width()));
	},
	
	_uiSpinnerHtml: function () {
		return ['<span role="spinbutton" class="', uiSpinnerClasses,
				(this.options.spinnerClass || ''), ' ui-spinner-',
				this.options.dir, '">','</span>'].join("");
	},
	
	_buttonHtml: function () {
		return '<a class="ui-spinner-button ui-spinner-up ui-state-default ui-corner-t' + this.options.dir.substr(-1,1) + 
				'"><span class="ui-icon ui-icon-triangle-1-n">&#9650;</span></a>' +
				'<a class="ui-spinner-button ui-spinner-down ui-state-default ui-corner-b' + this.options.dir.substr(-1,1) + 
				'"><span class="ui-icon ui-icon-triangle-1-s">&#9660;</span></a>';
	},
	
	_keyDown: function (event) {
		var paging, direction,
			key = event.keyCode,
			o = this.options,
			KEYS = $.ui.keyCode;
			
		if (this.timer) { return false; }
			
		if 	(key == KEYS.UP || key == KEYS.DOWN || key == KEYS.PAGE_UP ||
				key == KEYS.PAGE_DOWN || key == KEYS.RIGHT || key == KEYS.LEFT) {
			paging = key == KEYS.PAGE_UP
					|| key == KEYS.PAGE_DOWN
					|| event.shiftKey;
			direction = (key == KEYS.UP
						|| key == KEYS.PAGE_UP
						|| key == KEYS.RIGHT) ? 1 : -1;
			this.source = "keyboard";
			this.sourceEvent = event;
			this._spin(direction, paging);
			return false;
		}
		else if (key == KEYS.HOME && ! event.shiftKey && o.max !== null)  {
			this.value(o.max);
			return false;
		}
		else if (key == KEYS.END && ! event.shiftKey && o.min !== null)  {
			this.value(o.min);
			return false;
		}
		else if (key == KEYS.ENTER) {
			this._readValue();
			return false;
		}
		else {
			return true;
		}
	},
	
	_keyUp: function(event) {
		this._stop();
	},
	
	_spin: function (direction, paging, force) {
		var inc, next,
			o = this.options,
			self = this;

		if (o.disabled && ! force) { return; }
			
		if (! this.timer) {
			this._start();
		}
		
		// counter and increment stage
		this.spinCounter = this.spinCounter || 0;
		this.spinStage = this.spinStage || 0;
		inc = o.increments[this.spinStage];
		if (inc.count && this.spinCounter >= inc.count) {
			this.spinStage++;
		}
		inc = o.increments[this.spinStage];

		// get next value
		next = o.next(o.value, inc.increment * (paging?o.page:o.step), direction, o.min, o.max);
		if (next !== false) {
			this._trigger("spin", this.sourceEvent, {value: o.value, next: next});
			if (this.timer) { clearTimeout(this.timer); }
			this.timer = setTimeout(function () {self._spin(direction, paging)}, inc.delay);
			this.value(next);
			this.spinCounter++;
		}
	},
	
	_start: function () {
		this._readValue();
		this._trigger("start", this.sourceEvent, {value: this.options.value});
	},
	
	_stop: function () {
		if (this.timer) {
			clearTimeout (this.timer);
			this.source = this.timer = this.spinCounter = this.spinStage = null;
			this._trigger("stop", null, {value: this.options.value});
		}
	},
	
	value: function (newVal, suppressEvent) {
		var o = this.options,
			old = o.value;
		if (arguments.length == 0) {
			return o.value;
		}
		else {
			o.value = o.validate.call(o, o.parse(newVal));
			this.element.val(this._formatted());
			this._ariaValue();
			if (! suppressEvent) {
				this._trigger("change", null,
					{value: newVal, old: old,  spinning: !!this.timer});
			}
		}
	},
	
	_readValue: function () {
		var newVal = this.options.parse(this.element.val()); 
		if (newVal != this.options.value) {
			this.value(newVal);
		}
	},
	
	
	_formatted: function () {
		var o = this.options;
		return o.format.call(o, o.value);
	},
	
	_mouseWheel: function(event, delta) {
		var self = this;
		//delta = ($.browser.opera ? -delta / Math.abs(delta) : delta);
		
		self._spin((delta > 0 ? 1 : -1), event.shiftKey);
		self._stop();
		event.preventDefault();			
	},
	
	_ariaValue: function() {
		var o = this.options;
		if (this.uiSpinner) {
			if (typeof o.value === "number") {
				this.uiSpinner.attr('aria-valuenow', o.value);
			}
			this.uiSpinner.attr('aria-valuetext', this._formatted());
		}
	},
	
	_ariaMinMax: function () {
		var o = this.options;
		this.uiSpinner 
			&& this.uiSpinner
				.attr('aria-valuemin', (o.min === null)?"":o.format.call(o, o.min))
				.attr('aria-valuemax', (o.max === null)?"":o.format.call(o, o.max));		
	},
	
	enable: function() {
		this.element
			.removeAttr('disabled')
			.siblings()
				.removeAttr('disabled')
			.parent()
				.removeClass('ui-spinner-disabled ui-state-disabled');
		this.options.disabled = false;
	},
	
	disable: function() {
		this.element
			.attr('disabled', true)
			.siblings()
				.attr('disabled', true)
			.parent()
				.addClass('ui-spinner-disabled ui-state-disabled');
		this.options.disabled = true;
	},
	
	_setOption: function (name, value) {
		var o = this.options,
			prev = o[name];
		o[name] = value;
		if (name === "min" || name === "max") { this._ariaMinMax(); }
		else if (name === "showButtons") { this._showButtons(); }
		else if (/(padding|precision|value|currency)/.test(name)) { this.value(o.value); }
		else if (name === "width") { this.resize(); }
		else if (name === "spinnerClass") {
			this.uiSpinner.removeClass(prev || "").addClass(value);
		}
	},
	
	stepUp: function (count) {
		this._pretend(1, false, count);
	},
	
	stepDown: function (count) {
		this._pretend(-1, false, count);
	},
	
	pageUp: function (count) {
		this._pretend(1, true, count);
	},
	
	pageDown: function (count) {
		this._pretend(-1, true, count);
	},
	
	_pretend: function(direction, paging, count) {
		count = count || 1;
		while (count --) {
			this._spin(direction, paging, true);
		}
		this._stop();
	},
	
	// even though i'm philosophically opposed to vanishing UI elements...
	_showButtons: function () {
		var opt = this.options.showButtons,
			speed= (opt === slowShow || opt === fastShow || typeof opt === "number") ? opt:
					(opt === autoShow) ? fastShow:
					"";
		if (opt === neverShow) { this.buttons.hide(); }
		else if (opt === alwaysShow || speed === "") { this.buttons.show(); }
		else {
			if (this.focused || this.hovering) { this.buttons.fadeIn(speed); }
			else { this.buttons.fadeOut(speed); }
		}
	}
	
});

$.extend($.ui.spinner.prototype, {
	version: "@VERSION",
	eventPrefix: "spin",
	options: {
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
					 {count: 50, increment: 1, delay: 50},
					 {count: null, increment: 10, delay: 50}],
		format: function (value) {
			var sign, integral, fractional, result, pad, zeroes, orig = value;
			if (typeof(value) !== "number") {
				value = 0;
			}
			sign = (value >= 0) ? "" : "-";
			value = Math.abs(value).toFixed(this.precision);
			result = /(\d+)(?:\.(\d+))?/.exec(value);
			integral = result[1];
			if (this.thousandSeparator) {
				integral = integral.split("");
				integral.reverse();
				integral = integral.join("").replace(/(\d\d\d)/g, "$1" + this.thousandSeparator);
				integral = integral.split("");
				integral.reverse();
				integral = integral.join("");
			}
			if (this.precision) {
				fractional = result[2];
				value = [integral, this.radixPoint, fractional].join("");
			}
			else {
				value = integral;
			}
			if (this.padding) {
				zeroes = [];
				pad = this.padding - value.length;
				while (pad --> 0) zeroes.push("0");
				value = zeroes.join("") + value;
			}
			return sign + this.currency + value;
		},
		
		parse: function (text) {
			var result, orig = text,
				re = /^(-?)[^\d]*(.*?)[^\d]*$/;
			if (typeof(text) === "number") { return text; }
			text = text.toString().replace(" ", "")
				.replace(this.thousandSeparator, "")
				.replace(this.radixPoint, ".")
				.replace(this.currency, "");
			result = re.exec(text);
			result =  parseFloat(result[2]) * (result[1]?-1.0:1.0);
			return result || 0;
		},
		next: function (currentValue, amount, direction, min, max) {
			var n;
			if ((direction > 0 && currentValue == max)
					|| (direction < 0 && currentValue == min)) { return false; }
			else {
				n = currentValue + amount * direction;
				if (max !== null) { n = Math.min(max, n); }
				if (min !== null) { n = Math.max(min, n); }
				return n;
			}
		},
		validate: function (value) {
			if (this.min !== null) { value = Math.max(value, this.min); }
			if (this.max !== null) { value = Math.min(value, this.max); }
			return value;
		}
	}
});

})(jQuery);
