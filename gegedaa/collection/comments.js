define(function(require, exports, module) {

  var Backbone         = require('backbone');
  var _                = require('_');
  var Home             = require('./home');
  var Comment          = require('../model/comment');

  var Comments = Home.extend({
    constructor: function GCComments(models, options){
      Home.prototype.constructor.call(this, models, options);

      this.clientMethod = 'comments_to_me';
      this.model = Comment;
    }
  });

  module.exports = Comments;

});
