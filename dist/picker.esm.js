import Vue from 'vue';

const MAX_RENDERED_AMOUNT = 60;
const isTouchEvent = evt => ['touchstart', 'touchmove', 'touchend'].includes(evt.type);
/** EaseOutQuart easing function */

const easing = pos => {
  return -(Math.pow(pos - 1, 4) - 1);
};
const getVisibleOptions = (source, index) => {
  const min = index - MAX_RENDERED_AMOUNT / 2 < 0 ? 0 : index - MAX_RENDERED_AMOUNT / 2;
  const max = min + MAX_RENDERED_AMOUNT > source.length ? source.length : min + MAX_RENDERED_AMOUNT;
  return {
    options: source.slice(min, max),
    start: Math.floor(min)
  };
};
const calculateVelocity = (yArr, itemHeight) => {
  let velocity;

  if (yArr.length === 1) {
    velocity = 0;
  } else {
    const startTime = yArr[yArr.length - 2][1];
    const endTime = yArr[yArr.length - 1][1];
    const startY = yArr[yArr.length - 2][0];
    const endY = yArr[yArr.length - 1][0]; // Calculated speed

    velocity = (startY - endY) / itemHeight * 1000 / (endTime - startTime);
    const sign = velocity > 0 ? 1 : -1;
    velocity = Math.abs(velocity) > 30 ? 30 * sign : velocity;
  }

  return velocity;
};
const wheelDebounce = (start, end, timer) => {
  let timeout;
  return e => {
    clearTimeout(timeout);
    start(e);
    timeout = setTimeout(() => end(), timer);
  };
};

var script = Vue.extend({
  name: 'Picker',
  props: {
    /** An array of options in format { value: string, text: string } to be displayed in the Picker */
    options: {
      type: Array,
      default: () => []
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
      validator: function (value) {
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
      validator: function (value) {
        return value % 2 === 0;
      }
    },

    /** If 'infinite' is passed, then you can scroll the Picker forever, all values will repeat */
    type: {
      type: String,
      default: 'normal',
      validator: function (value) {
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

  data() {
    const selected = this.value?.value ? this.options.findIndex(option => option.value === this.value?.value) : 0;
    const selectedIndex = selected > -1 ? selected : 0;
    const options = getVisibleOptions(this.options, selectedIndex); // const circular = initCircularBuffer(this.options, selectedIndex);

    return {
      listStyle: {
        transform: `transform: translate3d(0, 0, ${-this.radius}px) rotateX(0deg)`
      },
      highlightListStyle: {
        transform: `translate3d(0, 0, 0)`
      },
      source: this.options,
      // Options {value: xx, text: xx}
      visibleOptions: options.options,
      visibleOptionsIndex: options.start,
      selected: this.value || this.options?.[0] || null,
      selectedIndex,
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
    debounced() {
      return wheelDebounce(this.wheel, this.endWheel, 100);
    },

    rotationAngle() {
      return 360 / this.visibleOptions.length;
    }

  },

  mounted() {
    document.addEventListener('mousedown', this.touchstart);
    document.addEventListener('mouseup', this.touchend); // Move to the initial value

    this.moveTo(this.selectedIndex);
  },

  watch: {
    value(val) {
      if (val?.value === this.selected?.value) return;
      const newIndex = val?.value ? this.source.findIndex(option => option.value === this.value?.value) : 0;
      this.selected = val;
      if (this.selectedIndex !== newIndex) this.selectedIndex = newIndex;
      this.animateToScroll(this.selectedIndex, newIndex);
    }

  },
  methods: {
    changeSelectedIndex(newIndex) {
      if (Math.abs(newIndex - this.prevSelectedIndex) > this.visibleOptionsAmount / 2) {
        const options = getVisibleOptions(this.source, newIndex);
        this.visibleOptions = options.options;
        this.visibleOptionsIndex = options.start;
        this.prevSelectedIndex = this.selectedIndex;
      }

      this.selectedIndex = newIndex;
    },

    startRoll(yPos) {
      this.touchData.startY = yPos;
      this.touchData.yArr = [[yPos, new Date().getTime()]];
      this.touchData.touchScroll = this.selectedIndex;
      this.stop();
    },

    doRoll(yPos) {
      this.touchData.yArr.push([yPos, new Date().getTime()]); // Calculate new selected index by the item height and the scrolled amount

      const scrollAdd = (this.touchData.startY - yPos) / this.itemHeight;
      let moveToScroll = scrollAdd + this.selectedIndex;

      if (this.type === 'normal') {
        if (moveToScroll < 0) {
          moveToScroll = this.wheeling ? Math.max(-1.5, moveToScroll * 0.05) : moveToScroll * 0.3;
        } else if (moveToScroll > this.source.length) {
          const toPos = moveToScroll - this.source.length;
          moveToScroll = this.source.length + (this.wheeling ? Math.min(1.5, toPos * 0.05) : toPos * 0.3);
        }
      } else {
        moveToScroll = this.normalizeScroll(moveToScroll);
      }

      this.touchData.touchScroll = this.moveTo(moveToScroll);
    },

    endRoll() {
      const velocity = calculateVelocity(this.touchData.yArr, this.itemHeight);
      this.changeSelectedIndex(this.touchData.touchScroll);
      this.animateMoveByVelocity(velocity);
    },

    touchstart(e) {
      if (e.target) e.target.addEventListener('touchmove', this.touchmove);
      document.addEventListener('mousemove', this.touchmove);
      const eventY = isTouchEvent(e) ? e.touches[0].clientY : e.clientY;
      this.touchData.delta = 0;
      this.startRoll(eventY);
    },

    touchmove(e) {
      e.preventDefault();
      const eventY = isTouchEvent(e) ? e.touches[0].clientY : e.clientY;
      this.doRoll(eventY);
    },

    wheel(e) {
      e.preventDefault();

      if (!this.wheeling) {
        this.wheeling = true;
        const startPos = e.clientY;
        this.touchData.delta = e.deltaY;
        this.startRoll(startPos);
      } else {
        this.touchData.delta -= e.deltaY;
        this.doRoll(this.touchData.startY + this.touchData.delta);
      }
    },

    endWheel() {
      this.endRoll();
      this.wheeling = false;
    },

    touchend(e) {
      if (e.target) e.target.removeEventListener('touchmove', this.touchmove);
      document.removeEventListener('mousemove', this.touchmove);
      this.endRoll();
    },

    normalizeScroll(scroll) {
      let normalizedScroll = scroll;

      while (normalizedScroll < 0) {
        normalizedScroll += this.source.length;
      }

      normalizedScroll = normalizedScroll % this.source.length;
      return normalizedScroll;
    },

    /** Immediate move to some index in the options array */
    moveTo(newIndex) {
      if (this.type === 'infinite') {
        this.changeSelectedIndex(this.normalizeScroll(newIndex));
      }

      if (!this.source.length) {
        return 0;
      }

      this.listStyle.transform = `translate3d(0, 0, ${-this.radius}px) rotateX(${this.rotationAngle * (newIndex - this.visibleOptionsIndex)}deg)`;
      this.highlightListStyle.transform = `translate3d(0, ${-(newIndex - this.visibleOptionsIndex) * this.itemHeight}px, 0)`;
      this.visibleOptions = this.visibleOptions.map((item, index) => {
        item.visibility = Math.abs(this.visibleOptionsIndex + index - newIndex) <= this.visibleOptionsAmount / 2;
        return item;
      });
      return newIndex;
    },

    /**
     * At initial speed scroll (?) initV
     * @param {init} initV， initV Will be reset
     * To ensure scrolling to integers based on acceleration of scroll (Guaranteed to pass Scroll Target a selected value)
     */
    animateMoveByVelocity(initV) {
      let initScroll;
      let finalScroll;
      let totalScrollLen;
      let a; // Acceleration

      let t; // Time

      if (this.type === 'normal') {
        if (this.selectedIndex < 0 || this.selectedIndex > this.source.length - 1) {
          a = this.maxAcceleration;
          initScroll = this.selectedIndex;
          finalScroll = this.selectedIndex < 0 ? 0 : this.source.length - 1;
          totalScrollLen = initScroll - finalScroll;
          t = Math.sqrt(Math.abs(totalScrollLen / a));
          this.animateToScroll(initScroll, finalScroll, t)?.then(() => this.selectByScroll(this.selectedIndex));
        } else {
          initScroll = this.selectedIndex;
          a = initV > 0 ? -this.sensitivity : this.sensitivity; // Is acceleration or deceleration

          t = Math.abs(initV / a); // Speed reduced to 0 takes time

          totalScrollLen = initV * t + a * t * t / 2; // Total rolling length

          finalScroll = Math.round(this.selectedIndex + totalScrollLen); // Round to ensure accuracy and finally scroll to an integer

          finalScroll = finalScroll < 0 ? 0 : finalScroll > this.source.length - 1 ? this.source.length - 1 : finalScroll;
          totalScrollLen = finalScroll - initScroll;
          t = Math.sqrt(Math.abs(totalScrollLen / a));
          this.animateToScroll(this.selectedIndex, finalScroll, t)?.then(() => this.selectByScroll(this.selectedIndex));
        }
      } else {
        a = initV > 0 ? -this.sensitivity : this.sensitivity; // Deceleration/Acceleration

        t = Math.abs(initV / a); // Speed reduced to 0 takes time

        totalScrollLen = initV * t + a * t * t / 2; // Total rolling length

        finalScroll = Math.round(this.selectedIndex + totalScrollLen); // Round to ensure accuracy and finally scroll as an integer

        this.animateToScroll(this.selectedIndex, finalScroll, t)?.then(() => this.selectByScroll(this.selectedIndex));
      }
    },

    animateToScroll(initScroll, finalScroll) {
      let time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

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

      const start = new Date().getTime() / 1000;
      let pass = 0;
      const totalScrollLen = finalScroll - initScroll;
      return new Promise(resolve => {
        const tick = () => {
          pass = new Date().getTime() / 1000 - start;

          if (pass < time) {
            this.changeSelectedIndex(this.moveTo(initScroll + easing(pass / time) * totalScrollLen));
            this.requestAnimationId = requestAnimationFrame(tick);
          } else {
            resolve();
            this.stop();
            this.changeSelectedIndex(this.moveTo(initScroll + totalScrollLen));
          }
        };

        tick();
      });
    },

    stop() {
      cancelAnimationFrame(this.requestAnimationId);
    },

    selectByScroll(scroll) {
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

    doManualSelect(initScroll, finalScroll) {
      let time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      this.animateToScroll(initScroll, finalScroll, time)?.then(() => this.selectByScroll(this.selectedIndex));
    }

  }
});

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
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
}

const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}

/* script */
const __vue_script__ = script;
/* template */

var __vue_render__ = function () {
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
  }, [_vm.arrows ? _c('div', {
    staticClass: "picker_arrow top",
    on: {
      "click": function ($event) {
        return _vm.doManualSelect(_vm.selectedIndex, _vm.selectedIndex - 1);
      }
    }
  }, [_vm._t("arrow-top")], 2) : _vm._e(), _vm._v(" "), _c('div', {
    staticClass: "picker_wrapper"
  }, [_c('ul', {
    staticClass: "picker_options",
    style: _vm.listStyle
  }, _vm._l(_vm.visibleOptions, function (item, i) {
    return _c('li', {
      key: item.value,
      staticClass: "picker_option",
      style: {
        top: _vm.itemHeight * -0.5 + "px",
        height: _vm.itemHeight + "px",
        'line-height': _vm.itemHeight + "px",
        transform: "rotateX(" + -_vm.rotationAngle * i + "deg) translate3d(0, 0, " + _vm.radius + "px)",
        visibility: item.visibility ? 'visible' : 'hidden'
      },
      attrs: {
        "data-index": i
      }
    }, [_vm._t("option", function () {
      return [_vm._v("\n          " + _vm._s(item.text) + "\n        ")];
    }, null, item)], 2);
  }), 0), _vm._v(" "), _c('div', {
    staticClass: "picker_chosen",
    style: {
      height: _vm.itemHeight + "px",
      'line-height': _vm.itemHeight + "px"
    }
  }, [_c('ul', {
    staticClass: "picker_chosen_list",
    style: _vm.highlightListStyle
  }, _vm._l(_vm.visibleOptions, function (item, i) {
    return _c('li', {
      key: i,
      staticClass: "picker_chosen_item",
      style: "height: " + _vm.itemHeight + "px"
    }, [_vm._t("option", function () {
      return [_vm._v("\n            " + _vm._s(item.text) + "\n          ")];
    }, null, item)], 2);
  }), 0)])]), _vm._v(" "), _vm.arrows ? _c('div', {
    staticClass: "picker_arrow bottom",
    on: {
      "click": function ($event) {
        return _vm.doManualSelect(_vm.selectedIndex, _vm.selectedIndex + 1);
      }
    }
  }, [_vm._t("arrow-bottom")], 2) : _vm._e()]);
};

var __vue_staticRenderFns__ = [];
/* style */

const __vue_inject_styles__ = function (inject) {
  if (!inject) return;
  inject("data-v-132a8022_0", {
    source: ".picker{position:relative;overflow-y:auto;overscroll-behavior:none;scrollbar-width:none;-ms-overflow-style:none}.picker::-webkit-scrollbar{display:none}.picker:focus{outline:0}.picker_wrapper{position:relative;height:100%;width:100%;flex-grow:1;overflow:hidden}.picker_options{position:absolute;top:50%;left:0;width:100%;height:0;transform-style:preserve-3d;margin:0 auto;padding:0 0;display:block;transform:translateZ(-150px) rotateX(0);-webkit-font-smoothing:subpixel-antialiased;list-style:none}.picker_option{position:absolute;top:0;left:0;width:100%;height:50px;user-select:none;-webkit-font-smoothing:subpixel-antialiased}.picker_chosen{position:absolute;top:50%;width:100%;transform:translate(0,-50%);overflow:hidden}.picker_chosen_list{position:absolute;width:100%;margin:0;padding:0;list-style:none}.picker_arrow,.picker_chosen_item{user-select:none}.picker_arrow{cursor:pointer}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


const __vue_scope_id__ = undefined;
/* module identifier */

const __vue_module_identifier__ = undefined;
/* functional template */

const __vue_is_functional_template__ = false;
/* style inject SSR */

/* style inject shadow dom */

const __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, createInjector, undefined, undefined);

// Import vue component

// Default export is installable instance of component.
// IIFE injects install function into component, allowing component
// to be registered via Vue.use() as well as Vue.component(),
var entry_esm = /*#__PURE__*/(() => {
  // Assign InstallableComponent type
  const installable = __vue_component__; // Attach install function executed by Vue.use()

  installable.install = Vue => {
    Vue.component('Picker', installable);
  };

  return installable;
})(); // It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = directive;

export { entry_esm as default };
