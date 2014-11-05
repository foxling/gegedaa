define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;
  var extension = require('../util/extension');

  var $              = require('$');
  var Backbone       = require('backbone');
  var _              = require('_');
  var utils          = require('../util/utils');

  var ViewController = require('../view-controller');
  var StatusWrapper  = require('./status-wrapper');
  var constance      = require('../util/constance');

  var Timeline = ViewController.extend({

    initialize: function GVTimeline(options){
      var that = this;
      ViewController.prototype.initialize.call(that, options);

      that.showsBookmark = false;
      that.collectionKey = null;
      that.autoSetCollection = true;
      that.showsNewsHandler = false;

      // 滚动到底部加载
      that.on('scroll_the_bottom', function(){
        if ( !that.needReset ) {
          that.load();
        }
      });

      extension.onMessage(function(message, sender, sendResponse) {
        if ( message && message.name == constance.message.NEW_STATUS_NOTICE ) {
          that.checkNews();
        }
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

    createStatusView: function(model){
      var statusView = new StatusWrapper({
        model: model
      });
      return statusView;
    },

    setCollection: function(c){

      if ( !c ) return;

      var that = this;

      if ( that.collection == c ) return that;

      // 原有的 collection 清理工作
      if ( that.collection ) {
        that.collection.off(null, null, that);
      }

      that.collection = c.on('loaded', function(models){

        var $els = $('<div>');
        _.each(models, function(model, i){
          var statusView = that.createStatusView(model);

          if ( i > 0 && that.showsBookmark && that.collection.lastMaxId == model.id ) {
            $els.append('<fieldset class="last-updated"><legend class="txt">' + utils.timeParse(that.collection.lastUpdatedTime) + '，看到这里</legend></fieldset>');
          }

          $els.append(statusView.$el);
        });

        if ( that.needReset ) {
          // console.info(that.model, that.unreadKey);
          gegedaa.Unread.reset(that.model, that.unreadKey);
          that.reset();
        }

        that.$statusesWrapper.append($els.children());
        that.$content.removeClass('loading');
        that.loadFavicon();
      }, that).on('updated', function(models){

        // 更新新内容，未读信息清零
        // console.info(that.model, that.unreadKey);
        bg.gegedaa.Unread.reset(that.model, that.unreadKey);

        var $els = $('<div>');
        _.each(models, function(model){
          var statusView = that.createStatusView(model);
          $els.append(statusView.$el);
        });


        if ( that.showsBookmark && models.length > 0 ) {
          $els.append('<fieldset class="last-updated"><legend class="txt">' + utils.timeParse(that.collection.lastUpdatedTime) + '，看到这里</legend></fieldset>');
          that.$statusesWrapper.find('.last-updated').remove();
        }
        that.$statusesWrapper.prepend($els.children());
        that.checkNews();
      }, that).on('add', function(model){
        var statusView = that.createStatusView(model);
        that.$statusesWrapper.prepend(statusView.$el);
      }, that);

      // 已渲染好的，重新渲染，否则等自己渲染
      if ( that.rendered ) {
        // 清空列表
        that.reset();
        that.render();
      }

      that.loadFavicon();
      return that;
    },

    loadFavicon: function(){
      // style="padding-left:20px;background-repeat:no-repeat;background-position:2px center;background-image:url(https://www.google.com/s2/favicons?domain=' + link + ')"
      var that = this;
      var urls = [];
      $('a.content-link[href^="http://t.cn"]', that.$statusesWrapper).each(function(i, a){
        var $a = $(a);
        if (!$a.data('parsed')) {
          urls.push('url_short='+$a.attr('href'));
        }
      });
      urls = _.union(urls);
      var step;
      while (urls.length > 0) {
        step = urls.splice(0, 20);
        $.get('https://api.weibo.com/2/short_url/clicks.json?source=3505891822&' + step.join('&'), function(result){
          if (result.urls) {
            _.each(result.urls, function(s){
              $('a.content-link[href="' + s.url_short + '"]', that.$statusesWrapper).css({
                'padding-left': '20px',
                'background-repeat': 'no-repeat',
                'background-position': '2px center',
                'background-image': 'url(https://www.google.com/s2/favicons?domain=' + s.url_long + ')'
              }).attr('title', s.url_long + ' [点击' + s.clicks + ']').data('parsed', 1);
            });
          }
        });
      }
    },

    checkNews: function(){
      if ( this.showsNewsHandler && this.$newsHandler ) {
        this.$newsHandler.removeClass('loading');
        var count = this.newsCount();
        if ( count > 0 ) {
          this.$newsHandler.text( (count >= 100 ? '100+' : count) + ' 条新微博').show();
        } else {
          this.$newsHandler.hide();
        }
      }

      return this;
    },

    load: function(reload){
      this.needReset = reload;
      this.$content.addClass('loading');
      if ( this.collection ) this.collection.load(reload);
      return this;
    },

    prev: function(){
      var count = this.newsCount();
      if ( count > 0 ) {
        this.$newsHandler && this.$newsHandler.addClass('loading');
        if ( count > 30 ) {
          this.load(true);
        } else {
          this.collection.prev();
        }
      }
    },

    renderStatuses: function(){
      var that = this;

      if ( that.collection ) {

        if ( that.collection.length > 0 ) {
          that.collection.each(function(model){
            var statusView = that.createStatusView(model);
            that.$statusesWrapper.append(statusView.$el);
          });
        } else {
          that.load(true);
        }

        that.checkNews();
      }

      return that;
    },

    emptyStatuses: function(){
      this.$statusesWrapper.empty();
      return this;
    },

    reset: function(){
      this.$newsHandler.hide().removeClass('loading');
      this.emptyStatuses();
      this.needReset = false;
    },

    newsCount: function(){
      var count = 0;
      if ( this.collection ) {
        var user = this.model;
        count = bg.gegedaa.Unread.get(user, this.unreadKey);
      }
      return count;
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

        // 新微博提示黄条
        that.$newsHandler = $('<div class="list-new-status" style="display:none">').on('click', function(){
          that.prev();
        }).appendTo(that.$content);

        // 页底的加载动画
        that.$loading = $('<div class="list-loader">').appendTo(that.$content);

        that.$view.append( that.$content );

        // 微博列表容器
        that.$statusesWrapper = $('<div class="statuses-wrapper clearfix">');
        that.$content.append( that.$statusesWrapper );
      }

      // 先 render 再处理后面的数据层
      ViewController.prototype.render.call(that);

      that.renderStatuses();

      if ( this.autoSetCollection && !this.collection && this.model ) {
        that.setUser(this.model);
      }

      return that;
    }

  });

  module.exports = Timeline;
});
