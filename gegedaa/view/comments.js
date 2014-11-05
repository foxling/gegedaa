define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var _              = require('_');
  var Timeline       = require('./timeline');
  var CommentView    = require('./comment');

  var Comments = Timeline.extend({

    initialize: function GVComments(options){

      var that = this;
      that.unreadKey = 'cmt';
      Timeline.prototype.initialize.call(that, options);

      that.collectionKey = 'Comments';
      that.$view.addClass('comments-timeline');
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

  module.exports = Comments;
});
