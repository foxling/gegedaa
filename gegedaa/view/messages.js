define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var Backbone       = require('backbone');

  var ViewController = require('../view-controller');

  var Messages = ViewController.extend({

    initialize: function GVTimeline(options){
      var that = this;
      ViewController.prototype.initialize.call(that, options);

      var $tip = $('<div class="message-tip">新浪不开放私信接口，请 <a href="http://weibo.com/messages" target="_blank">登录网页</a> 查看私信。</div>');
      that.$view.append($tip);
    }

  });

  module.exports = Messages;
});
