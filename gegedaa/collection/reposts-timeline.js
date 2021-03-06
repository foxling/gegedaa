define(function(require, exports, module) {

  var Backbone         = require('backbone');
  var ClientCollection = require('./client-collection');
  var Status           = require('../model/status');
  var _                = require('_');

  var RepostsTimeline = ClientCollection.extend({
    constructor: function GCRepostsTimeline(models, options){
      ClientCollection.prototype.constructor.call(this, models, options);

      this.clientMethod = 'repost_timeline';
      this.model = Status;

      if ( !options || !options.statusId ) {
        throw 'RepostsTimeline need status id.';
      } else {
        this.statusId = options.statusId;
      }
    },

    // 排序比较
    comparator: function(chapter) {
      return - chapter.get('id');
    },

    _getModelUniqId: function(model){
      return model.id;
    },

    // reload: 刷新，清除数据重新加载
    load: function(reload){
      var that = this;

      if ( that.loading ) return;

      if ( reload ) {
        that.reset();
      }

      var params = {
        id: that.statusId,
        max_id: that.minId(),
        count: 15
      };

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

  module.exports = RepostsTimeline;

});
