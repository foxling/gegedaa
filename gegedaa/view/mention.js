define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var _              = require('_');
  var Timeline       = require('./timeline');

  var Mention = Timeline.extend({

    initialize: function GVMention(options){

      var that = this;
      that.unreadKey = 'mention_status';
      Timeline.prototype.initialize.call(that, options);

      that.collectionKey = 'Mention';
    },

    willAppear: function(){
      this.prev();
    }
  });

  module.exports = Mention;
});
