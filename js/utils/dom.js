(function (global) {
  'use strict';

  function $(selector, context) {
    context = context || document;
    return context.querySelector(selector);
  }

  function $$(selector, context) {
    context = context || document;
    return Array.prototype.slice.call(context.querySelectorAll(selector));
  }

  function createElement(tag, className, html) {
    var el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (html !== undefined && html !== null) {
      if (typeof html === 'string') {
        el.innerHTML = html;
      } else if (html instanceof HTMLElement) {
        el.appendChild(html);
      }
    }
    return el;
  }

  function getElement(el) {
    if (typeof el === 'string') {
      return document.querySelector(el);
    }
    if (el instanceof HTMLElement) {
      return el;
    }
    return null;
  }

  function addClass(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else {
      el.className += ' ' + className;
    }
  }

  function removeClass(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }

  function hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    }
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
  }

  function toggleClass(el, className, force) {
    if (force !== undefined) {
      if (force) {
        addClass(el, className);
      } else {
        removeClass(el, className);
      }
      return force;
    }
    if (hasClass(el, className)) {
      removeClass(el, className);
      return false;
    }
    addClass(el, className);
    return true;
  }

  function setAttributes(el, attrs) {
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
  }

  function empty(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function getOffset(el) {
    var rect = el.getBoundingClientRect();
    return {
      top: rect.top + window.pageYOffset,
      left: rect.left + window.pageXOffset,
      width: rect.width,
      height: rect.height
    };
  }

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  global.EduDom = {
    $: $,
    $$: $$,
    createElement: createElement,
    getElement: getElement,
    addClass: addClass,
    removeClass: removeClass,
    hasClass: hasClass,
    toggleClass: toggleClass,
    setAttributes: setAttributes,
    empty: empty,
    getOffset: getOffset,
    isInViewport: isInViewport
  };

})(window);
