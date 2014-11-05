define(function(require, exports, module) {

  var ClientCollection = require('./client-collection');
  var Favorite         = require('../model/favorite');
  var _                = require('_');

  var Favorites = ClientCollection.extend({
    constructor: function GCFavorites(models, options){
      ClientCollection.prototype.constructor.call(this, models, options);

      this.clientMethod = 'favorites';
      this.model = Favorite;
      this.page = 0;
    },

    _getModelUniqId: function(model){
      return model.id;
    },

    apiParams: function(){
      return null;
    },

    // reload: 刷新，清除数据重新加载
    load: function(reload){
      var that = this;

      if ( that.loading ) return;

      if ( reload ) {
        that.reset();
        that.page = 0;
      }

      var params = {
        page: that.page += 1
      };

      _.extend(params, that.apiParams());

      if ( that.client[that.clientMethod] ) {
        that.loading = 1;
        that.client[that.clientMethod](params, function(data){

          var models = [];
          _.each(data, function(model){
            if ( !that.get( that._getModelUniqId(model) ) ) {
              var model = that.push(model, {parse: true, silent: true});
              models.push(model);
            }
          });

          that.trigger('loaded', models);
          that.loading = 0;
        }, function(err){
          that.loading = 0;
          console.info(err);
        });
      }
      return that;
    }
  });

  module.exports = Favorites;

});
