define(function(require, exports, module) {

  var _                = require('_');
  var Friendships      = require('./friendships');

  var Friends = Friendships.extend({
    constructor: function GCFriends(models, options){
      Friendships.prototype.constructor.call(this, models, options);

      this.clientMethod = 'friends';
    }
  });

  module.exports = Friends;

});
