(function (global) {
  'use strict';

  var EduInteract = {
    VERSION: '1.0.0',

    FlipCard: global.EduFlipCard,
    DragMatch: global.EduDragMatch,
    QuizVote: global.EduQuizVote,
    ProgressBar: global.EduProgressBar,

    utils: {
      dom: global.EduDom,
      keyboard: global.EduKeyboard,
      events: global.EduEvents
    },

    createFlipCard: function (options) {
      return new global.EduFlipCard(options);
    },

    createDragMatch: function (options) {
      return new global.EduDragMatch(options);
    },

    createQuizVote: function (options) {
      return new global.EduQuizVote(options);
    },

    createProgressBar: function (options) {
      return new global.EduProgressBar(options);
    },

    autoInit: function (selector) {
      selector = selector || '[data-edu-component]';
      var elements = document.querySelectorAll(selector);
      var instances = [];

      elements.forEach(function (el) {
        var type = el.getAttribute('data-edu-component');
        var dataAttr = el.getAttribute('data-edu-data');
        var data = null;

        if (dataAttr) {
          try {
            data = JSON.parse(dataAttr);
          } catch (e) {
            console.warn('EduInteract: 无效的 data-edu-data JSON:', e);
          }
        }

        var options = { el: el };
        if (data) {
          options.data = data;
        }

        try {
          var instance;
          switch (type) {
            case 'flip-card':
              instance = new global.EduFlipCard(options);
              break;
            case 'drag-match':
              instance = new global.EduDragMatch(options);
              break;
            case 'quiz-vote':
              instance = new global.EduQuizVote(options);
              break;
            case 'progress-bar':
              instance = new global.EduProgressBar(options);
              break;
            default:
              console.warn('EduInteract: 未知组件类型:', type);
              return;
          }
          instances.push(instance);
          el.__eduInstance = instance;
        } catch (e) {
          console.error('EduInteract: 组件初始化失败:', e);
        }
      });

      return instances;
    },

    setTheme: function (theme) {
      if (!theme || typeof theme !== 'object') return;

      var root = document.documentElement;
      var themeMap = {
        primary: '--edu-primary',
        primaryLight: '--edu-primary-light',
        primaryDark: '--edu-primary-dark',
        success: '--edu-success',
        error: '--edu-error',
        warning: '--edu-warning',
        bg: '--edu-bg',
        text: '--edu-text',
        textSecondary: '--edu-text-secondary',
        border: '--edu-border',
        radius: '--edu-radius',
        shadow: '--edu-shadow'
      };

      for (var key in theme) {
        if (theme.hasOwnProperty(key) && themeMap[key]) {
          root.style.setProperty(themeMap[key], theme[key]);
        }
      }
    },

    confetti: function (options) {
      options = options || {};
      var count = options.count || 50;
      var colors = options.colors || [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#EC4899'
      ];
      var duration = options.duration || 3000;

      var container = document.createElement('div');
      container.className = 'edu-complete-animation';
      document.body.appendChild(container);

      for (var i = 0; i < count; i++) {
        var confetti = document.createElement('div');
        confetti.className = 'edu-confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.width = (Math.random() * 8 + 6) + 'px';
        confetti.style.height = (Math.random() * 8 + 6) + 'px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        
        container.appendChild(confetti);
      }

      setTimeout(function () {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, duration + 1000);

      return container;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EduInteract;
  }

  global.EduInteract = EduInteract;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.querySelectorAll('[data-edu-auto-init]').length > 0) {
        EduInteract.autoInit('[data-edu-component]');
      }
    });
  } else {
    if (document.querySelectorAll('[data-edu-auto-init]').length > 0) {
      EduInteract.autoInit('[data-edu-component]');
    }
  }

})(window);
