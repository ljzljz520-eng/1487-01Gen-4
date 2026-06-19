(function (global) {
  'use strict';

  var dom = global.EduDom;
  var events = global.EduEvents;

  function ProgressBar(options) {
    if (!options || !options.el) {
      throw new Error('ProgressBar: el option is required');
    }

    this.options = Object.assign({
      data: null,
      onChange: null
    }, options);

    if (!this.options.data) {
      throw new Error('ProgressBar: data option is required');
    }

    this.el = dom.getElement(options.el);
    if (!this.el) {
      throw new Error('ProgressBar: element not found');
    }

    this.data = Object.assign({
      value: 0,
      max: 100,
      label: '',
      showPercent: true,
      segments: []
    }, this.options.data);

    this.value = this.data.value;
    this.max = this.data.max;
    this._animationFrame = null;
    this._animationTimeout = null;

    this._init();
  }

  ProgressBar.prototype._init = function () {
    this._buildHTML();
    this._render();
    
    dom.addClass(this.el, 'edu-component');
  };

  ProgressBar.prototype._buildHTML = function () {
    var data = this.data;
    var hasSegments = data.segments && data.segments.length > 0;
    
    var html = '<div class="edu-progress-bar" role="progressbar" ' +
      'aria-valuenow="' + this.value + '" ' +
      'aria-valuemin="0" ' +
      'aria-valuemax="' + this.max + '" ' +
      (data.label ? 'aria-label="' + data.label + '"' : '') + '>';
    
    if (data.label || data.showPercent) {
      html += '<div class="edu-progress-bar__label">';
      if (data.label) {
        html += '<span class="edu-progress-bar__label-text">' + data.label + '</span>';
      }
      if (data.showPercent) {
        html += '<span class="edu-progress-bar__percent">0%</span>';
      }
      html += '</div>';
    }
    
    html += '<div class="edu-progress-bar__track">';
    html += '<div class="edu-progress-bar__fill"></div>';
    
    if (hasSegments) {
      html += '<div class="edu-progress-bar__segments">';
      for (var i = 0; i < data.segments.length; i++) {
        var seg = data.segments[i];
        var percent = (seg.value / this.max) * 100;
        html += '<div class="edu-progress-bar__segment-marker" style="left: ' + percent + '%;"></div>';
      }
      html += '</div>';
    }
    
    html += '</div>';
    
    if (hasSegments) {
      html += '<div class="edu-progress-bar__segments-labels">';
      for (var i = 0; i < data.segments.length; i++) {
        var seg = data.segments[i];
        var percent = (seg.value / this.max) * 100;
        html += '<div class="edu-progress-bar__segment-label" style="left: ' + percent + '%;" ' +
          'data-value="' + seg.value + '">' +
          (seg.label || '') +
        '</div>';
      }
      html += '</div>';
    }
    
    html += '</div>';

    this.el.innerHTML = html;
    
    this.$bar = dom.$('.edu-progress-bar', this.el);
    this.$fill = dom.$('.edu-progress-bar__fill', this.el);
    this.$percent = dom.$('.edu-progress-bar__percent', this.el);
    this.$segmentLabels = dom.$$('.edu-progress-bar__segment-label', this.el);
  };

  ProgressBar.prototype._render = function () {
    var percent = this.max > 0 ? (this.value / this.max) * 100 : 0;
    percent = Math.max(0, Math.min(100, percent));
    
    this.$fill.style.width = percent + '%';
    
    if (this.$percent) {
      this.$percent.textContent = Math.round(percent) + '%';
    }
    
    this.$bar.setAttribute('aria-valuenow', this.value);
    
    this._updateSegmentStates(percent);
    this._updateBarVariant(percent);
  };

  ProgressBar.prototype._updateSegmentStates = function (percent) {
    if (!this.data.segments || this.data.segments.length === 0) return;

    var self = this;
    this.$segmentLabels.forEach(function ($label, index) {
      var seg = self.data.segments[index];
      var segPercent = (seg.value / self.max) * 100;
      
      $label.classList.remove('is-active', 'is-completed');
      
      if (percent >= segPercent) {
        $label.classList.add('is-completed');
      }
      
      if (index === 0 && percent < segPercent) {
        $label.classList.add('is-active');
      } else if (index > 0) {
        var prevSeg = self.data.segments[index - 1];
        var prevPercent = (prevSeg.value / self.max) * 100;
        if (percent >= prevPercent && percent < segPercent) {
          $label.classList.add('is-active');
        }
      }
      
      if (index === self.data.segments.length - 1 && percent >= segPercent) {
        $label.classList.add('is-active');
      }
    });
  };

  ProgressBar.prototype._updateBarVariant = function (percent) {
    this.$bar.classList.remove('is-success', 'is-warning', 'is-error');
    
    if (this.options.status) {
      this.$bar.classList.add('is-' + this.options.status);
    }
  };

  ProgressBar.prototype.setValue = function (value) {
    value = Math.max(0, Math.min(this.max, value));
    if (value === this.value) return;

    this.value = value;
    this._render();

    var percent = this.max > 0 ? (this.value / this.max) * 100 : 0;
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(this.value, percent);
    }
  };

  ProgressBar.prototype.getValue = function () {
    return this.value;
  };

  ProgressBar.prototype.getPercent = function () {
    return this.max > 0 ? (this.value / this.max) * 100 : 0;
  };

  ProgressBar.prototype.animateTo = function (targetValue, duration) {
    var self = this;
    duration = duration || 1000;
    
    targetValue = Math.max(0, Math.min(this.max, targetValue));
    
    if (targetValue === this.value) return;
    
    this._cancelAnimation();
    
    var startValue = this.value;
    var startTime = null;
    
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    
    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      
      var easedProgress = easeOutCubic(progress);
      var currentValue = startValue + (targetValue - startValue) * easedProgress;
      
      self.value = currentValue;
      self._render();
      
      if (progress < 1) {
        self._animationFrame = requestAnimationFrame(animate);
      } else {
        self.value = targetValue;
        self._render();
        
        var percent = self.max > 0 ? (self.value / self.max) * 100 : 0;
        if (typeof self.options.onChange === 'function') {
          self.options.onChange(self.value, percent);
        }
      }
    }
    
    this._animationFrame = requestAnimationFrame(animate);
  };

  ProgressBar.prototype._cancelAnimation = function () {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }
  };

  ProgressBar.prototype.setMax = function (max) {
    if (max <= 0) return;
    this.max = max;
    this.value = Math.min(this.value, this.max);
    this._render();
  };

  ProgressBar.prototype.setStatus = function (status) {
    this.options.status = status;
    this._updateBarVariant(this.getPercent());
  };

  ProgressBar.prototype.setLabel = function (label) {
    this.data.label = label;
    var $labelText = dom.$('.edu-progress-bar__label-text', this.el);
    if ($labelText) {
      $labelText.textContent = label;
    }
  };

  ProgressBar.prototype.setSegments = function (segments) {
    this.data.segments = segments || [];
    this._buildHTML();
    this._render();
  };

  ProgressBar.prototype.reset = function () {
    this._cancelAnimation();
    this.value = 0;
    this._render();
  };

  ProgressBar.prototype.destroy = function () {
    this._cancelAnimation();
    this.el.innerHTML = '';
    dom.removeClass(this.el, 'edu-component');
  };

  global.EduProgressBar = ProgressBar;

})(window);
