define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var Backbone       = require('backbone');
  var _              = require('_');
  var utils          = require('../util/utils');

  var ViewController = require('../view-controller');
  var UserItem       = require('./user-item');
  var constance      = require('../util/constance');

  var UsersList = ViewController.extend({

    initialize: function GVTimeline(options){

      var that = this;
      ViewController.prototype.initialize.call(that, options);

      // 滚动到底部加载
      that.on('scroll_the_bottom', function(){
        that.load();
      });
    },

    setUser: function(user){
      if ( this.collectionKey && user ) {
        this.model = user;

        if ( this.rendered ) {
          var collection, me;
          if ( me = gegedaa.Users.findWhere({idstr: user.get('idstr')}) ) {
            collection = gegedaa.Collections.get(me, this.collectionKey);
          } else {
            collection = gegedaa.Collections.createCollection(this.collectionKey, {
              client: gegedaa.Clients.getClient(gegedaa.Users.getCurrentUser()),
              uid: user.get('idstr')
            });
          }

          this.setCollection(collection);
        }
      }
    },

    refresh: function(){
      this.reset();
      this.load(true);
    },

    remove: function(){
      if ( this.collection ) {
        this.collection.off(null, null, this);
      }
      ViewController.prototype.remove.call(this);
    },

    setCollection: function(c){

      var that = this;

      if ( that.collection == c ) return that;

      // 原有的 collection 清理工作
      if ( that.collection ) {
        that.collection.off(null, null, that);
      }

      that.collection = c.on('loaded', function(models){
        var $els = $('<div>');
        _.each(models, function(model){
          var item = new UserItem({
            model: model
          });

          $els.append(item.$el);
        });

        if ( that.needReset ) {
          that.reset();
        }

        that.$usersWrapper.append($els.children());
        that.$content.removeClass('loading');
      }, that);

      // 已渲染好的，重新渲染，否则等自己渲染
      if ( that.rendered ) {
        // 清空列表
        that.reset();
        that.render();
      }

      return that;
    },

    load: function(reload){
      this.needReset = reload;
      this.$content.addClass('loading');
      if ( this.collection ) this.collection.load(reload);

      if (reload) {
        gegedaa.Unread.reset(this.collection.client.user, this.unreadKey);
      }

      return this;
    },

    willAppear: function(){
      if ( this.model && this.unreadKey && gegedaa.Unread.get(this.model, this.unreadKey) > 0 ) {
        this.load(true);
      }
    },

    renderList: function(){
      var that = this;

      if ( that.collection ) {

        if ( that.collection.length > 0 ) {
          that.collection.each(function(model){
            var item = new UserItem({
              model: model
            });
            that.$usersWrapper.append(item.$el);
          });
        } else {
          that.collection.load();
        }
      }

      return that;
    },

    emptyStatuses: function(){
      this.$usersWrapper.empty();
      return this;
    },

    reset: function(){
      this.emptyStatuses();
      this.needReset = false;
    },

    render: function(){

      var that = this;

      if ( !that.rendered ) {

        that.$content = $('<div class="content-wrapper">');

        // 滚动事件
        that.$view.on('scroll', _.throttle(function(){
          var elHeight      = that.$view.height(),
              contentHeight = that.$content.height(),
              top           = that.$view.scrollTop();
          if ( contentHeight - top - elHeight <= 10 ) {
              that.trigger('scroll_the_bottom');
          }
        }, 200));

        // 页底的加载动画
        that.$loading = $('<div class="list-loader">').appendTo(that.$content);

        that.$view.append( that.$content );

        // 列表容器
        that.$usersWrapper = $('<div class="users-list clearfix">');
        that.$content.append( that.$usersWrapper );
      }

      ViewController.prototype.render.call(that);

      if ( !that.collection && this.model ) {
        that.setUser(this.model);
      }

      that.renderList();

      return that;
    }

  });

  module.exports = UsersList;
});
