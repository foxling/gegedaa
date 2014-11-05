define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var _              = require('_');
  var Timeline       = require('./timeline');
  var StatusWrapper  = require('./status-wrapper');

  var Favorites = Timeline.extend({

    initialize: function GVFavorites(options){

      var that = this;
      that.unreadKey = 'nokey';

      Timeline.prototype.initialize.call(that, options);

      that.showsBookmark = false;
      that.collectionKey = 'Favorites';
    },

    createStatusView: function(model){
      var statusView = new StatusWrapper({
        model: model.get('status')
      });
      return statusView;
    }
  });

  module.exports = Favorites;
});
