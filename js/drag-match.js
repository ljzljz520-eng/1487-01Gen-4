(function (global) {
  'use strict';

  var dom = global.EduDom;
  var keyboard = global.EduKeyboard;
  var events = global.EduEvents;

  function DragMatch(options) {
    if (!options || !options.el) {
      throw new Error('DragMatch: el option is required');
    }

    this.options = Object.assign({
      data: [],
      keyboard: true,
      allowRetry: true,
      title: '拖拽配对',
      leftColumnTitle: '左侧',
      rightColumnTitle: '右侧',
      onMatch: null,
      onComplete: null
    }, options);

    this.el = dom.getElement(options.el);
    if (!this.el) {
      throw new Error('DragMatch: element not found');
    }

    this.matchedPairs = {};
    this.selectedLeft = null;
    this.selectedRight = null;
    this.draggedItem = null;
    this.dragType = null;
    this.correctCount = 0;
    this.wrongAttempts = 0;
    this._isProcessing = false;

    this._shuffledRight = [];

    this._init();
  }

  DragMatch.prototype._init = function () {
    this._shuffleRight();
    this._buildHTML();
    this._bindEvents();
    this._updateStatus();
    
    dom.addClass(this.el, 'edu-component');
  };

  DragMatch.prototype._shuffleRight = function () {
    var data = this.options.data;
    var indices = [];
    for (var i = 0; i < data.length; i++) {
      indices.push(i);
    }
    
    for (var i = indices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = indices[i];
      indices[i] = indices[j];
      indices[j] = temp;
    }
    
    this._shuffledRight = indices;
  };

  DragMatch.prototype._buildHTML = function () {
    var data = this.options.data;
    
    var html = '<div class="edu-drag-match" role="region" aria-label="拖拽配对互动">';
    
    if (this.options.title) {
      html += '<h3 class="edu-drag-match__title">' + this.options.title + '</h3>';
    }
    
    html += '<div class="edu-drag-match__columns">' +
      '<div class="edu-drag-match__column edu-drag-match__column--left">' +
        '<div class="edu-drag-match__column-title">' + this.options.leftColumnTitle + '</div>' +
        '<div class="edu-drag-match__items" role="listbox" aria-label="左侧选项">';
    
    for (var i = 0; i < data.length; i++) {
      html += '<div class="edu-drag-match__item" ' +
        'role="option" ' +
        'tabindex="0" ' +
        'draggable="true" ' +
        'data-side="left" ' +
        'data-index="' + i + '" ' +
        'aria-selected="false">' +
        data[i].left +
      '</div>';
    }
    
    html += '</div></div>';
    
    html += '<div class="edu-drag-match__column edu-drag-match__column--right">' +
      '<div class="edu-drag-match__column-title">' + this.options.rightColumnTitle + '</div>' +
      '<div class="edu-drag-match__items" role="listbox" aria-label="右侧选项">';
    
    for (var i = 0; i < this._shuffledRight.length; i++) {
      var rightIndex = this._shuffledRight[i];
      html += '<div class="edu-drag-match__item" ' +
        'role="option" ' +
        'tabindex="0" ' +
        'draggable="true" ' +
        'data-side="right" ' +
        'data-original-index="' + rightIndex + '" ' +
        'data-display-index="' + i + '" ' +
        'aria-selected="false">' +
        data[rightIndex].right +
      '</div>';
    }
    
    html += '</div></div></div>';
    
    html += '<div class="edu-drag-match__status edu-drag-match__status--info" role="status" aria-live="polite">' +
      '选择左侧选项，再选择右侧选项进行配对' +
    '</div>';
    
    html += '<div class="edu-drag-match__score">' +
      '<div class="edu-drag-match__score-item edu-drag-match__score-item--correct">' +
        '<span class="edu-drag-match__score-value">0</span>' +
        '<span class="edu-drag-match__score-label">正确</span>' +
      '</div>' +
      '<div class="edu-drag-match__score-item edu-drag-match__score-item--total">' +
        '<span class="edu-drag-match__score-value">' + data.length + '</span>' +
        '<span class="edu-drag-match__score-label">总数</span>' +
      '</div>' +
    '</div>';
    
    html += '</div>';

    this.el.innerHTML = html;
    
    this.$leftItems = dom.$$('.edu-drag-match__column--left .edu-drag-match__item', this.el);
    this.$rightItems = dom.$$('.edu-drag-match__column--right .edu-drag-match__item', this.el);
    this.$status = dom.$('.edu-drag-match__status', this.el);
    this.$correctScore = dom.$('.edu-drag-match__score-item--correct .edu-drag-match__score-value', this.el);
  };

  DragMatch.prototype._bindEvents = function () {
    var self = this;

    this.$leftItems.forEach(function ($item) {
      self._bindItemEvents($item, 'left');
    });

    this.$rightItems.forEach(function ($item) {
      self._bindItemEvents($item, 'right');
    });

    if (this.options.keyboard) {
      events.on(this.el, 'keydown', function (e) {
        self._handleKeyDown(e);
      });
    }
  };

  DragMatch.prototype._bindItemEvents = function ($item, side) {
    var self = this;

    events.on($item, 'click', function () {
      if (self._isProcessing) return;
      self._handleItemClick($item, side);
    });

    events.on($item, 'dragstart', function (e) {
      if (self._isProcessing || $item.classList.contains('is-matched')) {
        e.preventDefault();
        return;
      }
      self.draggedItem = $item;
      self.dragType = side;
      $item.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', side + '-' + $item.getAttribute('data-index'));
    });

    events.on($item, 'dragend', function () {
      $item.classList.remove('is-dragging');
      self.draggedItem = null;
      self.dragType = null;
      
      self.$leftItems.concat(self.$rightItems).forEach(function (item) {
        item.classList.remove('is-drop-target');
      });
    });

    events.on($item, 'dragover', function (e) {
      if (self._isProcessing || $item.classList.contains('is-matched')) return;
      if (self.dragType === side) return;
      
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      $item.classList.add('is-drop-target');
    });

    events.on($item, 'dragleave', function () {
      $item.classList.remove('is-drop-target');
    });

    events.on($item, 'drop', function (e) {
      e.preventDefault();
      $item.classList.remove('is-drop-target');
      
      if (self._isProcessing || $item.classList.contains('is-matched')) return;
      if (!self.draggedItem || self.dragType === side) return;
      
      self._handleDrop(self.draggedItem, $item, self.dragType, side);
    });
  };

  DragMatch.prototype._handleItemClick = function ($item, side) {
    if ($item.classList.contains('is-matched')) return;

    if (side === 'left') {
      if (this.selectedLeft === $item) {
        this._deselectLeft();
      } else {
        this._selectLeft($item);
      }
    } else {
      if (this.selectedRight === $item) {
        this._deselectRight();
      } else {
        this._selectRight($item);
      }
    }

    this._tryMatch();
  };

  DragMatch.prototype._selectLeft = function ($item) {
    this._deselectLeft();
    this.selectedLeft = $item;
    $item.classList.add('is-selected');
    $item.setAttribute('aria-selected', 'true');
  };

  DragMatch.prototype._deselectLeft = function () {
    if (this.selectedLeft) {
      this.selectedLeft.classList.remove('is-selected');
      this.selectedLeft.setAttribute('aria-selected', 'false');
      this.selectedLeft = null;
    }
  };

  DragMatch.prototype._selectRight = function ($item) {
    this._deselectRight();
    this.selectedRight = $item;
    $item.classList.add('is-selected');
    $item.setAttribute('aria-selected', 'true');
  };

  DragMatch.prototype._deselectRight = function () {
    if (this.selectedRight) {
      this.selectedRight.classList.remove('is-selected');
      this.selectedRight.setAttribute('aria-selected', 'false');
      this.selectedRight = null;
    }
  };

  DragMatch.prototype._tryMatch = function () {
    if (!this.selectedLeft || !this.selectedRight) return;

    var leftIndex = parseInt(this.selectedLeft.getAttribute('data-index'), 10);
    var rightOriginalIndex = parseInt(this.selectedRight.getAttribute('data-original-index'), 10);

    this._performMatch(leftIndex, rightOriginalIndex, this.selectedLeft, this.selectedRight);
  };

  DragMatch.prototype._handleDrop = function ($dragged, $target, draggedSide, targetSide) {
    var draggedIndex, targetIndex;

    if (draggedSide === 'left') {
      draggedIndex = parseInt($dragged.getAttribute('data-index'), 10);
      targetIndex = parseInt($target.getAttribute('data-original-index'), 10);
      this._selectLeft($dragged);
      this._selectRight($target);
    } else {
      draggedIndex = parseInt($dragged.getAttribute('data-original-index'), 10);
      targetIndex = parseInt($target.getAttribute('data-index'), 10);
      this._selectLeft($target);
      this._selectRight($dragged);
    }

    this._performMatch(
      draggedSide === 'left' ? draggedIndex : targetIndex,
      draggedSide === 'left' ? targetIndex : draggedIndex,
      draggedSide === 'left' ? $dragged : $target,
      draggedSide === 'left' ? $target : $dragged
    );
  };

  DragMatch.prototype._performMatch = function (leftIndex, rightIndex, $leftItem, $rightItem) {
    var self = this;
    this._isProcessing = true;

    var isCorrect = leftIndex === rightIndex;
    var item = this.options.data[leftIndex];

    if (isCorrect) {
      this.correctCount++;
      this.matchedPairs[leftIndex] = true;

      $leftItem.classList.remove('is-selected');
      $rightItem.classList.remove('is-selected');
      $leftItem.classList.add('is-matched');
      $rightItem.classList.add('is-matched');
      $leftItem.setAttribute('aria-selected', 'false');
      $rightItem.setAttribute('aria-selected', 'false');

      this._updateStatus('success', '配对正确！🎉');
      this._updateScore();

      setTimeout(function () {
        self.selectedLeft = null;
        self.selectedRight = null;
        self._isProcessing = false;
        self._updateStatus('info', '继续配对剩余的选项');
      }, 800);

      if (typeof this.options.onMatch === 'function') {
        this.options.onMatch(item, true);
      }

      if (this.correctCount === this.options.data.length && typeof this.options.onComplete === 'function') {
        setTimeout(function () {
          self.options.onComplete(self.correctCount, self.options.data.length, self.wrongAttempts);
        }, 1000);
      }
    } else {
      this.wrongAttempts++;
      
      $leftItem.classList.add('is-wrong');
      $rightItem.classList.add('is-wrong');

      this._updateStatus('error', '配对错误，再试一次！');

      setTimeout(function () {
        $leftItem.classList.remove('is-wrong');
        $rightItem.classList.remove('is-wrong');
        
        if (self.options.allowRetry) {
          self._deselectLeft();
          self._deselectRight();
          self._updateStatus('info', '选择左侧选项，再选择右侧选项进行配对');
        }
        
        self._isProcessing = false;
      }, 600);

      if (typeof this.options.onMatch === 'function') {
        this.options.onMatch(item, false);
      }
    }
  };

  DragMatch.prototype._updateStatus = function (type, message) {
    this.$status.textContent = message;
    this.$status.className = 'edu-drag-match__status edu-drag-match__status--' + type;
  };

  DragMatch.prototype._updateScore = function () {
    this.$correctScore.textContent = this.correctCount;
  };

  DragMatch.prototype._handleKeyDown = function (e) {
    var activeEl = document.activeElement;
    var isLeftItem = this.$leftItems.indexOf(activeEl) !== -1;
    var isRightItem = this.$rightItems.indexOf(activeEl) !== -1;

    if (!isLeftItem && !isRightItem) return;

    if (keyboard.isActionKey(e)) {
      keyboard.preventDefault(e);
      this._handleItemClick(activeEl, isLeftItem ? 'left' : 'right');
      return;
    }

    var items = isLeftItem ? this.$leftItems : this.$rightItems;
    var currentIndex = items.indexOf(activeEl);

    if (e.key === keyboard.KEYS.DOWN || e.key === keyboard.KEYS.RIGHT) {
      keyboard.preventDefault(e);
      var nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === keyboard.KEYS.UP || e.key === keyboard.KEYS.LEFT) {
      keyboard.preventDefault(e);
      var prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
    }
  };

  DragMatch.prototype.reset = function () {
    this.matchedPairs = {};
    this.selectedLeft = null;
    this.selectedRight = null;
    this.correctCount = 0;
    this.wrongAttempts = 0;
    this._isProcessing = false;

    this._shuffleRight();
    this._buildHTML();
    this._bindEvents();
    this._updateStatus();
    this._updateScore();
  };

  DragMatch.prototype.getResult = function () {
    return {
      correct: this.correctCount,
      total: this.options.data.length,
      wrongAttempts: this.wrongAttempts,
      isComplete: this.correctCount === this.options.data.length
    };
  };

  DragMatch.prototype.destroy = function () {
    this.el.innerHTML = '';
    dom.removeClass(this.el, 'edu-component');
  };

  global.EduDragMatch = DragMatch;

})(window);
