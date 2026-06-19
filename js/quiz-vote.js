(function (global) {
  'use strict';

  var dom = global.EduDom;
  var keyboard = global.EduKeyboard;
  var events = global.EduEvents;

  function QuizVote(options) {
    if (!options || !options.el) {
      throw new Error('QuizVote: el option is required');
    }

    this.options = Object.assign({
      data: null,
      keyboard: true,
      showResult: true,
      submitText: '提交答案',
      retryText: '重新答题',
      onVote: null,
      onSubmit: null
    }, options);

    if (!this.options.data) {
      throw new Error('QuizVote: data option is required');
    }

    this.el = dom.getElement(options.el);
    if (!this.el) {
      throw new Error('QuizVote: element not found');
    }

    this.data = this.options.data;
    this.selectedIndexes = [];
    this.isSubmitted = false;
    this.isCorrect = false;
    this.voteCounts = [];

    this._init();
  }

  QuizVote.prototype._init = function () {
    this._initVoteCounts();
    this._buildHTML();
    this._bindEvents();
    
    dom.addClass(this.el, 'edu-component');
  };

  QuizVote.prototype._initVoteCounts = function () {
    var options = this.data.options || [];
    this.voteCounts = new Array(options.length).fill(0);
  };

  QuizVote.prototype._buildHTML = function () {
    var data = this.data;
    var options = data.options || [];
    var isMultiple = data.type === 'multiple';
    
    var typeLabel = isMultiple ? '多选题' : '单选题';
    
    var html = '<div class="edu-quiz-vote" role="region" aria-label="随堂投票">';
    
    html += '<div class="edu-quiz-vote__question">';
    html += '<span class="edu-quiz-vote__type">' + typeLabel + '</span>';
    html += '<div>' + this._escapeHtml(data.question || '') + '</div>';
    html += '</div>';
    
    html += '<div class="edu-quiz-vote__options" role="' + (isMultiple ? 'group' : 'radiogroup') + '" ' +
      'aria-label="选项' + (isMultiple ? '，可多选' : '') + '">';
    
    var optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    for (var i = 0; i < options.length; i++) {
      var letter = optionLetters[i] || (i + 1);
      html += '<div class="edu-quiz-vote__option" ' +
        'role="' + (isMultiple ? 'checkbox' : 'radio') + '" ' +
        'tabindex="0" ' +
        'aria-checked="false" ' +
        'data-index="' + i + '">' +
        '<span class="edu-quiz-vote__option-number">' + letter + '</span>' +
        '<span class="edu-quiz-vote__option-text">' + this._escapeHtml(options[i]) + '</span>' +
        '<span class="edu-quiz-vote__option-icon" aria-hidden="true"></span>' +
      '</div>';
    }
    
    html += '</div>';
    
    if (this.options.showResult) {
      html += '<div class="edu-quiz-vote__results" style="display:none;" aria-hidden="true">';
      for (var i = 0; i < options.length; i++) {
        var letter = optionLetters[i] || (i + 1);
        html += '<div class="edu-quiz-vote__result-bar" data-index="' + i + '">' +
          '<div class="edu-quiz-vote__result-label">' +
            '<span>' + letter + '. ' + this._escapeHtml(options[i]) + '</span>' +
            '<span class="edu-quiz-vote__result-percent-text">0%</span>' +
          '</div>' +
          '<div class="edu-quiz-vote__result-track">' +
            '<div class="edu-quiz-vote__result-fill" style="width: 0%;">' +
              '<span class="edu-quiz-vote__result-percent">0%</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
      html += '</div>';
      
      html += '<div class="edu-quiz-vote__stats" style="display:none;">' +
        '共 <strong>0</strong> 人参与投票' +
      '</div>';
    }
    
    html += '<div class="edu-quiz-vote__actions">' +
      '<button type="button" class="edu-btn edu-btn-primary edu-quiz-vote__submit-btn">' +
        this.options.submitText +
      '</button>' +
    '</div>';
    
    html += '</div>';

    this.el.innerHTML = html;
    
    this.$options = dom.$$('.edu-quiz-vote__option', this.el);
    this.$submitBtn = dom.$('.edu-quiz-vote__submit-btn', this.el);
    this.$results = dom.$('.edu-quiz-vote__results', this.el);
    this.$resultBars = dom.$$('.edu-quiz-vote__result-bar', this.el);
    this.$stats = dom.$('.edu-quiz-vote__stats', this.el);
  };

  QuizVote.prototype._bindEvents = function () {
    var self = this;

    this.$options.forEach(function ($option, index) {
      events.on($option, 'click', function () {
        self._toggleOption(index);
      });
    });

    events.on(this.$submitBtn, 'click', function () {
      self.submit();
    });

    if (this.options.keyboard) {
      events.on(this.el, 'keydown', function (e) {
        self._handleKeyDown(e);
      });
    }
  };

  QuizVote.prototype._toggleOption = function (index) {
    if (this.isSubmitted) return;

    var isMultiple = this.data.type === 'multiple';
    var $option = this.$options[index];
    var selectedIndex = this.selectedIndexes.indexOf(index);

    if (isMultiple) {
      if (selectedIndex === -1) {
        this.selectedIndexes.push(index);
        $option.classList.add('is-selected');
        $option.setAttribute('aria-checked', 'true');
      } else {
        this.selectedIndexes.splice(selectedIndex, 1);
        $option.classList.remove('is-selected');
        $option.setAttribute('aria-checked', 'false');
      }
    } else {
      this.$options.forEach(function (opt) {
        opt.classList.remove('is-selected');
        opt.setAttribute('aria-checked', 'false');
      });
      
      if (selectedIndex === -1) {
        this.selectedIndexes = [index];
        $option.classList.add('is-selected');
        $option.setAttribute('aria-checked', 'true');
      } else {
        this.selectedIndexes = [];
      }
    }

    this._updateSubmitButton();

    if (typeof this.options.onVote === 'function') {
      this.options.onVote(this.selectedIndexes.slice());
    }
  };

  QuizVote.prototype._updateSubmitButton = function () {
    if (this.selectedIndexes.length > 0 && !this.isSubmitted) {
      this.$submitBtn.disabled = false;
    } else if (!this.isSubmitted) {
      this.$submitBtn.disabled = true;
    }
  };

  QuizVote.prototype._handleKeyDown = function (e) {
    if (this.isSubmitted) return;

    var activeEl = document.activeElement;
    var optionIndex = -1;
    
    for (var i = 0; i < this.$options.length; i++) {
      if (this.$options[i] === activeEl) {
        optionIndex = i;
        break;
      }
    }

    if (optionIndex !== -1) {
      if (keyboard.isActionKey(e) || e.key === ' ') {
        keyboard.preventDefault(e);
        this._toggleOption(optionIndex);
        return;
      }

      if (e.key === keyboard.KEYS.DOWN || e.key === keyboard.KEYS.RIGHT) {
        keyboard.preventDefault(e);
        var nextIndex = (optionIndex + 1) % this.$options.length;
        this.$options[nextIndex].focus();
        return;
      }

      if (e.key === keyboard.KEYS.UP || e.key === keyboard.KEYS.LEFT) {
        keyboard.preventDefault(e);
        var prevIndex = (optionIndex - 1 + this.$options.length) % this.$options.length;
        this.$options[prevIndex].focus();
        return;
      }
    }

    if (keyboard.isNumberKey(e)) {
      var num = keyboard.getNumberKeyValue(e);
      if (num >= 1 && num <= this.$options.length) {
        keyboard.preventDefault(e);
        this._toggleOption(num - 1);
        this.$options[num - 1].focus();
      }
    }

    if (e.key === keyboard.KEYS.ENTER && this.selectedIndexes.length > 0) {
      keyboard.preventDefault(e);
      this.submit();
    }
  };

  QuizVote.prototype.submit = function () {
    if (this.isSubmitted || this.selectedIndexes.length === 0) return;

    this.isSubmitted = true;

    var correctAnswer = this.data.correctAnswer;
    this.isCorrect = false;

    if (correctAnswer !== undefined && correctAnswer !== null) {
      if (Array.isArray(correctAnswer)) {
        var sortedSelected = this.selectedIndexes.slice().sort(function(a, b) { return a - b; });
        var sortedCorrect = correctAnswer.slice().sort(function(a, b) { return a - b; });
        this.isCorrect = sortedSelected.length === sortedCorrect.length &&
          sortedSelected.every(function(val, idx) { return val === sortedCorrect[idx]; });
      } else {
        this.isCorrect = this.selectedIndexes.length === 1 && this.selectedIndexes[0] === correctAnswer;
      }
    }

    this.selectedIndexes.forEach(function (idx) {
      this.voteCounts[idx]++;
    }.bind(this));

    this._renderResults();
    this._updateOptionsWithResult();

    this.$submitBtn.textContent = this.options.retryText;
    this.$submitBtn.classList.remove('edu-btn-primary');
    this.$submitBtn.classList.add('edu-btn-secondary');
    this.$submitBtn.disabled = false;

    var submitHandler = this._retryHandler.bind(this);
    this.$submitBtn.removeEventListener('click', this._submitHandler);
    this.$submitBtn.addEventListener('click', submitHandler);
    this._submitHandler = submitHandler;

    if (typeof this.options.onSubmit === 'function') {
      this.options.onSubmit(this.selectedIndexes.slice(), this.isCorrect);
    }
  };

  QuizVote.prototype._retryHandler = function () {
    this.reset();
  };

  QuizVote.prototype._renderResults = function () {
    if (!this.options.showResult) return;

    var totalVotes = this.voteCounts.reduce(function (sum, count) {
      return sum + count;
    }, 0);

    this.$results.style.display = '';
    this.$results.setAttribute('aria-hidden', 'false');
    this.$stats.style.display = '';
    
    var $statsStrong = this.$stats.querySelector('strong');
    $statsStrong.textContent = totalVotes;

    var self = this;
    
    setTimeout(function () {
      self.$resultBars.forEach(function ($bar, index) {
        var count = self.voteCounts[index];
        var percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        
        var $fill = $bar.querySelector('.edu-quiz-vote__result-fill');
        var $percentText = $bar.querySelector('.edu-quiz-vote__result-percent-text');
        var $percentInside = $bar.querySelector('.edu-quiz-vote__result-percent');
        
        $fill.style.width = percent + '%';
        $percentText.textContent = percent + '%';
        $percentInside.textContent = percent + '%';
        
        var correctAnswer = self.data.correctAnswer;
        if (correctAnswer !== undefined && correctAnswer !== null) {
          var isCorrectOption = Array.isArray(correctAnswer)
            ? correctAnswer.indexOf(index) !== -1
            : correctAnswer === index;
          
          if (isCorrectOption) {
            $fill.classList.add('is-correct');
          }
        }
      });
    }, 100);
  };

  QuizVote.prototype._updateOptionsWithResult = function () {
    var correctAnswer = this.data.correctAnswer;
    if (correctAnswer === undefined || correctAnswer === null) return;

    var self = this;
    this.$options.forEach(function ($option, index) {
      var isSelected = self.selectedIndexes.indexOf(index) !== -1;
      var isCorrectOption = Array.isArray(correctAnswer)
        ? correctAnswer.indexOf(index) !== -1
        : correctAnswer === index;

      $option.classList.remove('is-selected');
      
      if (isCorrectOption) {
        $option.classList.add('is-correct');
        var $icon = $option.querySelector('.edu-quiz-vote__option-icon');
        if ($icon) $icon.textContent = '✓';
      } else if (isSelected && !isCorrectOption) {
        $option.classList.add('is-wrong');
        var $icon = $option.querySelector('.edu-quiz-vote__option-icon');
        if ($icon) $icon.textContent = '✗';
      }
    });
  };

  QuizVote.prototype.addVote = function (index) {
    if (index < 0 || index >= this.voteCounts.length) return;
    
    this.voteCounts[index]++;
    
    if (this.isSubmitted && this.options.showResult) {
      this._renderResults();
    }
  };

  QuizVote.prototype.setVotes = function (counts) {
    if (!Array.isArray(counts)) return;
    
    for (var i = 0; i < this.voteCounts.length && i < counts.length; i++) {
      this.voteCounts[i] = counts[i];
    }
    
    if (this.isSubmitted && this.options.showResult) {
      this._renderResults();
    }
  };

  QuizVote.prototype.reset = function () {
    this.selectedIndexes = [];
    this.isSubmitted = false;
    this.isCorrect = false;

    this.$options.forEach(function ($option) {
      $option.classList.remove('is-selected', 'is-correct', 'is-wrong');
      $option.setAttribute('aria-checked', 'false');
      var $icon = $option.querySelector('.edu-quiz-vote__option-icon');
      if ($icon) $icon.textContent = '';
    });

    if (this.$results) {
      this.$results.style.display = 'none';
      this.$results.setAttribute('aria-hidden', 'true');
      
      this.$resultBars.forEach(function ($bar) {
        var $fill = $bar.querySelector('.edu-quiz-vote__result-fill');
        $fill.style.width = '0%';
        $fill.classList.remove('is-correct', 'is-wrong');
      });
    }

    if (this.$stats) {
      this.$stats.style.display = 'none';
    }

    this.$submitBtn.textContent = this.options.submitText;
    this.$submitBtn.classList.remove('edu-btn-secondary');
    this.$submitBtn.classList.add('edu-btn-primary');
    this.$submitBtn.disabled = true;

    var self = this;
    var submitHandler = function () { self.submit(); };
    this.$submitBtn.removeEventListener('click', this._submitHandler);
    this.$submitBtn.addEventListener('click', submitHandler);
    this._submitHandler = submitHandler;
  };

  QuizVote.prototype.getSelectedIndexes = function () {
    return this.selectedIndexes.slice();
  };

  QuizVote.prototype.getResult = function () {
    return {
      selected: this.selectedIndexes.slice(),
      isSubmitted: this.isSubmitted,
      isCorrect: this.isCorrect,
      voteCounts: this.voteCounts.slice()
    };
  };

  QuizVote.prototype._escapeHtml = function (text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  QuizVote.prototype.destroy = function () {
    this.el.innerHTML = '';
    dom.removeClass(this.el, 'edu-component');
  };

  global.EduQuizVote = QuizVote;

})(window);
