define(function(require, exports, module) {

  var $        = require('$');
  var Backbone = require('backbone');
  var View     = require('./view');
  var _        = require('_');

  var TabViewController = View.extend({
    className: 'card',

    initialize: function GVTabViewController(options){
      View.prototype.initialize.call(this, options);

      this.viewControllers = {};
    },

    refresh: function(){
      var currentVC = this.currentView();
      if ( currentVC && currentVC.refresh ) {
        currentVC.refresh();
      }
    },

    remove: function(){
      _.each(this.viewControllers, function(vc){
        vc.remove();
      });

      if ( this.navBar ) {
        this.navBar.remove();
      }
      View.prototype.remove.call(this);
    },

    addSubViewController: function(key, vc){
      key += '';
      if ( !vc ) return;
      vc.$view.css({
        'z-index': 0,
        'display': 'none'
      });
      this.$el.append(vc.$view);
      this.viewControllers[key] = vc;
    },

    currentView: function(){
      return this.viewControllers[this.selectedKey];
    },

    selectActiveView: function(key){
      key += '';
      if ( this.selectedKey !== key ) {
        var vc = this.viewControllers[key];

        if ( !vc ) return;

        if ( !vc.rendered ) vc.render();

        vc.willAppear && vc.willAppear();

        vc.$view.css({
          'z-index': 1,
          'display': 'block'
        });

        if ( this.selectedKey != undefined ) {
          var currentVC = this.viewControllers[this.selectedKey];
          if (currentVC) {
            currentVC.$view.css({
              'z-index': 0,
              'display': 'none'
            });
          }
        }

        this.selectedKey = key;
      }
      return this;
    },

    setNavigationBar: function(navBar){
      var that = this;

      if ( that.navBar ) {
        that.navBar.remove();
      }

      that.navBar = navBar;
      that.children.push(navBar);
      that.$el.append(navBar.$el);

      navBar.on('change', function(index){
        that.selectActiveView(index);
      }).on('refresh', function(index){
        var currentView = that.viewControllers[that.selectedKey];
        if ( currentView && currentView.refresh ) {
          currentView.refresh();
        }
      });
      navBar.setSelectedItem(0);

      return that;
    }
  });

  module.exports = TabViewController;
});
