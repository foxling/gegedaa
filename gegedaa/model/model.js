// Model 基类
// 必定包含一个 client 属性，该 model 由哪个 client 获得
define(function(require, exports, module) {
  
  var Backbone = require('backbone');

  var Model = Backbone.Model.extend({
    constructor: function GMModel(attributes, options){
      options = options || {};
      this.client = options.client;
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    getClient: function(){
      return this.client;
    },

    getPlatformConfig: function(){
      return this.client.platformConfig;
    }
  });

  module.exports = Model;

});