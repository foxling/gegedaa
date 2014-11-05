define(function(require, exports, module) {

  var Backbone = require('backbone');

  var ClientCollection = Backbone.Collection.extend({

    constructor: function GClientCollection(models, options){

      options = options || {};

      if ( options.client ) {
        this.setClient(options.client);
      } else {
        throw new Error("ClientCollection need a client.");
      }

      this.options = options;

      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    // override
    _prepareModel: function(attrs, options) {
      options || (options = {});
      if ( !options.client ) {
        options.client = this.client;
      }
      return Backbone.Collection.prototype._prepareModel.apply(this, arguments);
    },

    setClient: function(client){
      this.client = client;
    },

    getClient: function(){
      return this.client;
    },

    minId: function(){
      if ( !this.length ) return 0;
      return this.last().get('idstr');
    },

    maxId: function(){
      if ( !this.length ) return 0;
      return this.first().get('idstr');
    }

  });

  module.exports = ClientCollection;

});
