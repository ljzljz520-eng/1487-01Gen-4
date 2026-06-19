(function (global) {
  'use strict';

  function on(el, event, handler, options) {
    if (!el) return;
    el.addEventListener(event, handler, options || false);
  }

  function off(el, event, handler, options) {
    if (!el) return;
    el.removeEventListener(event, handler, options || false);
  }

  function once(el, event, handler, options) {
    if (!el) return;
    var wrapper = function (e) {
      handler(e);
      off(el, event, wrapper, options);
    };
    on(el, event, wrapper, options);
  }

  function delegate(container, selector, event, handler) {
    if (!container) return function () {};
    
    function listener(e) {
      var target = e.target;
      while (target && target !== container) {
        if (target.matches && target.matches(selector)) {
          handler.call(target, e, target);
          return;
        }
        target = target.parentNode;
      }
    }
    
    on(container, event, listener);
    
    return function destroy() {
      off(container, event, listener);
    };
  }

  function trigger(el, eventName, detail) {
    if (!el) return;
    var event;
    if (typeof CustomEvent === 'function') {
      event = new CustomEvent(eventName, {
        detail: detail,
        bubbles: true,
        cancelable: true
      });
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName, true, true, detail);
    }
    el.dispatchEvent(event);
  }

  function EventEmitter() {
    this._events = {};
  }

  EventEmitter.prototype.on = function (event, listener) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
    return this;
  };

  EventEmitter.prototype.off = function (event, listener) {
    if (!this._events[event]) return this;
    if (!listener) {
      this._events[event] = [];
      return this;
    }
    var index = this._events[event].indexOf(listener);
    if (index !== -1) {
      this._events[event].splice(index, 1);
    }
    return this;
  };

  EventEmitter.prototype.once = function (event, listener) {
    var self = this;
    function wrapper() {
      self.off(event, wrapper);
      listener.apply(this, arguments);
    }
    this.on(event, wrapper);
    return this;
  };

  EventEmitter.prototype.emit = function (event) {
    if (!this._events[event]) return this;
    var args = Array.prototype.slice.call(arguments, 1);
    var listeners = this._events[event].slice();
    for (var i = 0; i < listeners.length; i++) {
      listeners[i].apply(this, args);
    }
    return this;
  };

  EventEmitter.prototype.removeAllListeners = function (event) {
    if (event) {
      this._events[event] = [];
    } else {
      this._events = {};
    }
    return this;
  };

  function throttle(fn, wait) {
    var lastTime = 0;
    var timeoutId = null;
    var lastArgs = null;
    
    function throttled() {
      var now = Date.now();
      var remaining = wait - (now - lastTime);
      lastArgs = arguments;
      
      if (remaining <= 0) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        lastTime = now;
        fn.apply(this, lastArgs);
      } else if (!timeoutId) {
        timeoutId = setTimeout(function () {
          lastTime = Date.now();
          timeoutId = null;
          fn.apply(this, lastArgs);
        }.bind(this), remaining);
      }
    }
    
    throttled.cancel = function () {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    return throttled;
  }

  function debounce(fn, wait, immediate) {
    var timeoutId = null;
    
    function debounced() {
      var context = this;
      var args = arguments;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (immediate && !timeoutId) {
        fn.apply(context, args);
      }
      
      timeoutId = setTimeout(function () {
        timeoutId = null;
        if (!immediate) {
          fn.apply(context, args);
        }
      }, wait);
    }
    
    debounced.cancel = function () {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    return debounced;
  }

  function raf(callback) {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(callback);
    }
    return setTimeout(callback, 16);
  }

  function cancelRaf(id) {
    if (typeof cancelAnimationFrame === 'function') {
      return cancelAnimationFrame(id);
    }
    return clearTimeout(id);
  }

  global.EduEvents = {
    on: on,
    off: off,
    once: once,
    delegate: delegate,
    trigger: trigger,
    EventEmitter: EventEmitter,
    throttle: throttle,
    debounce: debounce,
    raf: raf,
    cancelRaf: cancelRaf
  };

})(window);
