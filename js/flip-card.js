(function (global) {
  'use strict';

  var dom = global.EduDom;
  var keyboard = global.EduKeyboard;
  var events = global.EduEvents;

  function FlipCard(options) {
    if (!options || !options.el) {
      throw new Error('FlipCard: el option is required');
    }

    this.options = Object.assign({
      data: [],
      keyboard: true,
      onFlip: null,
      onComplete: null
    }, options);

    this.el = dom.getElement(options.el);
    if (!this.el) {
      throw new Error('FlipCard: element not found');
    }

    this.currentIndex = 0;
    this.flippedCards = {};
    this.isFlipped = false;
    this._isAnimating = false;

    this._init();
  }

  FlipCard.prototype._init = function () {
    this._buildHTML();
    this._bindEvents();
    this._render();
    
    dom.addClass(this.el, 'edu-component');
  };

  FlipCard.prototype._buildHTML = function () {
    var data = this.options.data;
    
    var html = '<div class="edu-flip-card" role="region" aria-label="翻卡互动，使用方向键切换，空格键翻转">' +
      '<div class="edu-flip-card__container" tabindex="0" role="button" aria-pressed="false">' +
        '<div class="edu-flip-card__face edu-flip-card__face--front">' +
          '<span class="edu-flip-card__label">问题</span>' +
          '<div class="edu-flip-card__content"></div>' +
          '<span class="edu-flip-card__hint">' +
            '<span class="edu-flip-card__hint-icon">👆</span>' +
            '点击卡片或按空格查看答案' +
          '</span>' +
        '</div>' +
        '<div class="edu-flip-card__face edu-flip-card__face--back">' +
          '<span class="edu-flip-card__label">答案</span>' +
          '<div class="edu-flip-card__content"></div>' +
          '<span class="edu-flip-card__hint">' +
            '<span class="edu-flip-card__hint-icon">👆</span>' +
            '点击卡片返回问题' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="edu-flip-card__nav">' +
        '<button type="button" class="edu-flip-card__nav-btn edu-flip-card__prev" aria-label="上一张" ' + (data.length <= 1 ? 'disabled' : '') + '>‹</button>' +
        '<span class="edu-flip-card__indicator">1 / ' + data.length + '</span>' +
        '<button type="button" class="edu-flip-card__nav-btn edu-flip-card__next" aria-label="下一张" ' + (data.length <= 1 ? 'disabled' : '') + '>›</button>' +
      '</div>' +
      '<div class="edu-flip-card__progress" role="tablist" aria-label="卡片导航"></div>' +
    '</div>';

    this.el.innerHTML = html;
    
    this.$card = dom.$('.edu-flip-card', this.el);
    this.$container = dom.$('.edu-flip-card__container', this.el);
    this.$frontContent = dom.$('.edu-flip-card__face--front .edu-flip-card__content', this.el);
    this.$backContent = dom.$('.edu-flip-card__face--back .edu-flip-card__content', this.el);
    this.$prevBtn = dom.$('.edu-flip-card__prev', this.el);
    this.$nextBtn = dom.$('.edu-flip-card__next', this.el);
    this.$indicator = dom.$('.edu-flip-card__indicator', this.el);
    this.$progress = dom.$('.edu-flip-card__progress', this.el);

    this._buildDots();
  };

  FlipCard.prototype._buildDots = function () {
    var data = this.options.data;
    var dotsHtml = '';
    for (var i = 0; i < data.length; i++) {
      dotsHtml += '<button type="button" class="edu-flip-card__dot' + (i === 0 ? ' is-active' : '') + '" ' +
        'role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" ' +
        'aria-label="第 ' + (i + 1) + ' 张卡片" ' +
        'data-index="' + i + '"></button>';
    }
    this.$progress.innerHTML = dotsHtml;
    this.$dots = dom.$$('.edu-flip-card__dot', this.$progress);
  };

  FlipCard.prototype._bindEvents = function () {
    var self = this;

    events.on(this.$container, 'click', function () {
      self.toggle();
    });

    events.on(this.$prevBtn, 'click', function (e) {
      e.stopPropagation();
      self.prev();
    });

    events.on(this.$nextBtn, 'click', function (e) {
      e.stopPropagation();
      self.next();
    });

    events.on(this.$progress, 'click', function (e) {
      var target = e.target;
      if (target.classList.contains('edu-flip-card__dot')) {
        var index = parseInt(target.getAttribute('data-index'), 10);
        self.goTo(index);
      }
    });

    if (this.options.keyboard) {
      events.on(this.el, 'keydown', function (e) {
        self._handleKeyDown(e);
      });
    }
  };

  FlipCard.prototype._handleKeyDown = function (e) {
    var key = e.key;

    if (key === keyboard.KEYS.LEFT) {
      keyboard.preventDefault(e);
      this.prev();
    } else if (key === keyboard.KEYS.RIGHT) {
      keyboard.preventDefault(e);
      this.next();
    } else if (key === keyboard.KEYS.HOME) {
      keyboard.preventDefault(e);
      this.goTo(0);
    } else if (key === keyboard.KEYS.END) {
      keyboard.preventDefault(e);
      this.goTo(this.options.data.length - 1);
    } else if (keyboard.isActionKey(e)) {
      keyboard.preventDefault(e);
      if (e.target === this.$container) {
        this.toggle();
      }
    }
  };

  FlipCard.prototype._render = function () {
    var data = this.options.data;
    var currentCard = data[this.currentIndex];

    if (currentCard) {
      this.$frontContent.textContent = currentCard.front;
      this.$backContent.textContent = currentCard.back;
    }

    this.$indicator.textContent = (this.currentIndex + 1) + ' / ' + data.length;

    this.$prevBtn.disabled = this.currentIndex === 0;
    this.$nextBtn.disabled = this.currentIndex === data.length - 1;

    for (var i = 0; i < this.$dots.length; i++) {
      var dot = this.$dots[i];
      var isActive = i === this.currentIndex;
      var isFlipped = this.flippedCards[i];
      
      dom.toggleClass(dot, 'is-active', isActive);
      dom.toggleClass(dot, 'is-flipped', isFlipped);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }

    if (this.isFlipped) {
      dom.addClass(this.$card, 'is-flipped');
      this.$container.setAttribute('aria-pressed', 'true');
    } else {
      dom.removeClass(this.$card, 'is-flipped');
      this.$container.setAttribute('aria-pressed', 'false');
    }
  };

  FlipCard.prototype.toggle = function () {
    if (this._isAnimating) return;
    
    this._isAnimating = true;
    var self = this;

    this.isFlipped = !this.isFlipped;
    
    if (this.isFlipped) {
      this.flippedCards[this.currentIndex] = true;
    }

    this._render();

    setTimeout(function () {
      self._isAnimating = false;
    }, 400);

    if (typeof this.options.onFlip === 'function') {
      this.options.onFlip(this.currentIndex, this.isFlipped, this.options.data[this.currentIndex]);
    }

    var flippedCount = Object.keys(this.flippedCards).length;
    if (flippedCount === this.options.data.length && this.isFlipped && typeof this.options.onComplete === 'function') {
      this.options.onComplete(flippedCount);
    }
  };

  FlipCard.prototype.flip = function () {
    if (!this.isFlipped) {
      this.toggle();
    }
  };

  FlipCard.prototype.unflip = function () {
    if (this.isFlipped) {
      this.toggle();
    }
  };

  FlipCard.prototype.next = function () {
    if (this.currentIndex < this.options.data.length - 1) {
      this.goTo(this.currentIndex + 1);
    }
  };

  FlipCard.prototype.prev = function () {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  };

  FlipCard.prototype.goTo = function (index) {
    if (index === this.currentIndex) return;
    if (index < 0 || index >= this.options.data.length) return;

    if (this.isFlipped) {
      this.isFlipped = false;
    }

    this.currentIndex = index;
    this._render();
  };

  FlipCard.prototype.reset = function () {
    this.currentIndex = 0;
    this.flippedCards = {};
    this.isFlipped = false;
    this._render();
  };

  FlipCard.prototype.destroy = function () {
    this.el.innerHTML = '';
    dom.removeClass(this.el, 'edu-component');
  };

  global.EduFlipCard = FlipCard;

})(window);
