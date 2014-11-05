define(function(require, exports, module) {
  var bg           = chrome.extension.getBackgroundPage();
  var gegedaa      = bg.gegedaa;
  var $            = require('$');
  var Backbone     = require('backbone');
  var View         = require('./view');
  var Notification = require('./notification');

  require('./util/jquery-mousewheel');

  var ViewController = View.extend({
    className: 'card',
    initialize: function GViewController(options){
      var that = this;
      View.prototype.initialize.call(this, options);

      that.$view = $('<div class="card-content">').appendTo(that.$el);
      var basicSettings = gegedaa.Settings.get('basic');
      if ( basicSettings && basicSettings.smoothscroll ) {
        that.$view.on('mousewheel', function(e, detal){
          e.preventDefault();

          detal = detal || 1;
          var scrollTop = that.$view.scrollTop();
          that._scrollDestination = Math.ceil(scrollTop + ( -detal * 120 )); // 100 为每滚轮一格的距离
          if ( that._scrollDestination < 0 ) that._scrollDestination = 0;
          that._startAni();
        });
      }
    },

    _startAni: function(){

      var that = this;

      if ( that._scrolling ) return;
      that._scrolling = true;

      // 帧率, 1000 / 60 = 16, 数字不能小于16
      var stepTime = 16, lastTime = 0;

      function animate(time){

        // bg.console.info(time);

        // t：current time（当前时间）
        // b：beginning value（初始值）
        // c：change in value（变化量）
        // d：duration（持续时间）

        var frameTime = time - lastTime;

        if ( frameTime >= stepTime ) {

          var top = that.$view.scrollTop();
          var diff = that._scrollDestination - top;

          var step = diff * .15; // 滚动系数
          // bg.console.info(step);
          if ( Math.abs(step) <= 1 ) {

            // that.$scroller.scrollTop( that._scrollDestination );
            webkitCancelRequestAnimationFrame( that._reqId );
            that._scrolling = false;
            return;
          }

          lastTime = time;
          that.$view.scrollTop( top + step );
        }

        return webkitRequestAnimationFrame(animate);
      }

      that._reqId = webkitRequestAnimationFrame(animate);
    },

    layout: function(){

    },

    remove: function(){
      Notification.off(null, null, this);
      View.prototype.remove.call(this);
    },

    render: function(){
      var that = this;
      if ( !that.rendered ) {
        Notification.on('scroll_to_top', function(){
          that.$view.animate({
            'scrollTop': 0
          }, 300);
        }, that);
      }

      View.prototype.render.call(that);
    }
  });

  module.exports = ViewController;
});
