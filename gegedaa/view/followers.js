define(function(require, exports, module) {

  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;
  var UsersList = require('./users-list');

  var Followers = UsersList.extend({

    initialize: function GVFollowers(options){
      var that = this;
      that.unreadKey = 'follower';
      UsersList.prototype.initialize.call(that, options);

      that.collectionKey = 'Followers';
    }
  });

  module.exports = Followers;
});
