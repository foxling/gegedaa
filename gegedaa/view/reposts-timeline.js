define(function(require, exports, module) {

  var _            = require('_');
  var $            = require('$');
  var CommentForm  = require('./comment-form');

  var CommentsList = require('./comments-list');
  var RepostsTimelineCollection = require('../collection/reposts-timeline');

  var RepostsTimeline = CommentsList.extend({

    initialize: function GVRepostsTimeline(options){
      CommentsList.prototype.initialize.call(this, options);
      this.$el.addClass('rts');
      this.type = 'repost';
    },

    _configPostForm: function(){
      var that = this;
      this.postForm = new CommentForm({
        status: this.statusModel,
        type: 'repost'
      }).on('reposted', function(data){
        that.collection && that.collection.add([data], {parse:true});
      });
      this.$el.prepend(this.postForm.$el);
      this.postForm.$text.focus();
    },

    _configCollection: function(){
      if ( !this.collection ) {
        this.collection = new RepostsTimelineCollection(null, {
          client: this.statusModel.client,
          statusId: this.statusModel.id
        });
      }
      return this.collection;
    }
  });

  module.exports = RepostsTimeline;
});
