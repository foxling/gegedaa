define(function(require, exports, module) {

  var Backbone         = require('backbone');
  var _                = require('_');
  var Home             = require('./home');
  var Comment          = require('../model/comment');

  var MentionComments = Home.extend({
    constructor: function GCMentionComments(models, options){
      Home.prototype.constructor.call(this, models, options);

      this.clientMethod = 'comments_mentions';
      this.model = Comment;
    }
  });

  module.exports = MentionComments;

});
