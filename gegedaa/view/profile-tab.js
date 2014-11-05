define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var _              = require('_');
  var TabViewController = require('../tab-view-controller');
  var ProfileHeader  = require('./profile-header');
  var UsersCache     = require('../collection/users-cache');
  var Profile        = require('./profile');
  var Followers      = require('./followers');
  var Friends        = require('./friends');
  var Favorites      = require('./favorites');
  var Notification   = require('../notification');

  var ProfileTab = TabViewController.extend({

    initialize: function GVProfileTab(options){

      var that = this;
      TabViewController.prototype.initialize.call(that, options);

      options = options || {};

      that.userScreenName = options.userScreenName;

      that.$el.addClass('user-home');

      var currentUser = gegedaa.Users.getCurrentUser();
      if ( that.model && currentUser.get('idstr') == that.model.get('idstr') ) {
        Notification.on('switch_user', function(user){
          that.setUser(user);
        }, that);
      }

      that.navBarFixedPosition = -182;
    },

    willAppear: function(){
      var vc = this.currentView();
      if ( vc && vc.willAppear ) {
        vc.willAppear();
      }
    },

    remove: function(){
      Notification.off(null, null, this);
      TabViewController.prototype.remove.call(this);
    },

    setUser: function(user){
      if ( user ) {
        this.model = user;

        this.navBar && this.navBar.setUser(user);

        _.each(this.viewControllers, function(vc){
          if ( vc.setUser ) vc.setUser(user);
        });
      }
    },

    addSubViewController: function(key, vc){
      var that = this;
      if ( vc && vc.$view ) {
        vc.$view.on('mousewheel', function(e){
          var delta = e.originalEvent.wheelDelta;
          that.adjustHeaderPosition(e, delta);
        });
      }

      TabViewController.prototype.addSubViewController.call(this, key, vc);
    },

    adjustHeaderPosition: function(e, delta){
      var that = this;
      var barTop = parseInt(that.navBar.$el.css('top'));
      var vc = that.currentView();
      if ( delta < 0 ) { // up
        if ( barTop > that.navBarFixedPosition ) {
          e && e.preventDefault();
          barTop += delta;
          that.navBar.$el.css('top', Math.max(barTop, that.navBarFixedPosition));
        }
      } else {
        if ( vc.$view.scrollTop() == 0 ) {
          barTop += delta;
          that.navBar.$el.css('top', Math.min(barTop, 0));
        }
      }

      if ( barTop != that.navBarFixedPosition ) {
        that.layout(vc);
      }
    },

    layout: function(vc){
      var height = this.navBar.$el.outerHeight();
      var top    = height + parseInt(this.navBar.$el.css('top'), 10);
      vc.$view.css({
        top: top,
        height: '-webkit-calc(100% - ' + top + 'px)'
      });
    },

    render: function(){
      var that = this;
      if ( !that.rendered ) {
        var user = this.model;

        function init(u){
          that.setUser(u);
          var navBar = new ProfileHeader({
            model: u
          });
          navBar.$el.on('mousewheel', function(e){
            var delta = e.originalEvent.wheelDelta;
            var vc = that.currentView();
            if ( vc ) {
              var top = vc.$view.scrollTop();
              vc.$view.scrollTop(top-delta);
            }
            that.adjustHeaderPosition(null, delta);
          });
          that.setNavigationBar(navBar);
        }

        if ( user ) {
          init(user);
        } else {
          UsersCache.setUser(gegedaa.Users.getCurrentUser());
          UsersCache.findFromScreenName(that.userScreenName, init);
        }
      }

      TabViewController.prototype.render.call(that);
      return that;
    },

    selectActiveView: function(key){
      key += '';
      var vc = this.viewControllers[key];
      if ( !vc ) {
        switch (key) {
          case '0':
            vc = new Profile({model:this.model});
            break;
          case '1':
            vc = new Friends({model:this.model});
            break;
          case '2':
            vc = new Followers({model:this.model});
            break;
          case '3':
            vc = new Favorites({model:this.model});
            break;
        }
        this.addSubViewController(key, vc);
      }

      // var previousView = this.currentView();

      TabViewController.prototype.selectActiveView.call(this, key);

      var currentVC = this.currentView();
      this.layout(currentVC);
    }
  });

  module.exports = ProfileTab;
});
