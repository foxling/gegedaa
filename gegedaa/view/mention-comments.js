define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var _              = require('_');
  var Timeline       = require('./timeline');
  var CommentView    = require('./comment');

  var MentionComments = Timeline.extend({

    initialize: function GVMentionComments(options){

      var that = this;
      that.unreadKey = 'mention_cmt';
      Timeline.prototype.initialize.call(that, options);

      that.collectionKey = 'MentionComments';
    },

    createStatusView: function(model){
      var commentView = new CommentView({
        model: model
      });
      return commentView;
    },

    willAppear: function(){
      this.prev();
    }
  });

  module.exports = MentionComments;
});
