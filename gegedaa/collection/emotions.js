define(function(require, exports, module) {
  var bg               = chrome.extension.getBackgroundPage();
  var Backbone         = require('backbone');
  var Emotion          = require('../model/emotion');
  var _                = require('_');
  var $                = require('$');

  var Emotions = Backbone.Collection.extend({
    constructor: function GCEmotions(models, options){
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.clientMethod = 'emotions';
      this.model = Emotion;

      try {
        var cache = bg.localStorage['Emotions'];
        this.addModels( JSON.parse(cache) );
      } catch(e) {}

      if ( this.length == 0 ) {
        this.fetch();
      }
    },

    _getModelUniqId: function(model){
      return model.phrase;
    },

    addModels: function(data){
      var models = [], that = this;
      _.each(data, function(model){
        if ( !that.get( that._getModelUniqId(model) ) ) {
          var model = that.push(model, {silent: true});
          models.push(model);
        }
      });
      bg.localStorage['Emotions'] = JSON.stringify( this.toJSON() );
    },

    fetch: function(){
      var that = this;
      if ( that.loading ) return;
      that.loading = true;
      $.get('https://api.weibo.com/2/emotions.json?source=3505891822', function(data){
        that.addModels(data);
        that.loading = false;
      });
      return that;
    }
  });

  module.exports = new Emotions;

});
