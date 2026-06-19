(function (global) {
  'use strict';

  var KEYS = {
    TAB: 'Tab',
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    BACKSPACE: 'Backspace',
    DELETE: 'Delete'
  };

  function isKeyboardEvent(e) {
    return e instanceof KeyboardEvent;
  }

  function isKey(e, key) {
    if (!isKeyboardEvent(e)) return false;
    if (Array.isArray(key)) {
      return key.indexOf(e.key) !== -1;
    }
    return e.key === key;
  }

  function isNumberKey(e) {
    if (!isKeyboardEvent(e)) return false;
    return /^[0-9]$/.test(e.key);
  }

  function getNumberKeyValue(e) {
    if (isNumberKey(e)) {
      return parseInt(e.key, 10);
    }
    return -1;
  }

  function isNavigationKey(e) {
    return isKey(e, [
      KEYS.TAB,
      KEYS.LEFT,
      KEYS.RIGHT,
      KEYS.UP,
      KEYS.DOWN,
      KEYS.HOME,
      KEYS.END,
      KEYS.PAGE_UP,
      KEYS.PAGE_DOWN
    ]);
  }

  function isActionKey(e) {
    return isKey(e, [KEYS.ENTER, KEYS.SPACE]);
  }

  function preventDefault(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
  }

  function stopPropagation(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  }

  function getFocusableElements(container) {
    if (!container) return [];
    var selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    var elements = container.querySelectorAll(selectors);
    return Array.prototype.filter.call(elements, function(el) {
      return el.offsetParent !== null || getComputedStyle(el).visibility !== 'hidden';
    });
  }

  function focusFirst(container) {
    var elements = getFocusableElements(container);
    if (elements.length > 0) {
      elements[0].focus();
      return elements[0];
    }
    return null;
  }

  function focusLast(container) {
    var elements = getFocusableElements(container);
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
      return elements[elements.length - 1];
    }
    return null;
  }

  function focusNext(container, current) {
    var elements = getFocusableElements(container);
    var currentIndex = elements.indexOf(current || document.activeElement);
    var nextIndex = currentIndex + 1;
    if (nextIndex >= elements.length) {
      nextIndex = 0;
    }
    if (elements[nextIndex]) {
      elements[nextIndex].focus();
      return elements[nextIndex];
    }
    return null;
  }

  function focusPrev(container, current) {
    var elements = getFocusableElements(container);
    var currentIndex = elements.indexOf(current || document.activeElement);
    var prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = elements.length - 1;
    }
    if (elements[prevIndex]) {
      elements[prevIndex].focus();
      return elements[prevIndex];
    }
    return null;
  }

  function setupTrapFocus(container) {
    function handleKeyDown(e) {
      if (!isKey(e, KEYS.TAB)) return;
      
      var elements = getFocusableElements(container);
      var first = elements[0];
      var last = elements[elements.length - 1];
      var active = document.activeElement;
      
      if (e.shiftKey && active === first) {
        preventDefault(e);
        last.focus();
      } else if (!e.shiftKey && active === last) {
        preventDefault(e);
        first.focus();
      }
    }
    
    container.addEventListener('keydown', handleKeyDown);
    
    return function destroy() {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  function createKeyboardHandler(options) {
    options = options || {};
    var handlers = options.handlers || {};
    
    return function handleKeyDown(e) {
      var key = e.key;
      
      if (handlers[key]) {
        handlers[key](e);
        return;
      }
      
      if (isNumberKey(e) && handlers.number) {
        handlers.number(e, getNumberKeyValue(e));
        return;
      }
      
      if (isActionKey(e) && handlers.action) {
        handlers.action(e);
        return;
      }
      
      if (isNavigationKey(e) && handlers.navigation) {
        handlers.navigation(e);
      }
    };
  }

  global.EduKeyboard = {
    KEYS: KEYS,
    isKey: isKey,
    isNumberKey: isNumberKey,
    getNumberKeyValue: getNumberKeyValue,
    isNavigationKey: isNavigationKey,
    isActionKey: isActionKey,
    preventDefault: preventDefault,
    stopPropagation: stopPropagation,
    getFocusableElements: getFocusableElements,
    focusFirst: focusFirst,
    focusLast: focusLast,
    focusNext: focusNext,
    focusPrev: focusPrev,
    setupTrapFocus: setupTrapFocus,
    createKeyboardHandler: createKeyboardHandler
  };

})(window);
