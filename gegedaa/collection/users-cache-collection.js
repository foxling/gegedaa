define(function(require, exports, module) {

  var _                = require('_');
  var Friends          = require('./friends');

  var UsersCache = Friends.extend({
    constructor: function GCUsersCache(models, options){
      Friends.prototype.constructor.call(this, models, options);
    },

    fetchAll: function(){

    }
  });

  module.exports = UsersCache;
});
