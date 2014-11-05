define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var _              = require('_');
  var Timeline       = require('./timeline');
  var UsersCache     = require('../collection/users-cache');

  var Profile = Timeline.extend({

    initialize: function GVProfile(options){

      var that = this;
      that.unreadKey = 'nokey';

      Timeline.prototype.initialize.call(that, options);

      that.collectionKey = 'MyTimeline';
    }
  });

  module.exports = Profile;
});
