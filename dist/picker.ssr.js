'use strict';var Vue=require('vue');function _interopDefaultLegacy(e){return e&&typeof e==='object'&&'default'in e?e:{'default':e}}var Vue__default=/*#__PURE__*/_interopDefaultLegacy(Vue);function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}var MAX_RENDERED_AMOUNT = 60;
var isTouchEvent = function isTouchEvent(evt) {
  return ['touchstart', 'touchmove', 'touchend'].includes(evt.type);
};
/** EaseOutQuart easing function */

var easing = function easing(pos) {
  return -(Math.pow(pos - 1, 4) - 1);
};
var getVisibleOptions = function getVisibleOptions(source, index) {
  var min = index - MAX_RENDERED_AMOUNT / 2 < 0 ? 0 : index - MAX_RENDERED_AMOUNT / 2;
  var max = min + MAX_RENDERED_AMOUNT > source.length ? source.length : min + MAX_RENDERED_AMOUNT;
  return {
    options: source.slice(min, max),
    start: Math.floor(min)
  };
};
var calculateVelocity = function calculateVelocity(yArr, itemHeight) {
  var velocity;

  if (yArr.length === 1) {
    velocity = 0;
  } else {
    var startTime = yArr[yArr.length - 2][1];
    var endTime = yArr[yArr.length - 1][1];
    var startY = yArr[yArr.length - 2][0];
    var endY = yArr[yArr.length - 1][0]; // Calculated speed

    velocity = (startY - endY) / itemHeight * 1000 / (endTime - startTime);
    var sign = velocity > 0 ? 1 : -1;
    velocity = Math.abs(velocity) > 30 ? 30 * sign : velocity;
  }

  return velocity;
};
var wheelDebounce = function wheelDebounce(start, end, timer) {
  var timeout;
  return function (e) {
    clearTimeout(timeout);
    start(e);
    timeout = setTimeout(function () {
      return end();
    }, timer);
  };
};var script = Vue__default["default"].extend({
  name: 'Picker',
  props: {
    /** An array of options in format { value: string, text: string } to be displayed in the Picker */
    options: {
      type: Array,
      default: function _default() {
        return [];
      }
    },

    /** Default value of the Picker. Use either as initial value or as a v-model */
    value: {
      type: Object,
      default: null
    },

    /** How far is each item in the list from another */
    radius: {
      type: Number,
      default: 150
    },

    /** Defines 'how far is the Picker from the viewer'. Visually changes the circless-ness of the Picker. */
    perspective: {
      type: Number,
      default: 200
    },

    /** The height of each item in the list. Needed to properly calculate the position of them */
    itemHeight: {
      type: Number,
      default: 40
    },

    /**
     * How sensible is Picker for touches. The bigger value you put the more acceleration
     * the Picker gains after moving the touch.
     * Must be in the range from 0 to 10.
     */
    sensitivity: {
      type: Number,
      default: 8,
      validator: function validator(value) {
        return value > 0 && value <= 10;
      }
    },

    /**
     * Amount of options that are visible on the ring of a Picker.
     * At maximum, will display passed amount plus one chosen option in the center of the ring.
     * Must be a multiple of 2 for the best experience.
     */
    visibleOptionsAmount: {
      type: Number,
      default: 10,
      validator: function validator(value) {
        return value % 2 === 0;
      }
    },

    /** If 'infinite' is passed, then you can scroll the Picker forever, all values will repeat */
    type: {
      type: String,
      default: 'normal',
      validator: function validator(value) {
        return ['normal', 'infinite'].includes(value);
      }
    },

    /** Whether the arrows for scrolling to top or to bottom are needed to be displayed */
    arrows: {
      type: Boolean,
      default: false
    }
  },
  model: {
    prop: 'value',
    event: 'change'
  },
  data: function data() {
    var _this$value,
        _this = this,
        _this$options;

    var selected = (_this$value = this.value) !== null && _this$value !== void 0 && _this$value.value ? this.options.findIndex(function (option) {
      var _this$value2;

      return option.value === ((_this$value2 = _this.value) === null || _this$value2 === void 0 ? void 0 : _this$value2.value);
    }) : 0;
    var selectedIndex = selected > -1 ? selected : 0;
    var options = getVisibleOptions(this.options, selectedIndex); // const circular = initCircularBuffer(this.options, selectedIndex);

    return {
      listStyle: {
        transform: "transform: translate3d(0, 0, ".concat(-this.radius, "px) rotateX(0deg)")
      },
      highlightListStyle: {
        transform: "translate3d(0, 0, 0)"
      },
      source: this.options,
      // Options {value: xx, text: xx}
      visibleOptions: options.options,
      visibleOptionsIndex: options.start,
      selected: this.value || ((_this$options = this.options) === null || _this$options === void 0 ? void 0 : _this$options[0]) || null,
      selectedIndex: selectedIndex,
      prevSelectedIndex: selectedIndex,
      maxAcceleration: 10,
      requestAnimationId: 0,
      wheeling: false,
      touchData: {
        startY: 0,
        yArr: [],
        touchScroll: 0,
        delta: 0
      }
    };
  },
  computed: {
    debounced: function debounced() {
      return wheelDebounce(this.wheel, this.endWheel, 100);
    },
    rotationAngle: function rotationAngle() {
      return 360 / this.visibleOptions.length;
    }
  },
  mounted: function mounted() {
    document.addEventListener('mousedown', this.touchstart);
    document.addEventListener('mouseup', this.touchend); // Move to the initial value

    this.moveTo(this.selectedIndex);
  },
  watch: {
    value: function value(val) {
      var _this$selected,
          _this2 = this;

      if ((val === null || val === void 0 ? void 0 : val.value) === ((_this$selected = this.selected) === null || _this$selected === void 0 ? void 0 : _this$selected.value)) return;
      var newIndex = val !== null && val !== void 0 && val.value ? this.source.findIndex(function (option) {
        var _this2$value;

        return option.value === ((_this2$value = _this2.value) === null || _this2$value === void 0 ? void 0 : _this2$value.value);
      }) : 0;
      this.selected = val;
      if (this.selectedIndex !== newIndex) this.selectedIndex = newIndex;
      this.animateToScroll(this.selectedIndex, newIndex);
    }
  },
  methods: {
    changeSelectedIndex: function changeSelectedIndex(newIndex) {
      if (Math.abs(newIndex - this.prevSelectedIndex) > this.visibleOptionsAmount / 2) {
        var options = getVisibleOptions(this.source, newIndex);
        this.visibleOptions = options.options;
        this.visibleOptionsIndex = options.start;
        this.prevSelectedIndex = this.selectedIndex;
      }

      this.selectedIndex = newIndex;
    },
    startRoll: function startRoll(yPos) {
      this.touchData.startY = yPos;
      this.touchData.yArr = [[yPos, new Date().getTime()]];
      this.touchData.touchScroll = this.selectedIndex;
      this.stop();
    },
    doRoll: function doRoll(yPos) {
      this.touchData.yArr.push([yPos, new Date().getTime()]); // Calculate new selected index by the item height and the scrolled amount

      var scrollAdd = (this.touchData.startY - yPos) / this.itemHeight;
      var moveToScroll = scrollAdd + this.selectedIndex;

      if (this.type === 'normal') {
        if (moveToScroll < 0) {
          moveToScroll = this.wheeling ? Math.max(-1.5, moveToScroll * 0.05) : moveToScroll * 0.3;
        } else if (moveToScroll > this.source.length) {
          var toPos = moveToScroll - this.source.length;
          moveToScroll = this.source.length + (this.wheeling ? Math.min(1.5, toPos * 0.05) : toPos * 0.3);
        }
      } else {
        moveToScroll = this.normalizeScroll(moveToScroll);
      }

      this.touchData.touchScroll = this.moveTo(moveToScroll);
    },
    endRoll: function endRoll() {
      var velocity = calculateVelocity(this.touchData.yArr, this.itemHeight);
      this.changeSelectedIndex(this.touchData.touchScroll);
      this.animateMoveByVelocity(velocity);
    },
    touchstart: function touchstart(e) {
      if (e.target) e.target.addEventListener('touchmove', this.touchmove);
      document.addEventListener('mousemove', this.touchmove);
      var eventY = isTouchEvent(e) ? e.touches[0].clientY : e.clientY;
      this.touchData.delta = 0;
      this.startRoll(eventY);
    },
    touchmove: function touchmove(e) {
      e.preventDefault();
      var eventY = isTouchEvent(e) ? e.touches[0].clientY : e.clientY;
      this.doRoll(eventY);
    },
    wheel: function wheel(e) {
      e.preventDefault();

      if (!this.wheeling) {
        this.wheeling = true;
        var startPos = e.clientY;
        this.touchData.delta = e.deltaY;
        this.startRoll(startPos);
      } else {
        this.touchData.delta -= e.deltaY;
        this.doRoll(this.touchData.startY + this.touchData.delta);
      }
    },
    endWheel: function endWheel() {
      this.endRoll();
      this.wheeling = false;
    },
    touchend: function touchend(e) {
      if (e.target) e.target.removeEventListener('touchmove', this.touchmove);
      document.removeEventListener('mousemove', this.touchmove);
      this.endRoll();
    },
    normalizeScroll: function normalizeScroll(scroll) {
      var normalizedScroll = scroll;

      while (normalizedScroll < 0) {
        normalizedScroll += this.source.length;
      }

      normalizedScroll = normalizedScroll % this.source.length;
      return normalizedScroll;
    },

    /** Immediate move to some index in the options array */
    moveTo: function moveTo(newIndex) {
      var _this3 = this;

      if (this.type === 'infinite') {
        this.changeSelectedIndex(this.normalizeScroll(newIndex));
      }

      if (!this.source.length) {
        return 0;
      }

      this.listStyle.transform = "translate3d(0, 0, ".concat(-this.radius, "px) rotateX(").concat(this.rotationAngle * (newIndex - this.visibleOptionsIndex), "deg)");
      this.highlightListStyle.transform = "translate3d(0, ".concat(-(newIndex - this.visibleOptionsIndex) * this.itemHeight, "px, 0)");
      this.visibleOptions = this.visibleOptions.map(function (item, index) {
        item.visibility = Math.abs(_this3.visibleOptionsIndex + index - newIndex) <= _this3.visibleOptionsAmount / 2;
        return item;
      });
      return newIndex;
    },

    /**
     * At initial speed scroll (?) initV
     * @param {init} initV， initV Will be reset
     * To ensure scrolling to integers based on acceleration of scroll (Guaranteed to pass Scroll Target a selected value)
     */
    animateMoveByVelocity: function animateMoveByVelocity(initV) {
      var _this4 = this;

      var initScroll;
      var finalScroll;
      var totalScrollLen;
      var a; // Acceleration

      var t; // Time

      if (this.type === 'normal') {
        if (this.selectedIndex < 0 || this.selectedIndex > this.source.length - 1) {
          var _this$animateToScroll;

          a = this.maxAcceleration;
          initScroll = this.selectedIndex;
          finalScroll = this.selectedIndex < 0 ? 0 : this.source.length - 1;
          totalScrollLen = initScroll - finalScroll;
          t = Math.sqrt(Math.abs(totalScrollLen / a));
          (_this$animateToScroll = this.animateToScroll(initScroll, finalScroll, t)) === null || _this$animateToScroll === void 0 ? void 0 : _this$animateToScroll.then(function () {
            return _this4.selectByScroll(_this4.selectedIndex);
          });
        } else {
          var _this$animateToScroll2;

          initScroll = this.selectedIndex;
          a = initV > 0 ? -this.sensitivity : this.sensitivity; // Is acceleration or deceleration

          t = Math.abs(initV / a); // Speed reduced to 0 takes time

          totalScrollLen = initV * t + a * t * t / 2; // Total rolling length

          finalScroll = Math.round(this.selectedIndex + totalScrollLen); // Round to ensure accuracy and finally scroll to an integer

          finalScroll = finalScroll < 0 ? 0 : finalScroll > this.source.length - 1 ? this.source.length - 1 : finalScroll;
          totalScrollLen = finalScroll - initScroll;
          t = Math.sqrt(Math.abs(totalScrollLen / a));
          (_this$animateToScroll2 = this.animateToScroll(this.selectedIndex, finalScroll, t)) === null || _this$animateToScroll2 === void 0 ? void 0 : _this$animateToScroll2.then(function () {
            return _this4.selectByScroll(_this4.selectedIndex);
          });
        }
      } else {
        var _this$animateToScroll3;

        a = initV > 0 ? -this.sensitivity : this.sensitivity; // Deceleration/Acceleration

        t = Math.abs(initV / a); // Speed reduced to 0 takes time

        totalScrollLen = initV * t + a * t * t / 2; // Total rolling length

        finalScroll = Math.round(this.selectedIndex + totalScrollLen); // Round to ensure accuracy and finally scroll as an integer

        (_this$animateToScroll3 = this.animateToScroll(this.selectedIndex, finalScroll, t)) === null || _this$animateToScroll3 === void 0 ? void 0 : _this$animateToScroll3.then(function () {
          return _this4.selectByScroll(_this4.selectedIndex);
        });
      }
    },
    animateToScroll: function animateToScroll(initScroll, finalScroll) {
      var _this5 = this;

      var time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      if (finalScroll > this.source.length - 1 || finalScroll < 0) {
        return;
      }

      if (time === null) {
        time = 0.125 * Math.abs(finalScroll - initScroll);
      }

      if (initScroll === finalScroll || time === 0) {
        this.moveTo(initScroll);
        return;
      }

      var start = new Date().getTime() / 1000;
      var pass = 0;
      var totalScrollLen = finalScroll - initScroll;
      return new Promise(function (resolve) {
        var tick = function tick() {
          pass = new Date().getTime() / 1000 - start;

          if (pass < time) {
            _this5.changeSelectedIndex(_this5.moveTo(initScroll + easing(pass / time) * totalScrollLen));

            _this5.requestAnimationId = requestAnimationFrame(tick);
          } else {
            resolve();

            _this5.stop();

            _this5.changeSelectedIndex(_this5.moveTo(initScroll + totalScrollLen));
          }
        };

        tick();
      });
    },
    stop: function stop() {
      cancelAnimationFrame(this.requestAnimationId);
    },
    selectByScroll: function selectByScroll(scroll) {
      scroll = this.normalizeScroll(scroll) | 0;

      if (scroll > this.source.length - 1) {
        scroll = this.source.length - 1;
        this.moveTo(scroll);
      }

      this.moveTo(scroll);
      this.selectedIndex = scroll;
      this.selected = this.source[scroll];
      this.$emit('change', this.selected);
    },
    doManualSelect: function doManualSelect(initScroll, finalScroll) {
      var _this$animateToScroll4,
          _this6 = this;

      var time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      (_this$animateToScroll4 = this.animateToScroll(initScroll, finalScroll, time)) === null || _this$animateToScroll4 === void 0 ? void 0 : _this$animateToScroll4.then(function () {
        return _this6.selectByScroll(_this6.selectedIndex);
      });
    }
  }
});function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}function createInjectorSSR(context) {
    if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
    }
    if (!context)
        return () => { };
    if (!('styles' in context)) {
        context._styles = context._styles || {};
        Object.defineProperty(context, 'styles', {
            enumerable: true,
            get: () => context._renderStyles(context._styles)
        });
        context._renderStyles = context._renderStyles || renderStyles;
    }
    return (id, style) => addStyle(id, style, context);
}
function addStyle(id, css, context) {
    const group = css.media || 'default' ;
    const style = context._styles[group] || (context._styles[group] = { ids: [], css: '' });
    if (!style.ids.includes(id)) {
        style.media = css.media;
        style.ids.push(id);
        let code = css.source;
        style.css += code + '\n';
    }
}
function renderStyles(styles) {
    let css = '';
    for (const key in styles) {
        const style = styles[key];
        css +=
            '<style data-vue-ssr-id="' +
                Array.from(style.ids).join(' ') +
                '"' +
                (style.media ? ' media="' + style.media + '"' : '') +
                '>' +
                style.css +
                '</style>';
    }
    return css;
}/* script */
var __vue_script__ = script;
/* template */

var __vue_render__ = function __vue_render__() {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "picker",
    style: {
      perspective: _vm.perspective + "px"
    },
    attrs: {
      "tabindex": "0"
    },
    on: {
      "mousedown": _vm.touchstart,
      "mouseup": _vm.touchend,
      "touchstart": _vm.touchstart,
      "touchend": _vm.touchend,
      "wheel": _vm.debounced,
      "keyup": [function ($event) {
        if (!$event.type.indexOf('key') && _vm._k($event.keyCode, "up", 38, $event.key, ["Up", "ArrowUp"])) {
          return null;
        }

        return _vm.doManualSelect(_vm.selectedIndex, _vm.selectedIndex - 1);
      }, function ($event) {
        if (!$event.type.indexOf('key') && _vm._k($event.keyCode, "down", 40, $event.key, ["Down", "ArrowDown"])) {
          return null;
        }

        return _vm.doManualSelect(_vm.selectedIndex, _vm.selectedIndex + 1);
      }]
    }
  }, [_vm.arrows ? _vm._ssrNode("<div class=\"picker_arrow top\">", "</div>", [_vm._t("arrow-top")], 2) : _vm._e(), _vm._ssrNode(" "), _vm._ssrNode("<div class=\"picker_wrapper\">", "</div>", [_vm._ssrNode("<ul class=\"picker_options\"" + _vm._ssrStyle(null, _vm.listStyle, null) + ">", "</ul>", _vm._l(_vm.visibleOptions, function (item, i) {
    return _vm._ssrNode("<li" + _vm._ssrAttr("data-index", i) + " class=\"picker_option\"" + _vm._ssrStyle(null, {
      top: _vm.itemHeight * -0.5 + "px",
      height: _vm.itemHeight + "px",
      'line-height': _vm.itemHeight + "px",
      transform: "rotateX(" + -_vm.rotationAngle * i + "deg) translate3d(0, 0, " + _vm.radius + "px)",
      visibility: item.visibility ? 'visible' : 'hidden'
    }, null) + ">", "</li>", [_vm._t("option", function () {
      return [_vm._v("\n          " + _vm._s(item.text) + "\n        ")];
    }, null, item)], 2);
  }), 0), _vm._ssrNode(" "), _vm._ssrNode("<div class=\"picker_chosen\"" + _vm._ssrStyle(null, {
    height: _vm.itemHeight + "px",
    'line-height': _vm.itemHeight + "px"
  }, null) + ">", "</div>", [_vm._ssrNode("<ul class=\"picker_chosen_list\"" + _vm._ssrStyle(null, _vm.highlightListStyle, null) + ">", "</ul>", _vm._l(_vm.visibleOptions, function (item, i) {
    return _vm._ssrNode("<li class=\"picker_chosen_item\"" + _vm._ssrStyle(null, "height: " + _vm.itemHeight + "px", null) + ">", "</li>", [_vm._t("option", function () {
      return [_vm._v("\n            " + _vm._s(item.text) + "\n          ")];
    }, null, item)], 2);
  }), 0)])], 2), _vm._ssrNode(" "), _vm.arrows ? _vm._ssrNode("<div class=\"picker_arrow bottom\">", "</div>", [_vm._t("arrow-bottom")], 2) : _vm._e()], 2);
};

var __vue_staticRenderFns__ = [];
/* style */

var __vue_inject_styles__ = function __vue_inject_styles__(inject) {
  if (!inject) return;
  inject("data-v-132a8022_0", {
    source: ".picker{position:relative;overflow-y:auto;overscroll-behavior:none;scrollbar-width:none;-ms-overflow-style:none}.picker::-webkit-scrollbar{display:none}.picker:focus{outline:0}.picker_wrapper{position:relative;height:100%;width:100%;flex-grow:1;overflow:hidden}.picker_options{position:absolute;top:50%;left:0;width:100%;height:0;transform-style:preserve-3d;margin:0 auto;padding:0 0;display:block;transform:translateZ(-150px) rotateX(0);-webkit-font-smoothing:subpixel-antialiased;list-style:none}.picker_option{position:absolute;top:0;left:0;width:100%;height:50px;user-select:none;-webkit-font-smoothing:subpixel-antialiased}.picker_chosen{position:absolute;top:50%;width:100%;transform:translate(0,-50%);overflow:hidden}.picker_chosen_list{position:absolute;width:100%;margin:0;padding:0;list-style:none}.picker_arrow,.picker_chosen_item{user-select:none}.picker_arrow{cursor:pointer}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


var __vue_scope_id__ = undefined;
/* module identifier */

var __vue_module_identifier__ = "data-v-132a8022";
/* functional template */

var __vue_is_functional_template__ = false;
/* style inject shadow dom */

var __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, undefined, createInjectorSSR, undefined);// Import vue component

// Default export is installable instance of component.
// IIFE injects install function into component, allowing component
// to be registered via Vue.use() as well as Vue.component(),
var component = /*#__PURE__*/(function () {
  // Assign InstallableComponent type
  var installable = __vue_component__; // Attach install function executed by Vue.use()

  installable.install = function (Vue) {
    Vue.component('Picker', installable);
  };

  return installable;
})(); // It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = directive;
var namedExports=/*#__PURE__*/Object.freeze({__proto__:null,'default':component});// only expose one global var, with named exports exposed as properties of
// that global var (eg. plugin.namedExport)

Object.entries(namedExports).forEach(function (_ref) {
  var _ref2 = _slicedToArray(_ref, 2),
      exportName = _ref2[0],
      exported = _ref2[1];

  if (exportName !== 'default') component[exportName] = exported;
});module.exports=component;