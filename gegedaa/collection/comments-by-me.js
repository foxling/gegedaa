define(function(require, exports, module) {

  var Backbone         = require('backbone');
  var _                = require('_');
  var Home             = require('./home');
  var Comment          = require('../model/comment');

  var CommentsByMe = Home.extend({
    constructor: function GCCommentsByMe(models, options){
      Home.prototype.constructor.call(this, models, options);

      this.clientMethod = 'comments_by_me';
      this.model = Comment;
    }
  });

  module.exports = CommentsByMe;

});
