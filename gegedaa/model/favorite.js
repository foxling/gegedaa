define(function(require, exports, module) {

  var Model  = require('./model');
  var User   = require('./user');
  var utils  = require('../util/utils');
  var Status = require('./status');

  var Favorite = Model.extend({

    constructor: function GMFavorite(attributes, options){
      Model.prototype.constructor.apply(this, arguments);
    },

    parse: function(response){
      if ( response.id ) {
        response.id = response.status.id;
      }

      response['status'] = new Status(response['status'], {
        client: this.client,
        parse: true
      });

      return response;
    }

  });

  module.exports = Favorite;

});
