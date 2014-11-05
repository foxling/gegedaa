define(function(require, exports, module) {

  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;
  var UsersList = require('./users-list');

  var Friends = UsersList.extend({

    initialize: function GVFollowers(options){
      var that = this;
      that.unreadKey = 'nokey';
      UsersList.prototype.initialize.call(that, options);

      that.collectionKey = 'Friends';
    }
  });

  module.exports = Friends;
});
