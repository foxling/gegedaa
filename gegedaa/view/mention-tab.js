define(function(require, exports, module) {

  var $                 = require('$');
  var _                 = require('_');
  var TabViewController = require('../tab-view-controller');
  var MentionNavBar     = require('../mention-nav-bar');
  var Mention           = require('./mention');
  var Comments          = require('./comments');
  var MentionComments   = require('./mention-comments');
  var CommentsByMe      = require('./comments-by-me');
  var Messages          = require('./messages');
  var Notification      = require('../notification');

  var MentionTab = TabViewController.extend({

    initialize: function GVMention(options){
      var that = this;
      TabViewController.prototype.initialize.call(that, options);

      Notification.on('switch_user', function(user){
        that.setUser(user);
      }, that);
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

        _.each(this.viewControllers, function(vc){
          if ( vc.setUser ) vc.setUser(user);
        });
      }
    },

    render: function(){
      if ( !this.rendered ) {
        var navBar = new MentionNavBar();
        this.setNavigationBar(navBar);
      }
      TabViewController.prototype.render.call(this);
      return this;
    },

    layout: function(){
      var vc = this.currentView();
      if ( !vc.heightAdjusted ) {
        var height = this.navBar.$el.outerHeight();
        vc.$view.css({
          top: height,
          height: '-webkit-calc(100% - ' + height + 'px)'
        });
        vc.heightAdjusted = true;
      }
    },

    selectActiveView: function(key){
      key += '';
      var vc = this.viewControllers[key];
      if ( !vc ) {
        switch (key) {
          case '0':
            vc = new Mention({model:this.model});
            break;
          case '1':
            vc = new MentionComments({model:this.model});
            break;
          case '2':
            vc = new Comments({model:this.model});
            break;
          case '3':
            vc = new CommentsByMe({model:this.model});
            break;
          case '4':
            vc = new Messages();
            break;
        }
        this.addSubViewController(key, vc);
      }

      TabViewController.prototype.selectActiveView.call(this, key);
      this.layout();
    }

  });

  module.exports = MentionTab;

});
