(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  function yonderInputBinding() {
    this.Selector = {};
    this.Events = [];

    this.find = function (scope) {
      return scope.querySelectorAll(this.Selector.SELF + "[id]");
    };

    this.getId = function (el) {
      return el.id;
    };

    this.getType = function (el) {
      return this.Type || false;
    };

    this.getValue = function (el) {
      if (!this.Selector.hasOwnProperty("SELECTED")) {
        return null;
      }

      var selected = Array.prototype.slice.call(el.querySelectorAll(this.Selector.SELECTED));

      if (!selected.length) {
        return null;
      }

      return selected.map(function (s) {
        var value = s.getAttribute("data-value") || s.value;
        return value === undefined ? null : value;
      });
    };

    this.getState = function (el, data) {
      return {
        value: this.getValue(el)
      };
    };

    this.attachHandler = function (el, type, selector, handler, callback, debounce) {
      var _this = this;

      $(el).on(type + ".yonder", selector || null, function (e) {
        if (handler) {
          handler(el, e, _this);
        }

        if (callback) {
          callback(debounce || false);
        }
      });
    };

    this.subscribe = function (el, callback) {
      var _this2 = this;

      var $el = $(el);
      var formElement = false;

      if ($el.parent().closest(".yonder-form[id]").length) {
        $el.on("submission.yonder", function (e) {
          return callback();
        });
        formElement = true;
      } // default events


      this.Events.push({
        type: "change.yonder"
      });
      this.Events.push({
        type: "update.yonder"
      });
      this.Events.forEach(function (event) {
        _this2.attachHandler(el, event.type, event.selector, event.callback, formElement ? null : callback, event.debounce);
      });
    };

    this.unsubscribe = function (el) {
      $(el).off("yonder");
    };

    this._update = function (el, data) {
      console.warn("no _update method");
    };

    this._enable = function (el, data) {
      console.warn("no _enable method");
    };

    this._disable = function (el, data) {
      console.warn("no _disable method");
    };

    this._invalidate = function (el, data) {
      if (!this.Selector.hasOwnProperty("VALIDATE")) {
        console.warn("input does not support invalidation");
        return;
      }

      var input = el.querySelector(this.Selector.VALIDATE);
      input.classList.remove("is-valid");
      input.classList.add("is-invalid");
      var feedback = el.querySelector(".invalid-feedback");

      if (feedback !== null) {
        feedback.innerHTML = data.message;
      }
    };

    this._validate = function (el, data) {
      if (!this.Selector.hasOwnProperty("VALIDATE")) {
        console.warn("input does not support validation");
        return;
      }

      var input = el.querySelector(this.Selector.VALIDATE);
      input.classList.remove("is-invalid");
      var feedback = el.querySelector(".invalid-feedback");

      if (feedback !== null) {
        feedback.innerHTML = "";
      }
    };

    this.receiveMessage = function (el, msg) {
      if (!msg.type || msg.data === undefined) {
        return false;
      }

      switch (msg.type) {
        case "update":
          this._update(el, msg.data);

          break;

        case "change":
          this._select(el, msg.data);

          break;

        case "enable":
          this._enable(el, msg.data);

          break;

        case "disable":
          this._disable(el, msg.data);

          break;

        case "invalidate":
          this._invalidate(el, msg.data);

          break;

        case "validate":
          this._validate(el, msg.data);

          break;
      }

      if (msg.type === "change" && msg.data.propagate === false) {
        return false;
      }

      $(el).trigger(msg.type + ".yonder");
      return false;
    };
  }

  if (typeof Shiny !== "undefined") {
    yonderInputBinding.call(Shiny.InputBinding.prototype);
  }

  var buttonGroupInputBinding = new Shiny.InputBinding();
  $.extend(buttonGroupInputBinding, {
    Selector: {
      SELF: ".yonder-button-group"
    },
    Events: [{
      type: "click",
      selector: "button",
      callback: function callback(el, e, self) {
        self._VALUES[el.id] = e.currentTarget.value;
      }
    }],
    _VALUES: {},
    getType: function getType(el) {
      return "yonder.buttonGroup";
    },
    initialize: function initialize(el) {
      this._VALUES[el.id] = null;
    },
    getValue: function getValue(el) {
      return {
        force: Date.now(),
        value: this._VALUES[el.id]
      };
    },
    _update: function _update(el, data) {
      var template = el.querySelector("button").cloneNode();
      template.removeAttribute("disabled");
      el.innerHTML = "";
      data.choices.forEach(function (choice, i) {
        var child = template.cloneNode();
        child.innerHTML = choice;
        child.value = data.values[i];
        el.appendChild(child);
      });
    },
    _enable: function _enable(el, data) {
      var values = data.values;
      el.querySelectorAll("button").forEach(function (button) {
        var enable = !values.length || values.indexOf(button.value) > -1;

        if (enable !== data.invert) {
          button.removeAttribute("disabled");
        }
      });
    },
    _disable: function _disable(el, data) {
      var values = data.values;
      el.querySelectorAll("button").forEach(function (button) {
        var disable = !values.length || values.indexOf(button.value) > -1;

        if (data.reset) {
          button.removeAttribute("disabled");
        }

        if (disable !== data.invert) {
          button.setAttribute("disabled", "");
        }
      });
    }
  });
  Shiny.inputBindings.register(buttonGroupInputBinding, "yonder.buttonGroupInput");

  var buttonInputBinding = new Shiny.InputBinding();
  $.extend(buttonInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-button[id]");
    },
    initialize: function initialize(el) {
      $(el).on("click", function (e) {
        return el.value = +el.value + 1;
      });
      el.value = 0;
    },
    getValue: function getValue(el) {
      return +el.value > 0 ? +el.value : null;
    },
    subscribe: function subscribe(el, callback) {
      $(el).on("click.yonder", function (e) {
        return callback();
      });
    },
    unsubscribe: function unsubscribe(el, callback) {
      return $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.content) {
        el.innerHTML = msg.content;
      }

      if (msg.enable) {
        el.classList.remove("disabled");
        el.removeAttribute("disabled");
      }

      if (msg.disable) {
        el.classList.add("disabled");
        el.setAttribute("disabled", "");
      }
    }
  });
  Shiny.inputBindings.register(buttonInputBinding, "yonder.buttonInput");

  var checkbarInputBinding = new Shiny.InputBinding();
  $.extend(checkbarInputBinding, {
    Selector: {
      SELF: ".yonder-checkbar",
      SELECTED: "input:checked"
    },
    Events: [{
      type: "change",
      selector: ".btn"
    }],
    _update: function _update(el, data) {
      var template = el.querySelector(".btn").cloneNode(true);
      template.classList.remove("active");
      template.classList.remove("disabled");
      template.children[0].removeAttribute("disabled");
      var input = template.children[0].cloneNode();
      template.innerHTML = "";
      template.appendChild(input);
      el.innerHTML = "";
      data.choices.forEach(function (choice, i) {
        var child = template.cloneNode(true);
        child.insertAdjacentHTML("beforeend", choice);
        child.children[0].value = data.values[i];

        if (data.selected.indexOf(data.values[i]) > -1) {
          child.classList.add("active");
          child.children[0].checked = true;
        }

        el.appendChild(child);
      });
    },
    _select: function _select(el, data) {
      el.querySelectorAll(".btn").forEach(function (child) {
        var value = child.children[0].value;

        if (data.reset) {
          child.classList.remove("active");
          child.children[0].checked = false;
        }

        var match = data.fixed ? data.pattern.indexOf(value) > -1 : RegExp(data.pattern, "i").test(value);

        if (match !== data.invert) {
          child.classList.add("active");
          child.children[0].checked = true;
        }
      });
    },
    _enable: function _enable(el, data) {
      var values = data.values;
      el.querySelectorAll(".btn").forEach(function (btn) {
        var enable = !values.length || values.indexOf(btn.children[0].value) > -1;

        if (enable !== data.invert) {
          btn.classList.remove("disabled");
          btn.children[0].removeAttribute("disabled");
        }
      });
    },
    _disable: function _disable(el, data) {
      var values = data.values;
      el.querySelectorAll(".btn").forEach(function (btn) {
        var disable = !values.length || values.indexOf(btn.children[0].value) > -1;

        if (data.reset) {
          btn.classList.remove("disabled");
          btn.children[0].removeAttribute("disabled");
        }

        if (disable !== data.invert) {
          btn.classList.add("disabled");
          btn.children[0].setAttribute("disabled", "");
        }
      });
    }
  });
  Shiny.inputBindings.register(checkbarInputBinding, "yonder.checkbarInput");

  var checkboxInputBinding = new Shiny.InputBinding();
  $.extend(checkboxInputBinding, {
    Selector: {
      SELF: ".yonder-checkbox",
      SELECTED: ".custom-control-input:checked:not(:disabled)",
      VALIDATE: ".custom-control-input"
    },
    Events: [{
      type: "change"
    }],
    _update: function _update(el, data) {
      var template = el.querySelector(".custom-checkbox").cloneNode(true);
      template.children[0].checked = false;
      el.innerHTML = "";
      data.choices.forEach(function (choice, i) {
        var child = template.cloneNode(true);
        child.children[0].value = data.values[i];
        child.children[1].innerHTML = choice;

        if (data.selected.indexOf(data.values[i]) > -1) {
          child.children[0].checked = true;
        }

        el.appendChild(child);
      });
    },
    _select: function _select(el, data) {
      el.querySelectorAll(".custom-checkbox").forEach(function (child) {
        var value = child.children[0].value;

        if (data.reset) {
          child.children[0].checked = false;
        }

        var match = data.fixed ? data.pattern.indexOf(value) > -1 : RegExp(data.pattern, "i").test(value);

        if (match !== data.invert) {
          child.children[0].checked = true;
        }
      });
    },
    _enable: function _enable(el, data) {
      el.querySelectorAll("input").forEach(function (input) {
        var enable = !data.values.length && data.values.indexOf(input.value) > -1;

        if (enable !== data.invert) {
          input.removeAttribute("disabled");
        }
      });
    },
    _disable: function _disable(el, data) {
      el.querySelectorAll("input").forEach(function (input) {
        var disable = !data.values.length && data.values.indexOf(input.value) > -1;

        if (data.reset) {
          input.removeAttribute("disabled");
        }

        if (disable !== data.invert) {
          input.setAttribute("disabled", "");
        }
      });
    }
  });
  Shiny.inputBindings.register(checkboxInputBinding, "yonder.checkboxInput");

  var chipInputBinding = new Shiny.InputBinding();
  $.extend(chipInputBinding, {
    selectorActive: ".active",
    selectorToggle: "input[data-toggle='dropdown']",
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-chip[id]");
    },
    initialize: function initialize(el) {
      var $el = $(el);
      var $toggle = $(el.querySelector(chipInputBinding.selectorToggle));
      $el.on("input", function (e) {
        var value = $toggle[0].value;
        chipInputBinding.filterItems(el, value);

        if (chipInputBinding.visibleItems(el) === 0) {
          $toggle.dropdown("hide");
        } else {
          $toggle.dropdown("show");
        }
      });
      $el.on("input change", function (e) {
        return $toggle.dropdown("update");
      });
      $el.on("hide.bs.dropdown", function (e) {
        if (el.querySelector("input:focus") === null) {
          el.querySelector("input").value = "";
          chipInputBinding.filterItems(el, "");
        }
      });
      $el.on("click", ".dropdown-item", function (e) {
        e.stopPropagation();
        chipInputBinding.addChip(el, e.currentTarget.value);
        el.querySelector(chipInputBinding.selectorToggle).focus();
      });
      $el.on("click", ".chip", function (e) {
        chipInputBinding.removeChip(el, e.currentTarget.value);
      });
      var max = +el.getAttribute("data-max");

      if (max !== -1 && chipInputBinding.selectedItems(el) >= max) {
        chipInputBinding.disableToggle(el);
      }
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.items && msg.chips) {
        var menu = el.querySelector(".dropdown-menu");

        if (menu) {
          menu.innerHTML = msg.items;
        }

        var chips = el.querySelector(".chips");

        if (chips) {
          chips.innerHTML = msg.chips;
        }
      }

      if (msg.enable) {
        if (msg === true) ; else {
          el.querySelectorAll(".dropdown-item,.chip").forEach(function (item) {
            if (msg.enable.indexOf(item.value) > -1) {
              item.removeAttribute("disabled");
              item.classList.remove("disabled");
            }
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable === true) ; else {
          el.querySelectorAll(".dropdown-item,.chip").forEach(function (item) {
            if (disable.indexOf(item.value) > -1) {
              item.setAttribute("disabled", "");
              item.classList.add("disabled");
            }
          });
        }
      }
    },
    enableToggle: function enableToggle(el) {
      var input = el.querySelector("input");
      input.removeAttribute("disabled");
      input.classList.remove("disabled");
    },
    disableToggle: function disableToggle(el) {
      var input = el.querySelector("input");
      input.setAttribute("disabled", "");
      input.classList.add("disabled");
    },
    filterItems: function filterItems(el, value) {
      el.querySelectorAll(".dropdown-item").forEach(function (item) {
        var match = item.innerText.toLowerCase().indexOf(value) !== -1;

        if (match) {
          item.classList.remove("filtered");
        } else {
          item.classList.add("filtered");
        }
      });
    },
    visibleItems: function visibleItems(el) {
      return el.querySelectorAll(":not(.selected), :not(.filtered)").length;
    },
    selectedItems: function selectedItems(el) {
      return el.querySelectorAll(".selected").length;
    },
    getItem: function getItem(el, value) {
      return Array.prototype.filter.call(el.querySelectorAll(".dropdown-item"), function (chip) {
        return chip.value === value;
      });
    },
    addChip: function addChip(el, value) {
      this.getItem(el, value).forEach(function (item) {
        return item.classList.add("selected");
      });
      this.getChip(el, value).forEach(function (chip) {
        return chip.classList.add("active");
      });

      if (this.visibleItems(el) === 0) {
        $(el.querySelector(this.Selector.TOGGLE)).dropdown("hide");
      }

      var max = +el.getAttribute("data-max");

      if (max === -1 || this.selectedItems(el) < max) {
        $(el.querySelector(this.Selector.TOGGLE)).dropdown("update");
      } else {
        $(el.querySelector(this.Selector.TOGGLE)).dropdown("hide");
        this.disableToggle(el);
      }
    },
    removeChip: function removeChip(el, value) {
      var max = +el.getAttribute("data-max");
      this.getChip(el, value).forEach(function (chip) {
        return chip.classList.remove("active");
      });
      this.getItem(el, value).forEach(function (item) {
        return item.classList.remove("selected");
      });

      if (max === -1 || this.selectedItems(el) < max) {
        this.enableToggle(el);
      }
    },
    getChip: function getChip(el, value) {
      return Array.prototype.filter.call(el.querySelectorAll(".chip"), function (chip) {
        return chip.value === value;
      });
    },
    _update: function _update(el, data) {
      var itemTemplate = el.querySelector(".dropdown-item").cloneNode();
      itemTemplate.value = "";
      itemTemplate.innerText = "";
      itemTemplate.classList.remove("selected");
      itemTemplate.classList.remove("filtered");
      var chipTemplate = el.querySelector(".chip").cloneNode(true);
      chipTemplate.value = "";
      chipTemplate.children[0].innerHTML = "";
      chipTemplate.classList.remove("active");
      var menu = el.querySelector(".dropdown-menu");
      var chips = el.querySelector(".chips");
      menu.innerHTML = "";
      chips.innerHTML = "";
      data.choices.forEach(function (choice, i) {
        var item = itemTemplate.cloneNode();
        item.value = data.values[i];
        item.innerHTML = choice;
        var chip = chipTemplate.cloneNode(true);
        chip.value = data.values[i];
        chip.children[0].innerHTML = choice;

        if (data.selected.indexOf(data.values[i]) > -1) {
          item.classList.add("selected");
          chip.classList.add("active");
        }

        menu.appendChild(item);
        chips.appendChild(chip);
      });
    },
    _select: function _select(el, data) {
      var _this = this;

      el.querySelectorAll(".chip").forEach(function (item) {
        var value = item.value;

        if (data.reset) {
          _this.removeChip(el, value);
        }

        var match = data.fixed ? data.pattern.indexOf(value) > -1 : RegExp(data.pattern, "i").test(value);

        if (match != data.invert) {
          _this.addChip(el, value);
        }
      });
    }
  });
  Shiny.inputBindings.register(chipInputBinding, "yonder.chipInput");

  var fileInputBinding = new Shiny.InputBinding();
  document.addEventListener("DOMContentLoaded", function () {
    bsCustomFileInput.init(".yonder-file[id] input[type='file']");
  });
  $.extend(fileInputBinding, {
    Selector: {
      SELF: ".yonder-file",
      VALIDATE: "input[type='file']"
    },
    Events: [{
      type: "change",
      callback: function callback(el, _, self) {
        if (el.querySelector("button") !== null) return;

        self._doUpload(el);
      }
    }, {
      type: "click",
      selector: "button",
      callback: function callback(el, _, self) {
        return self._doUpload(el);
      }
    }, {
      type: "dragover",
      callback: function callback(_, e) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, {
      type: "dragcenter",
      callback: function callback(_, e) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, {
      type: "drop",
      callback: function callback(el, e, self) {
        e.stopPropagation();
        e.preventDefault();

        self._doUpload(el, e.originalEvent.dataTransfer.files);
      }
    }],
    getValue: function getValue(el) {
      return null;
    },
    _value: function _value() {
      return null;
    },
    _choice: function _choice() {
      return null;
    },
    _select: function _select() {
      return null;
    },
    _clear: function _clear() {
      return null;
    },
    _enable: function _enable(el, data) {
      el.querySelector("input[type='file']").removeAttribute("disabled");
    },
    _disable: function _disable(el, data) {
      el.querySelector("input[type='file']").setAttribute("disabled", "");
    },
    _sendFile: function _sendFile(uri, job, file, final, el) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", uri, true);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200 && final) {
          Shiny.shinyapp.makeRequest("uploadEnd", [job, el.id], function (res) {
            el.querySelector("input[type='file']").value = "";
          }, function (err) {
            console.error("uploadEnd request failed for " + el.id + ": " + err);
          });
        }
      };

      xhr.send(file);
    },
    _doUpload: function _doUpload(el, files) {
      var _this = this;

      var input = el.querySelector("input[type='file']");

      if (files === undefined) {
        files = input.files;
      }

      if (!files) {
        return;
      }

      if (!input.hasAttribute("multiple")) {
        files = Array.prototype.slice.call(files, 0, 1);
      } else {
        files = Array.prototype.slice.call(files);
      }

      var info = files.map(function (f) {
        return {
          name: f.name,
          size: f.size,
          type: f.type
        };
      });
      Shiny.shinyapp.makeRequest("uploadInit", [info], function (res) {
        var job = res.jobId;
        var uri = res.uploadUrl;

        for (var i = 0; i < files.length; i++) {
          _this._sendFile(uri, job, files[i], i === files.length - 1, el);
        }
      }, function (err) {
        console.error("uploadInit request failed for " + el.id + ": " + err);
      });
    }
  });
  Shiny.inputBindings.register(fileInputBinding, "yonder.fileInput");

  var formInputBinding = new Shiny.InputBinding();
  $.extend(formInputBinding, {
    Events: [{
      type: "click",
      selector: ".yonder-submit",
      callback: function callback(el, e, self) {
        self._VALUES[el.id] = e.currentTarget.value;
        $(el.querySelectorAll(".shiny-bound-input")).trigger("submission.yonder");
      }
    }],
    Type: "yonder.form",
    _VALUES: {},
    find: function find(scope) {
      var forms = Array.prototype.slice.call(scope.querySelectorAll(".yonder-form[id]"));
      return forms.filter(function (f) {
        return f.querySelector(".yonder-submit") !== null;
      });
    },
    initialize: function initialize(el) {
      this._VALUES[el.id] = null;
    },
    getValue: function getValue(el) {
      return {
        force: Date.now(),
        value: this._VALUES[el.id]
      };
    },
    _value: function _value() {
      return null;
    },
    _choice: function _choice() {
      return null;
    },
    _select: function _select() {
      return null;
    },
    _clear: function _clear() {
      return null;
    },
    _enable: function _enable() {
      return null;
    },
    _disable: function _disable() {
      return null;
    }
  });
  Shiny.inputBindings.register(formInputBinding, "yonder.formInput");

  var groupTextInputBinding = new Shiny.InputBinding();
  $.extend(groupTextInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-group-text[id]");
    },
    getValue: function getValue(el) {
      var inputs = el.querySelectorAll(".input-group-prepend .input-group-text, input, .input-group-append .input-group-text");
      return Array.prototype.slice.call(inputs).map(function (i) {
        return /^(DIV|SPAN)$/.test(i.tagName) ? i.innerText : i.value || null;
      }).filter(function (value) {
        return value !== null;
      });
    },
    getType: function getType() {
      return "yonder.group";
    },
    subscribe: function subscribe(el, callback) {
      var $el = $(el);

      if (el.querySelectorAll(".btn").length > 0) {
        $el.on("click", ".dropdown-item", function (e) {
          return callback();
        });
        $el.on("click", ".btn:not(.dropdown-toggle", function (e) {
          return callback();
        });
      } else {
        $el.on("input", function (e) {
          return callback(true);
        });
        $el.on("change", function (e) {
          return callback(true);
        });
      }
    },
    receiveMessage: function receiveMessage(el, msg) {
      var input = el.querySelector("input");

      if (msg.value) {
        input.value = msg.values;
      }

      if (msg.enable) {
        input.removeAttribute("disabled");
      }

      if (msg.disable) {
        input.setAttribute("disabled", "");
      }

      if (msg.valid) {
        el.querySelector("valid-feedback").innerHTML = msg.valid;
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
      }

      if (msg.invalid) {
        el.querySelector("invalid-feedback").innerHTML = msg.invalid;
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
      }

      if (!msg.valid && !msg.invalid) {
        input.classList.remove("is-valid");
        input.classList.remove("is-invalid");
        el.querySelector("invalid-feedback").innerHTML = "";
        el.querySelector("valid-feedback").innerHTML = "";
      }
    }
  });
  Shiny.inputBindings.register(groupTextInputBinding, "yonder.groupTextInput");
  var groupSelectInputBinding = new Shiny.InputBinding();
  $.extend(groupSelectInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-group-select[id]");
    },
    getValue: function getValue(el) {
      var inputs = el.querySelectorAll(".input-group-prepend .input-group-text, input, .input-group-append .input-group-text");
      return Array.prototype.slice.call(inputs).map(function (i) {
        return /^(DIV|SPAN)$/.test(i.tagName) ? i.innerText : i.value || null;
      }).filter(function (value) {
        return value !== null;
      });
    },
    getType: function getType() {
      return "yonder.group";
    },
    subscribe: function subscribe(el, callback) {
      var $el = $(el);

      if (el.querySelectorAll(".btn").length > 0) {
        $el.on("click", ".dropdown-item", function (e) {
          return callback();
        });
        $el.on("click", ".btn:not(.dropdown-toggle", function (e) {
          return callback();
        });
      } else {
        $el.on("change", function (e) {
          return callback(true);
        });
      }
    },
    receiveMessage: function receiveMessage(el, msg) {
      var select = el.querySelector("select");

      if (msg.content) {
        select.innerHTML = msg.content;
      }

      if (msg.enable) {
        var enable = msg.enable;

        if (enable === true) {
          select.removeAttribute("disabled");
        } else {
          select.querySelectorAll("option").forEach(function (option) {
            option.removeAttribute("disabled");
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable) {
          select.setAttribute("disabled", "");
        } else {
          select.querySelectorAll("option").forEach(function (option) {
            option.setAttribute("disabled", "");
          });
        }
      }

      if (msg.valid) {
        el.querySelector("valid-feedback").innerHTML = msg.valid;
        select.classList.remove("is-invalid");
        select.classList.add("is-valid");
      }

      if (msg.invalid) {
        el.querySelector("invalid-feedback").innerHTML = msg.invalid;
        select.classList.remove("is-valid");
        select.classList.add("is-invalid");
      }

      if (!msg.valid && !msg.invalid) {
        select.classList.remove("is-valid");
        select.classList.remove("is-invalid");
        el.querySelector("invalid-feedback").innerHTML = "";
        el.querySelector("valid-feedback").innerHTML = "";
      }
    }
  });
  Shiny.inputBindings.register(groupSelectInputBinding, "yonder.groupSelectInputBinding");

  var linkInputBinding = new Shiny.InputBinding();
  $.extend(linkInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-link[id]");
    },
    initialize: function initialize(el) {
      $(el).on("click", function (e) {
        return el.value = +el.value + 1;
      });
      el.value = 0;
    },
    getValue: function getValue(el) {
      return +el.value > 0 ? +el.value : null;
    },
    subscribe: function subscribe(el) {
      $(el).on("click.yonder", function (e) {
        return callback();
      });
    },
    unsubscribe: function unsubscribe(el) {
      return $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, data) {
      if (data.content) {
        el.innerHTML = data.content;
      }

      if (data.enable) {
        el.classList.remove("disabled");
        el.removeAttribute("disabled");
      }

      if (data.disable) {
        el.classList.add("disabled");
        el.setAttribute("disabled", "");
      }
    }
  });
  Shiny.inputBindings.register(linkInputBinding, "yonder.linkInput");

  var listGroupInputBinding = new Shiny.InputBinding();
  $.extend(listGroupInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-list-group[id]");
    },
    initialize: function initialize(el) {
      var $el = $(el);
      $el.on("click", ".list-group-item-action:not(.active):not(.disabled)", function (e) {
        el.querySelectorAll(".active").forEach(function (item) {
          item.classList.remove("active");
        });
        e.currentTarget.classList.add("active");
      });
      $el.on("click", ".list-group-item-action.active:not(.disabled)", function (e) {
        e.currentTarget.classList.remove("active");
      });
    },
    getValue: function getValue(el) {
      var items = el.querySelectorAll(".list-group-item-action.active:not(.disabled)");

      if (items.length === 0) {
        return null;
      }

      return Array.prototype.slice.call(items).map(function (i) {
        return i.value;
      });
    },
    subscribe: function subscribe(el, callback) {
      var $el = $(el);
      $el.on("click.yonder", function (e) {
        return callback();
      });
    },
    unsubcribe: function unsubcribe(el) {
      return $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.content) {
        el.querySelectorAll(".list-group-item").forEach(function (item) {
          el.removeChild(item);
        });
      }

      if (msg.enable) {
        var enable = msg.enable;

        if (enable === true) {
          el.querySelectorAll(".list-group-item").forEach(function (item) {
            item.classList.remove("disabled");
          });
        } else {
          el.querySelectorAll(".list-group-item").forEach(function (item) {
            if (enable.indexOf(item.value) > -1) {
              item.classList.remove("disabled");
            }
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable === true) {
          el.querySelectorAll(".list-group-item").forEach(function (item) {
            item.classList.add("disabled");
          });
        } else {
          el.querySelectorAll(".list-group-item").forEach(function (item) {
            if (disable.indexOf(item.value) > -1) {
              item.classList.add("disabled");
            }
          });
        }
      }
    }
  });
  Shiny.inputBindings.register(listGroupInputBinding, "yonder.listGroupInput");

  var menuInputBinding = new Shiny.InputBinding();
  $.extend(menuInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-menu[id]");
    },
    initialize: function initialize(el) {
      var $el = $(el);
      $el.on("click", ".dropdown-item:not(.disabled)", function (e) {
        var active = el.querySelector(".dropdown-item.active");

        if (active !== null) {
          active.classList.remove("active");
        }

        e.currentTarget.classList.add("active");
      });
      $el.on("nav.reset", function (e) {
        var active = el.querySelector(".dropdown-item.active");

        if (active !== null) {
          active.classList.remove("active");
        }
      });
    },
    getValue: function getValue(el) {
      var active = el.querySelector(".dropdown-item.active:not(.disabled)");

      if (active === null) {
        return null;
      }

      return active.value;
    },
    subscribe: function subscribe(el) {
      var $el = $(el);
      $el.on("click.yonder", function (e) {
        return callback();
      });
    },
    unsubscribe: function unsubscribe(el) {
      return $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.content) {
        el.querySelector(".dropdown-menu").innerHTML = msg.content;
      }

      if (msg.enable) {
        var enable = msg.enable;

        if (enable === true) {
          el.querySelector(".dropdown-toggle").classList.remove("disabled");
        } else {
          el.querySelectorAll(".dropdown-item").forEach(function (item) {
            if (enable.indexOf(item.value) > -1) {
              item.classList.remove("disabled");
            }
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable === true) {
          el.querySelector(".dropdown-toggle").classList.add("disabled");
        } else {
          el.querySelectorAll(".dropdown-item").forEach(function (item) {
            if (disable.indexOf(item.value) > -1) {
              item.classList.add("disabled");
            }
          });
        }
      }
    }
  });
  Shiny.inputBindings.register(menuInputBinding, "yonder.menuInput");

  var navInputBinding = new Shiny.InputBinding();
  $.extend(navInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-nav[id]");
    },
    initialize: function initialize(el) {
      var $el = $(el);
      $el.on("click", ".nav-link:not(.dropdown-toggle):not(.disabled)", function (e) {
        var active = el.querySelector(".dropdown-item.active");

        if (active !== null) {
          // trigger reset on menu input
          $(activeItem.parentNode.parentNode).trigger("nav.reset");
        }

        el.querySelectorAll(".active").forEach(function (a) {
          return a.classList.remove("active");
        });
        e.currentTarget.classList.add("active");
      });
      $el.on("click", ".dropdown-item:not(.disabled)", function (e) {
        el.querySelectorAll(".active").forEach(function (a) {
          return a.classList.remove("active");
        });
        e.currentTarget.parentNode.parentNode.children[0].classList.add("active");
        e.currentTarget.classList.add("active");
      });
    },
    getValue: function getValue(el) {
      var active = el.querySelector(".nav-link.active:not(.disabled)");

      if (active === null) {
        return null;
      }

      return active.value;
    },
    subscribe: function subscribe(el) {
      var $el = $(el);
      $el.on("click.yonder", function (e) {
        return callback();
      });
    },
    unsubscribe: function unsubscribe(el) {
      return $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.content) {
        el.querySelectorAll(".nav-item").forEach(function (item) {
          return el.removeChild(item);
        });
        el.insertAdjacentHTML("afterbegin", msg.content);
      }

      if (msg.enable) {
        var enable = msg.enable;

        if (enable === true) {
          el.querySelectorAll(".nav-link").forEach(function (link) {
            link.classList.remove("disabled");
          });
        } else {
          el.querySelectorAll(".nav-link").forEach(function (link) {
            if (enable.indexOf(link.value) > -1) {
              link.classList.remove("disabled");
            }
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable === true) {
          el.querySelectorAll(".nav-link").forEach(function (link) {
            link.classList.add("disabled");
          });
        } else {
          el.querySelectorAll(".nav-link").forEach(function (link) {
            if (disable.indexOf(link.value) > -1) {
              link.classList.add("disabled");
            }
          });
        }
      }
    }
  });
  Shiny.inputBindings.register(navInputBinding, "yonder.navInput");
  Shiny.addCustomMessageHandler("yonder:pane", function (msg) {
    var _show = function _show(pane) {
      if (pane === null || !pane.parentElement.classList.contains("tab-content")) {
        return;
      }

      var previous = pane.parentElement.querySelector(".active");

      var complete = function complete() {
        var hiddenEvent = $.Event("hidden.bs.tab", {
          relatedTarget: pane
        });
        var shownEvent = $.Event("shown.bs.tab", {
          relatedTarget: previous
        });
        $(previous).trigger(hiddenEvent);
        $(pane).trigger(shownEvent);
      };

      bootstrap.Tab.prototype._activate(pane, pane.parentElement, complete);
    };

    var _hide = function _hide(pane) {
      if (pane === null || !pane.parentElement.classList.contains("tab-content") || !pane.classList.contains("active")) {
        return;
      }

      var complete = function complete() {
        var hiddenEvent = $.Event("hidden.bs.tab", {
          relatedTarget: pane
        });
        $(pane).trigger(hiddenEvent);
      };

      var dummy = document.createElement("div");

      bootstrap.Tab.prototype._activate(dummy, pane.parentElement, complete);
    };

    if (msg.type === undefined || msg.data === undefined || msg.data.target === undefined) {
      return;
    }

    var target = document.getElementById(msg.data.target);

    if (target === null) {
      return;
    }

    if (msg.type === "show") {
      _show(target);
    } else if (msg.type === "hide") {
      _hide(target);
    }
  });

  var radioInputBinding = new Shiny.InputBinding();
  $.extend(radioInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-radio[id]");
    },
    getValue: function getValue(el) {
      var radios = el.querySelectorAll(".custom-radio > input:checked:not(:disabled)");

      if (radios.length === 0) {
        return null;
      }

      return Array.prototype.slice.call(radios).map(function (r) {
        return r.value;
      });
    },
    subscribe: function subscribe(el, callback) {
      var $el = $(el);
      $el.on("change.yonder", function (e) {
        return callback();
      });
    },
    unsubscribe: function unsubscribe(el) {
      $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.content) {
        el.querySelectorAll(".custom-radio").forEach(function (radio) {
          el.removeChild(radio);
        });
        el.insertAdjacentHTML("afterbegin", msg.content);
      }

      if (msg.enable) {
        var enable = msg.enable;

        if (enable === true) {
          el.querySelectorAll(".custom-radio > input").forEach(function (input) {
            input.removeAttribute("disabled");
          });
        } else {
          el.querySelectorAll(".custom-radio > input").forEach(function (input) {
            if (enable.indexOf(input.value) > -1) {
              input.removeAttribute("disabled");
            }
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable === true) {
          el.querySelectorAll(".custom-radio > input").forEach(function (input) {
            input.setAttribute("disabled", "");
          });
        } else {
          el.querySelectorAll(".custom-radio > input").forEach(function (input) {
            if (disable.indexOf(input.value) > -1) {
              input.setAttribute("disabled", "");
            }
          });
        }
      }

      if (msg.valid) {
        el.querySelector(".valid-feedback").innerHTML = msg.valid;
        el.querySelectorAll(".custom-radio").forEach(function (radio) {
          radio.classList.add("is-valid");
        });
      }

      if (msg.invalid) {
        el.querySelector(".invalid-feedback").innerHTML = msg.invalid;
        el.querySelectorAll(".custom-radio").forEach(function (radio) {
          radio.classList.add("is-invalid");
        });
      }

      if (!msg.valid && !msg.invalid) {
        el.querySelector(".valid-feedback").innerHTML = "";
        el.querySelector(".invalid-feedback").innerHTML = "";
        el.querySelectorAll(".custom-radio").forEach(function (radio) {
          radio.classList.remove("is-valid");
          radio.classList.remove("is-invalid");
        });
      }
    }
  });
  Shiny.inputBindings.register(radioInputBinding, "yonder.radioInput");

  var radiobarInputBinding = new Shiny.InputBinding();
  $.extend(radiobarInputBinding, {
    Selector: {
      SELF: ".yonder-radiobar[id]",
      SELECTED: "input:checked:not(:disabled)"
    },
    Events: [{
      type: "click"
    }, {
      type: "change"
    }],
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-radiobar[id]");
    },
    getValue: function getValue(el) {
      var radios = el.querySelectorAll("input:checked:not(:disabled)");

      if (radios.length === 0) {
        return null;
      }

      return Array.prototype.slice.call(radios).map(function (r) {
        return r.value;
      });
    },
    subscribe: function subscribe(el, callback) {
      var $el = $(el);
      $el.on("click.yonder", function (e) {
        return callback();
      });
      $el.on("change.yonder", function (e) {
        return callback();
      });
    },
    unsubscribe: function unsubscribe(el) {
      $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.content) {
        el.innerHTML = msg.content;
      }

      if (msg.enable) {
        var enable = msg.enable;

        if (enable === true) {
          el.querySelectorAll(".btn").forEach(function (btn) {
            btn.classList.remove("disabled");
            btn.children[0].removeAttribute("disabled");
          });
        } else {
          el.querySelectorAll("input").forEach(function (input) {
            if (enable.indexOf(input.value) > -1) {
              input.parentNode.classList.remove("disabled");
              input.removeAttribute("disabled");
            }
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable === true) {
          el.querySelectorAll(".btn").forEach(function (btn) {
            btn.classList.add("disabled");
            btn.children[0].setAttribute("disabled", "");
          });
        } else {
          el.querySelectorAll("input").forEach(function (input) {
            if (disable.indexOf(input.value) > -1) {
              input.parentNode.classList.add("disabled");
              input.setAttribute("disabled", "");
            }
          });
        }
      }
    }
  });
  Shiny.inputBindings.register(radiobarInputBinding, "yonder.radiobarInput");

  var rangeInputBinding = new Shiny.InputBinding();
  $.extend(rangeInputBinding, {
    Selector: {
      SELF: ".yonder-range[id]"
    },
    Events: [{
      type: "change"
    }],
    initialize: function initialize(el) {
      $(el.querySelector("input")).ionRangeSlider();
    },
    getId: function getId(el) {
      return el.id;
    },
    getValue: function getValue(el) {
      var $input = $("input[type='text']", el);
      var data = $input.data("ionRangeSlider");

      if ($input.data("type") === "double") {
        return [data.result.from, data.result.to];
      } else if ($input.data("type") === "single") {
        if (data.result.from_value !== null) {
          return data.result.from_value.replace("&#44;", ",");
        } else {
          return data.result.from;
        }
      } else {
        return null;
      }
    },
    getState: function getState(el, data) {
      return {
        value: this.getValue(el)
      };
    },
    _update: function _update(el, data) {
      $(el.querySelector(".irs-hidden-input")).data("ionRangeSlider").update({
        values: data.values
      });
    },
    _select: function _select(el, data) {
      $(el.querySelector(".irs-hidden-input")).data("ionRangeSlider"); // need to check if input is a numeric range input or choices slider
    },
    dispose: function dispose(el) {
      $(el.querySelector(".irs-hidden-input")).data("ionRangeSlider").destroy();
    }
  });
  Shiny.inputBindings.register(rangeInputBinding, "yonder.rangeInput");

  var selectInputBinding = new Shiny.InputBinding();
  $.extend(selectInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-select[id]");
    },
    getValue: function getValue(el) {
      var selected = el.querySelectorAll("option:checked:not(:disabled");

      if (selected.length === 0) {
        return null;
      }

      return Array.prototype.slice.call(selected).map(function (o) {
        return o.value;
      });
    },
    subscribe: function subscribe(el, callback) {
      var $el = $(el);
      $el.on("change.yonder", function (e) {
        return callback();
      });
    },
    unsubscribe: function unsubscribe(el) {
      $(el).off(".yonder");
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.content) {
        el.querySelector(".custom-select").innerHTML = msg.content;
      }

      if (msg.enable) {
        var enable = msg.enable;

        if (enable === true) {
          el.querySelector(".custom-select").classList.remove("disabled");
        } else {
          el.querySelectorAll("option").forEach(function (opt) {
            if (enable.indexOf(opt.value) > -1) {
              opt.removeAttribute("disabled");
            }
          });
        }
      }

      if (msg.disable) {
        var disable = msg.disable;

        if (disable === true) {
          el.querySelector(".custom-select").classList.add("disabled");
        } else {
          el.querySelectorAll("option").forEach(function (opt) {
            if (disable.indexOf(opt.value) > -1) {
              opt.setAttribute("disabled", "");
            }
          });
        }
      }

      if (msg.valid) {
        el.querySelector(".custom-select").classList.add("is-valid");
        el.querySelector(".valid-feedback").innerHTML = msg.valid;
      }

      if (msg.invalid) {
        el.querySelector(".custom-select").classList.add("is-invalid");
        el.querySelector(".invalid-feedback").innerHTML = msg.invalid;
      }

      if (!msg.valid && !msg.invalid) {
        var select = el.querySelector(".custom-select");
        select.classList.remove("is-valid");
        select.classList.remove("is-invalid");
        el.querySelector(".valid-feedback").innerHTML = "";
        el.querySelector(".invalid-feedback").innerHTML = "";
      }
    }
  });
  Shiny.inputBindings.register(selectInputBinding, "yonder.selectInput");

  var textualInputBinding = new Shiny.InputBinding();
  $.extend(textualInputBinding, {
    find: function find(scope) {
      return scope.querySelectorAll(".yonder-textual[id]");
    },
    getValue: function getValue(el) {
      var input = el.children[0];
      return input.type === "number" ? Number(input.value) : input.value;
    },
    subscribe: function subscribe(el, callback) {
      var $el = $(el);
      $el.on("change.yonder", function (e) {
        return callback(true);
      });
      $el.on("input.yonder", function (e) {
        return callback(true);
      });
    },
    unsubscribe: function unsubscribe(el) {
      return $(el).off(".yonder");
    },
    getRatePolicy: function getRatePolicy() {
      return {
        policy: "debounce",
        delay: 250
      };
    },
    receiveMessage: function receiveMessage(el, msg) {
      if (msg.value !== null) {
        el.querySelector("input").value = msg.value;
      }

      if (msg.enable) {
        el.children[0].removeAattribute("disabled");
      }

      if (msg.disable) {
        el.children[0].setAttribute("disabled", "");
      }

      if (msg.valid) {
        el.querySelector(".valid-feedback").innerHTML = msg.valid;
        el.classList.remove("is-invalid");
        el.classList.add("is-valid");
      }

      if (msg.invalid) {
        el.querySelector(".invalid-feedback").innerHTML = msg.invalid;
        el.classList.remove("is-valid");
        el.classList.add("is-invalid");
      }

      if (!msg.valid && !msg.invalid) {
        el.querySelector(".valid-feedback").innerHTML = "";
        el.querySelector(".invalid-feedback").innerHTML = "";
        el.children[0].classList.remove("is-valid");
        el.children[0].classList.remove("is-invalid");
      }
    }
  });
  Shiny.inputBindings.register(textualInputBinding, "yonder.textualInput");

  $.extend(Shiny.progressHandlers, {
    "yonder-progress": function yonderProgress(msg) {
      if (!msg.type || !msg.data.outlet) {
        return false;
      }

      var $outlet = $("#" + msg.data.outlet);

      if (msg.type === "show") {
        var $bar = $(msg.data.content);

        if ($bar[0].id && $outlet.find("#" + $bar[0].id).length) {
          $outlet.find("#" + $bar[0].id).replaceWith($bar);
        } else {
          $outlet.append($bar);
        }

        return true;
      }

      return false;
    }
  });

  Shiny.addCustomMessageHandler("yonder:collapse", function (msg) {
    if (msg.type === undefined || msg.data === undefined || msg.data.target === undefined) {
      return false;
    }

    if (msg.type === "show" || msg.type === "hide" || msg.type === "toggle") {
      var target = document.getElementById(msg.data.target);

      if (target === null) {
        return false;
      }

      $(target).collapse(msg.type);
      return true;
    }

    return false;
  });

  Shiny.addCustomMessageHandler("yonder:element", function (msg) {
    var _render = function _render(data) {
      if (data.dependencies) {
        Shiny.renderDependencies(data.dependencies);
      }

      var container = document.getElementById(data.target);

      if (container === null) {
        return;
      }

      Shiny.unbindAll(container);
      container.innerHTML = data.content;
      Shiny.initializeInputs(container);
      Shiny.bindAll(container);
    };

    var _remove = function _remove(data) {
      var container = document.getElementById(data.target);

      if (container === null) {
        return;
      }

      Shiny.unbindAll(container);
      container.innerHTML = "";
    };

    if (!msg.type) {
      return;
    }

    if (msg.type === "render") {
      _render(msg.data);
    } else if (msg.type === "remove") {
      _remove(msg.data);
    } else {
      console.warn("no element " + msg.type + " method");
    }
  });

  $(function () {
    $(document).on("hidden.bs.modal", ".modal", function (e) {
      Shiny.unbindAll(e.currentTarget);
    });
  });
  Shiny.addCustomMessageHandler("yonder:modal", function (msg) {
    if (msg.type === undefined) {
      return false;
    }

    var _hide = function _hide(data) {
      $(document.getElementById(data.id)).modal("hide");
    };

    var _show = function _show(data) {
      var modal = document.getElementById(data.id);

      if (data.exprs) {
        Object.keys(data.exprs).forEach(function (key) {
          var outlet = modal.querySelector("span[data-target='" + data.id + "__" + key + "']");

          if (outlet) {
            outlet.innerHTML = data.exprs[key];
          }
        });
      }

      $(modal).modal("show");
    };

    var _register = function _register(data) {
      var modal = document.createElement("div");
      modal.classList.add("modal");
      modal.classList.add("fade");
      modal.setAttribute("tabindex", -1);
      modal.setAttribute("role", "dialog");
      modal.setAttribute("id", data.id);

      if (data.dependencies !== undefined) {
        Shiny.renderDependencies(data.dependencies);
      }

      document.body.appendChild(modal);
      var content = data.content.replace(/[{]\s*([a-z0-9_.]+)\s*[}]/g, function (m, id) {
        return "<span data-target='" + data.id + "__" + id + "'></span>";
      });
      modal.insertAdjacentHTML("afterbegin", content);
      Shiny.initializeInputs(modal);
      Shiny.bindAll(modal);
    };

    if (msg.type === "hide") {
      _hide(msg.data);
    } else if (msg.type === "show") {
      _show(msg.data);
    } else if (msg.type === "register") {
      _register(msg.data);
    } else {
      console.warn("no modal " + msg.type + " method");
    }
  });

  $(function () {
    document.body.insertAdjacentHTML("beforeend", "<div class='toasts'></div>");
    $(".toasts").on("hidden.bs.toast", ".toast", function (e) {
      if (e.currentTarget.hasAttribute("data-action")) {
        var action = e.currentTarget.getAttribute("data-action");
        Shiny.onInputChange(action, true);
        setTimeout(function () {
          return Shiny.onInputChange(action, null);
        }, 100);
      }

      e.delegateTarget.removeChild(e.currentTarget);
    });
  });
  Shiny.addCustomMessageHandler("yonder:toast", function (msg) {
    var _show = function _show(data) {
      document.querySelector(".toasts").insertAdjacentHTML("beforeend", data.content);
      $(".toasts > .toast:last-child").toast("show");
    };

    var _close = function _close(data) {
      var toasts = document.querySelectorAll(".toasts .toast");

      if (toasts.length) {
        $(toasts).toast("hide");
      }
    };

    if (!msg.type) {
      return;
    }

    if (msg.type === "show") {
      _show(msg.data);
    } else if (msg.type === "close") {
      _close(msg.data);
    } else {
      console.warn("no toast " + msg.type + " method");
    }
  });

  $(function () {
    $("[data-toggle=\"tooltip\"]").tooltip();
    $("[data-toggle=\"popover\"]").popover();
    $(document).on("shiny:connected", function () {
      $(".yonder-submit[data-type=\"submit\"]").attr("type", "submit");
    });
    Shiny.addCustomMessageHandler("yonder:popover", function (msg) {
      if (msg.data.target === undefined) {
        return;
      }

      if (msg.type == "show") {
        var data = msg.data;
        var target = "#" + data.target;
        $(target).popover({
          title: function title() {
            return undefined;
          },
          content: function content() {
            return undefined;
          },
          template: data.content,
          placement: data.placement,
          trigger: "manual"
        });

        if (data.duration) {
          setTimeout(function () {
            return $(target).popover("hide");
          }, data.duration);
        }

        $(target).popover("show");
        return;
      }

      if (msg.type == "close") {
        $("#" + msg.data.id).popover("hide");
        return;
      }
    });
    Shiny.addCustomMessageHandler("yonder:download", function (msg) {
      if (!(msg.filename && msg.token && msg.key)) {
        throw "invalid download event";
      }

      var uri = "/session/" + msg.token + "/download/" + msg.key;
      var agent = window.navigator.userAgent;
      var ie = /MSIE/.test(agent);

      if (ie === true) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", uri);
        xhr.responseType = "blob";

        xhr.onload = function () {
          return saveAs(xhr.response, msg.filename);
        };

        xhr.send();
      } else {
        fetch(uri).then(function (res) {
          return res.blob();
        }).then(function (blob) {
          saveAs(blob, msg.filename);
        });
      }
    });
  });

})));
//# sourceMappingURL=yonder.js.map
