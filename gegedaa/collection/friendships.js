define(function(require, exports, module) {

  var Backbone         = require('backbone');
  var ClientCollection = require('./client-collection');
  var User             = require('../model/user');
  var _                = require('_');

  var FriendShips = ClientCollection.extend({
    constructor: function GCFriendShips(models, options){
      ClientCollection.prototype.constructor.call(this, models, options);

      options = options || {};

      this.clientMethod = 'followers';
      this.model = User;
      this.nextCursor = 0;
      this.uid = options.uid || this.client.user.get('idstr');

      if ( !this.uid ) {
        throw 'no user id';
      }
    },

    _getModelUniqId: function(model){
      return model.idstr;
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
        that.nextCursor = 0;
      }

      var params = {
        count: 50,
        uid: that.uid,
        cursor: that.nextCursor
      };

      _.extend(params, that.apiParams());

      if ( that.client[that.clientMethod] ) {
        that.loading = 1;
        that.client[that.clientMethod](params, function(data, next_cursor){
          that.nextCursor = next_cursor;

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

  module.exports = FriendShips;

});
