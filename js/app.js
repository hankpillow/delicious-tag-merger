(function() {
  var Login, TagList, TagMerger,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  TagMerger = (function() {

    TagMerger.prototype.dom = {};

    TagMerger.prototype.merge_url = "/merge";

    TagMerger.prototype.messages = {
      url_cont: "These tags were found in {count} urls.",
      invalid: "You must choose a tag value before.",
      empty_list: "You have nothing to merge.",
      label_merge: "Merge",
      label_stop: "Stop",
      label_complete: "Clear",
      merge_complete: "Merge finished.",
      system_error: "Error connecting to server. Try again later.",
      service_error: "Service error. try again later!",
      parse_error: "Seems that Deliciou's API has changed. The xml can't be parsed properly. Try again later!",
      api_error: "Seems that Deliciou's API is offline.Try again later!"
    };

    TagMerger.prototype.posts = void 0;

    TagMerger.prototype.selection = void 0;

    TagMerger.prototype.is_deleting = false;

    TagMerger.prototype.tags_to_merge = 0;

    function TagMerger() {
      var _this = this;
      this.dom.div = $("#step3");
      this.dom.tag_name = $("#tag_name");
      this.dom.tag_control = $("#tag_control");
      this.dom.tags = $("#tags_to_merge");
      this.dom.btn = $("#btn_merge");
      this.dom.form = $("#frm_merge");
      this.dom.status = $("#status_merge");
      this.dom.tag_count = $("#tag_count");
      this.dom.bar = $("#progress_bar");
      this.dom.progress = $("#progress_container");
      this.dom.tag_count.hide().fadeOut();
      this.dom.progress.hide().fadeOut();
      this.dom.status.hide().fadeOut();
      this.dom.div.hide().fadeOut();
      this.btn_status("merge");
      this.dom.form.unbind("submit");
      this.dom.form.bind("submit", function(event) {
        var _ref;
        event.preventDefault();
        if (_this.is_deleting === true) {
          _this.stop_merging();
          return;
        } else {
          if (_this.dom.tag_name.val().length === 0) {
            _this.dom.tag_control.addClass("error");
            _this.merge_status(_this.messages.invalid, "alert-error");
            return;
          }
          _this.dom.tag_control.removeClass("error");
          if (_this.selection === void 0 || ((_ref = _this.selection) != null ? _ref.length : void 0) === 0) {
            _this.merge_status(_this.messages.empty_list, "alert-error");
            return;
          }
        }
        _this.merge_status(void 0);
        _this.dom.tag_control.hide();
        _this.dom.progress.show();
        _this.tags_to_merge = _this.selection.length;
        return _this.start_merging();
      });
    }

    TagMerger.prototype.init = function(posts) {
      this.posts = posts;
      return this.dom.div.fadeIn("slow");
    };

    TagMerger.prototype.stop_merging = function(event) {
      var _ref;
      this.merge_status(void 0);
      this.is_deleting = false;
      this.btn_status("merge");
      this.dom.tag_name.val("");
      this.dom.tag_control.show();
      this.dom.progress.hide();
      this.dom.bar.width("0%");
      return (_ref = window.tag_list) != null ? _ref.unfreeze() : void 0;
    };

    TagMerger.prototype.start_merging = function(event) {
      var _ref;
      this.dom.btn.fadeIn();
      this.btn_status("stop");
      this.is_deleting = true;
      if ((_ref = window.tag_list) != null) _ref.freeze();
      return this.merge();
    };

    TagMerger.prototype.merge = function() {
      var percent, tag, to_merge, _i, _len, _ref,
        _this = this;
      if (this.selection.length === 0) {
        this.merge_status(this.messages.merge_complete, "alert-success");
        this.btn_status("complete");
        this.dom.bar.width("100%");
        _ref = this.dom.tags.find("a");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tag = _ref[_i];
          $(tag).detach();
        }
        return;
      }
      to_merge = this.selection.shift();
      percent = (this.tags_to_merge - this.selection.length) / this.tags_to_merge;
      this.dom.bar.width("" + (percent * 100) + "%");
      return $.ajax({
        url: this.merge_url,
        type: "POST",
        dataType: "json",
        success: function(data) {
          return _this.handle_merge_parse(data);
        },
        error: function(data) {
          return _this.handle_merge_error(data);
        },
        data: {
          username: window.login.dom.user.val(),
          password: window.login.dom.pass.val(),
          old_tag: to_merge,
          new_tag: this.dom.tag_name.val()
        }
      });
    };

    TagMerger.prototype.handle_merge_error = function(data) {
      this.stop_merging();
      return this.merge_status(this.messages.system_error, "alert-error");
    };

    TagMerger.prototype.handle_merge_parse = function(data) {
      var code, result_node, xml;
      if (!data || !data.result || (data.status_code !== void 0 && data.status_code !== 0)) {
        this.stop_merging();
        this.merge_status(data.message || this.messages.service_error, "alert-error");
        return;
      }
      try {
        xml = $.parseXML(data.result);
        result_node = $(xml).find("result").get(0);
        code = $(result_node).attr("code");
      } catch (err) {
        this.stop_merging();
        this.merge_status(this.messages.api_error, "alert-error");
        return;
      }
      if (code === "done") {
        this.merge_status(void 0);
        return this.merge();
      } else {
        this.stop_merging();
        return this.merge_status(this.messages.api_error, "alert-error");
      }
    };

    TagMerger.prototype.merge_status = function(msg, style) {
      if (msg === void 0) {
        this.dom.status.text("").fadeOut("fast");
        return;
      }
      return this.dom.status.removeClass().addClass("alert " + style).text(msg).fadeIn("slow");
    };

    TagMerger.prototype.btn_status = function(status) {
      switch (status) {
        case "merge":
          this.dom.btn.removeClass("btn-danger, btn-success").addClass("btn-primary");
          return this.dom.btn.text(this.messages.label_merge);
        case "stop":
          this.dom.btn.removeClass("btn-primary, btn-success").addClass("btn-danger");
          return this.dom.btn.text(this.messages.label_stop);
        case "complete":
          this.dom.btn.removeClass("btn-primary, btn-danger").addClass("btn-success");
          return this.dom.btn.text(this.messages.label_complete);
      }
    };

    TagMerger.prototype.collect_urls = function() {
      var node, tag, tag_count, _i, _j, _len, _len2, _ref, _ref2;
      this.selection = (function() {
        var _i, _len, _ref, _results;
        _ref = this.dom.tags.find("a");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tag = _ref[_i];
          _results.push($(tag).text());
        }
        return _results;
      }).call(this);
      tag_count = [];
      _ref = this.selection;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        _ref2 = this.posts;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          node = _ref2[_j];
          if (__indexOf.call($(node).attr("tag").split(" "), tag) >= 0) {
            tag_count.push(node);
          }
        }
      }
      if (tag_count.length !== 0 && this.selection.length !== 0) {
        return this.dom.tag_count.text(this.messages.url_cont.replace("{count}", tag_count.length)).fadeIn("slow");
      } else {
        return this.dom.tag_count.text("").fadeOut("slow");
      }
    };

    TagMerger.prototype.add_tag = function(tag) {
      var _this = this;
      if (tag == null) tag = void 0;
      if (this.is_deleting === true) return;
      if (tag != null) {
        tag.unbind("click").removeClass("btn-info").addClass("btn-danger");
      }
      if (tag != null) {
        tag.click(function() {
          var _ref;
          if (_this.is_deleting === true) return;
          if ((_ref = window.tag_list) != null) _ref.add_tag(tag);
          return _this.collect_urls();
        });
      }
      if (tag !== void 0) this.dom.tags.append(tag);
      if (tag !== void 0) return this.collect_urls();
    };

    TagMerger.prototype.dispose = function() {
      var tag, _i, _len, _ref, _results;
      this.stop_merging();
      this.dom.tag_count.text("").fadeOut();
      this.dom.progress.fadeOut();
      this.dom.bar.width("0%");
      this.dom.status.fadeOut();
      this.dom.div.hide();
      this.posts = void 0;
      this.selection = void 0;
      _ref = this.dom.tags.find("a");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        _results.push($(tag).detach());
      }
      return _results;
    };

    return TagMerger;

  })();

  TagList = (function() {

    TagList.prototype.dom = {};

    function TagList() {
      this.dom.div = $("#step2");
      this.dom.tags = $("#tag_list");
      this.dom.div.hide().fadeOut();
    }

    TagList.prototype.init = function(list) {
      var index, tag, _len, _results;
      this.dom.div.fadeIn("slow");
      list.sort();
      _results = [];
      for (index = 0, _len = list.length; index < _len; index++) {
        tag = list[index];
        if (tag.length > 0) {
          _results.push(this.add_tag($("<a data-index='" + index + "' class='btn btn-mini btn-info tag'>" + tag + "</a>"), false));
        }
      }
      return _results;
    };

    TagList.prototype.freeze = function() {
      return this.dom.tags.find("a").each(function(value) {
        return $(this).removeClass("btn-info");
      });
    };

    TagList.prototype.unfreeze = function() {
      return this.dom.tags.find("a").each(function(value) {
        return $(this).addClass("btn-info");
      });
    };

    TagList.prototype.add_tag = function(tag, sort) {
      var all_indexes, all_tags, greater, item, target_index, value, _i, _len,
        _this = this;
      if (sort == null) sort = true;
      if (tag === void 0) return;
      tag.unbind("click").removeClass("btn-danger").addClass("btn-info");
      tag.click(function(value) {
        var _ref;
        return (_ref = window.tag_merger) != null ? _ref.add_tag(tag) : void 0;
      });
      target_index = Number($(tag).attr('data-index'));
      all_indexes = this.dom.tags.find("a");
      if (all_indexes.length > 1 && sort === true) {
        all_tags = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = all_indexes.length; _i < _len; _i++) {
            item = all_indexes[_i];
            _results.push(Number($(item).attr("data-index")));
          }
          return _results;
        })();
        greater = void 0;
        for (_i = 0, _len = all_tags.length; _i < _len; _i++) {
          value = all_tags[_i];
          if (greater !== void 0) break;
          if (value > target_index) greater = value;
        }
        if (greater === void 0) {
          return this.dom.tags.append(tag);
        } else {
          return this.dom.tags.find("a[data-index='" + greater + "']").before(tag);
        }
      } else {
        return this.dom.tags.append(tag);
      }
    };

    TagList.prototype.dispose = function() {
      var tag, _i, _len, _ref;
      _ref = this.dom.tags.find("a");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        $(tag).detach();
      }
      return this.dom.div.hide();
    };

    return TagList;

  })();

  Login = (function() {

    function Login() {}

    Login.prototype.dom = {};

    Login.prototype.login_url = "/login";

    Login.prototype.messages = {
      invalid: "Check the username and password.",
      system_error: "Error connecting to server. Try again later.",
      connecting_api: "Connecting to server.",
      service_error: "Service error. try again later!",
      parse_error: "Seems that Deliciou's API has changed. The xml can't be parsed properly. Try again later!",
      api_error: "Seems that Deliciou's API is offline.Try again later!",
      label_login: "Login",
      label_connecting: "Conecting",
      label_logout: "Logout",
      hello: "Hello "
    };

    Login.prototype.init = function() {
      var _this = this;
      this.dom.div = $("#step1");
      this.dom.user = $("#delicious_user");
      this.dom.pass = $("#delicious_pass");
      this.dom.status = $("#login_status");
      this.dom.btn = $("#btn_login");
      this.dom.user_name = $("#delicious_name");
      this.dom.form = $("#frm_login");
      this.dom.fields = $("#frm_login fieldset");
      this.dom.user.parent().removeClass("error");
      this.dom.pass.parent().removeClass("error");
      this.dom.form.unbind("submit");
      this.dom.form.bind("submit", function(event) {
        if (event != null) event.preventDefault();
        if (_this.status === "logout") {
          return _this.logout();
        } else {
          return _this.login();
        }
      });
      return this.btn_status("login");
    };

    Login.prototype.btn_status = function(_status) {
      this.status = _status;
      switch (this.status) {
        case "logout":
          this.dom.btn.removeClass("active btn-primary").addClass("btn-danger");
          return this.dom.btn.val(this.messages.label_logout);
        case "connecting":
          this.dom.btn.addClass("active");
          return this.dom.btn.val(this.messages.label_connecting);
        case "login":
          this.dom.btn.removeClass("active btn-danger").addClass("btn-primary");
          return this.dom.btn.val(this.messages.label_login);
      }
    };

    Login.prototype.form_status = function(msg, style) {
      if (msg === void 0) {
        this.dom.status.text("").fadeOut();
        return;
      }
      return this.dom.status.removeClass().addClass("show alert " + style).text(msg).fadeIn();
    };

    Login.prototype.logout = function() {
      var _ref, _ref2;
      this.dom.user_name.text("");
      this.dom.user.val("");
      this.dom.pass.val("");
      this.dom.user_name.fadeOut();
      this.dom.fields.fadeIn();
      this.init();
      if ((_ref = window.tag_list) != null) _ref.dispose();
      return (_ref2 = window.tag_merger) != null ? _ref2.dispose() : void 0;
    };

    Login.prototype.login = function() {
      var _this = this;
      if (this.dom.user.val().length === 0) {
        this.dom.user.parent().addClass("error");
        this.form_status(this.messages.invalid, "alert-error");
        return;
      }
      this.dom.user.parent().removeClass("error");
      if (this.dom.pass.val().length === 0) {
        this.dom.pass.parent().addClass("error");
        this.form_status(this.messages.invalid, "alert-error");
        return;
      }
      this.dom.pass.parent().removeClass("error");
      this.btn_status("connecting");
      this.form_status(this.messages.connecting_api, "alert-info");
      return $.ajax({
        url: this.login_url,
        type: "POST",
        dataType: "json",
        success: function(data) {
          return _this.handle_login_parse(data);
        },
        error: function(data) {
          return _this.handle_login_error(data);
        },
        data: {
          username: this.dom.user.val(),
          password: this.dom.pass.val(),
          start: 0
        }
      });
    };

    Login.prototype.handle_login_error = function(data) {
      return this.form_status(this.messages.system_error, "alert-error");
    };

    Login.prototype.handle_login_parse = function(data) {
      var posts, posts_list, result_node, tag, tags, value, xml, _i, _j, _len, _len2, _ref;
      if (!data || !data.result || (data.status_code !== void 0 && data.status_code !== 0)) {
        this.form_status(data.message || this.messages.service_error, "alert-error");
        this.btn_status("login");
        return;
      }
      try {
        xml = $.parseXML(data.result);
      } catch (err) {
        this.form_status(this.messages.api_error, "alert-error");
        this.btn_status("login");
        return;
      }
      result_node = $(xml).find("result").get(0);
      if (result_node) {
        this.form_status("Delious API says: " + $(result_node).attr("code"), "alert-error");
        this.btn_status("login");
        return;
      }
      posts = $(xml).find("posts").get(0);
      if (!posts) {
        this.form_status(messages.parse_error, "alert-error");
        this.btn_status("login");
        return;
      }
      this.btn_status("logout");
      this.form_status(void 0);
      this.dom.fields.fadeOut();
      this.dom.user_name.text(this.messages.hello + $(posts).attr("user"));
      this.dom.user_name.fadeIn();
      posts_list = $(posts).find("post");
      tags = [];
      for (_i = 0, _len = posts_list.length; _i < _len; _i++) {
        value = posts_list[_i];
        _ref = $(value).attr("tag").split(" ");
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          tag = _ref[_j];
          if (__indexOf.call(tags, tag) < 0) tags.push(tag);
        }
      }
      window.tag_merger.init(posts_list);
      return window.tag_list.init(tags);
    };

    return Login;

  })();

  window.login = new Login;

  window.tag_merger = new TagMerger;

  window.tag_list = new TagList;

}).call(this);
