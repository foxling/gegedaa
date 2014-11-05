define(function(require, exports, module) {

  var Backbone         = require('backbone');
  var ClientCollection = require('./client-collection');
  var Status           = require('../model/status');
  var _                = require('_');

  var Home = ClientCollection.extend({
    constructor: function GCHome(models, options){
      ClientCollection.prototype.constructor.call(this, models, options);

      this.clientMethod = 'home';
      this.model = Status;
    },

    // 排序比较
    comparator: function(chapter) {
      return - chapter.get('id');
    },

    _getModelUniqId: function(model){
      return model.id;
    },

    apiParams: function(){
      return null;
    },

    prev: function(){
      var that = this;

      if ( that.loading ) return;

      var params = {
        since_id: that.maxId() + 1, // 新浪API是包含该ID
        count: 30
      };

      _.extend(params, that.apiParams());

      if ( that.client[that.clientMethod] ) {
        that.loading = 1;
        that.client[that.clientMethod](params, function(data){

          var models = [];
          var m;
          while (data.length) {
            m = data.pop();
            if ( !that.get( that._getModelUniqId(m) ) ) {
              var model = that.unshift(m, {parse: true, silent: true});
              models.unshift(model);
            }
          }

          that.trigger('updated', models);
          that.loading = 0;

          that.lastMaxId = that.maxId();
          that.lastUpdatedTime = new Date();
        }, function(err){
          that.loading = 0;
          console.info(err);
        });
      }
      return that;
    },

    // reload: 刷新，清除数据重新加载
    load: function(reload){
      var that = this;

      if ( that.loading ) return;

      if ( reload ) {
        that.reset();
      }

      var params = {
        max_id: that.minId(),
        count: 30
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

          that.lastMaxId = that.maxId();
          that.lastUpdatedTime = new Date();
        }, function(err){
          that.loading = 0;
          console.info(err);
        });
      }
      return that;
    }
  });

  module.exports = Home;

});
