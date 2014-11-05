define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var _              = require('_');
  var Timeline       = require('./timeline');
  var CommentView    = require('./comment');

  var CommentsByMe = Timeline.extend({

    initialize: function GVCommentsByMe(options){

      var that = this;
      Timeline.prototype.initialize.call(that, options);

      that.collectionKey = 'CommentsByMe';
      that.$view.addClass('comments-by-me');
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

  module.exports = CommentsByMe;
});
