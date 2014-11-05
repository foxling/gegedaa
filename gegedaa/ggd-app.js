define(function(require, exports, module) {

  var bg           = chrome.extension.getBackgroundPage();
  var gegedaa      = bg.gegedaa;
  var $            = require('$');
  var _            = require('_');
  var View         = require('./view');
  var UsersStatus  = require('./users-status');
  var Notification = require('./notification');

  var GGDApp = View.extend({
    className: 'app-body',
    id: 'app-body',

    initialize: function GGDApp(options){
      this.setElement($('#app-body'));
      View.prototype.initialize.call(this, options);

      this.presentViews = [];

      this.$contentView = $('<div class="app-main-container"></div>');
      this.$el.append(this.$contentView).append('<div id="post-panel-overlayer" class="post-panel-overlayer"></div>');

      if ( window.location.href.indexOf('windowmode=tab') === -1 ) {
        this.setDisplayMode('popup');
      }

      Notification.on('switch_user', function(user){
        this._setDefaultTab();
      }, this);
    },

    remove: function(){
      _.each(this.presentViews, function(v){
        v.remove();
      });
      this.presentViews = null;
      Notification.off();
      View.prototype.remove.call(this);
    },

    presentView: function(vc){
      if ( this.selectedItemIndex >= 0 ) {
        this.lastSelectedItemIndex = this.selectedItemIndex;
      }

      var hideCss = {
        'display': 'none',
        'z-index': 0
      };

      _.each(this.presentViews, function(v){
        v.$el.css({
          'visibility': 'hidden',
          'z-index': 0
        });
      });

      this.presentViews.push(vc);
      vc.$el.css({
        'z-index': 1,
        'visibility': 'visible'
      });
      this.$contentView.append(vc.$el);
      if ( !vc.rendered ) vc.render();

      var currentView = this.views[this.selectedItemIndex];
      if ( currentView ) {
        currentView.$el.css(hideCss);
      }

      this.navBar && this.navBar.setSelectedItem(-1).showBackNav();
      this.selectedItemIndex = -1;
    },

    setDisplayMode: function(mode){
      // if (mode === 'popup') {
      //   this.$el.addClass(mode);
      // } else {
      //   this.$el.removeClass(mode);
      // }
      this.windowMode = mode;
      return this;
    },

    setViews: function(views){
      var that = this;
      that.views = views;
      $.each(that.views, function(index, view){
        view.$el.css('display', 'none');
        that.children.push(view);
        that.$contentView.append(view.$el);
      });
      return this;
    },

    selectActiveView: function(i){
      var view = this.views[i];

      if ( !view ) return;
      if ( !view.rendered ) view.render();

      view.willAppear && view.willAppear();

      view.$el.css({
        'z-index': 1,
        'display': 'block'
      });

      var hideCss = {
        'display': 'none',
        'z-index': 0
      };

      if ( this.selectedItemIndex != undefined && this.selectedItemIndex !== -1 ) {
        var currentView = this.views[this.selectedItemIndex];
        if (currentView) {
          currentView.$el.css(hideCss);
        }
      }

      _.each(this.presentViews, function(v){
        v.remove();
      });
      this.presentViews = [];

      this.selectedItemIndex = i;

      // 记住当前 tab
      var currentUser = gegedaa.Users.getCurrentUser();
      if ( currentUser ) {
        UsersStatus.set(currentUser, 'mainTab', this.selectedItemIndex);
      }
      return this;
    },

    setNavigationBar: function(navBar){
      var that = this;

      if ( that.navBar ) {
        that.navBar.remove();
      }

      that.navBar = navBar;
      that.addChild(navBar);

      navBar.on('change', function(index){
        that.selectActiveView(index);
      }).on('refresh', function(index){
        var currentView = that.views[that.selectedItemIndex];
        if ( currentView && currentView.refresh ) {
          currentView.refresh();
        }
      }).on('back', function(){
        var pop = that.presentViews.pop();

        if ( that.presentViews.length == 0 ) {
          that.navBar.hideBackNav().setSelectedItem(that.lastSelectedItemIndex);
        } else {
          var v = that.presentViews[that.presentViews.length - 1];
          v.$el.css({
            'z-index': 1,
            'visibility': 'visible'
          });
        }

        pop.remove();
      });

      this._setDefaultTab();

      return that;
    },

    _setDefaultTab: function(){
      if ( this.navBar ) {
        var user = gegedaa.Users.getCurrentUser();
        this.navBar.setSelectedItem(UsersStatus.get(user, 'mainTab') || 0, true);
      }
    },

    // 打开一个网页
    openUrl: function(url, active) {
      if (!url) return;
      active = !!active;
      chrome.tabs.query({
        url: url
      }, function(tabs){
        if ( !tabs || !tabs.length ) {
          chrome.tabs.create({
            url: url,
            active: active
          });
        } else {
          var tab = tabs[0];
          chrome.tabs.update(tab.id, {
            url: url,
            active: active
          });
        }
      });
    },

    openSettingsPage: function(hash){
      hash = hash || '';
      var url = chrome.extension.getURL('settings.html');
      this.openUrl(url + hash, true);
    },

    openTab: function(mode){
      var url = chrome.extension.getURL('popup.html');
      if ( mode == 'tab' ) {
        this.openUrl(url + '?windowmode=tab', true);
      } else if ( mode == 'modal' ) {
        var basic = gegedaa.Settings.get('basic');
        var winW = basic.windowwidth,
            winH = 600,
            sw   = window.screen.width,
            sh   = window.screen.height;

        var left = Math.floor((sw - winW) / 2),
            top  = Math.floor((sh - winH) / 2);

        chrome.windows.create({
          url: url + '?windowmode=modal',
          width: winW,
          height: winH,
          top: top,
          left: left,
          focused: true,
          type: "popup"
        });
      }
    }
  });

  module.exports = new GGDApp();
});
