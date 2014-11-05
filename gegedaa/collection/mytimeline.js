define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var _                = require('_');
  var Home             = require('./home');

  var MyTimeline = Home.extend({
    constructor: function GCMyTimeline(models, options){
      Home.prototype.constructor.call(this, models, options);

      options = options || {};
      this.clientMethod = 'user_timeline';
      this.uid = options.uid;
    },

    apiParams: function(){
      if ( this.uid ) {
        return {
          uid: this.uid
        };
      }

      return null;
    }
  });

  module.exports = MyTimeline;

});
