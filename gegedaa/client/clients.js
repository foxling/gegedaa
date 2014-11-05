define(function(require, exports, module) {

  var Client = require('./client');
  var Provider  = require('../provider');
  var OAuth2    = require('../oauth2/oauth2');
  var _ = require('_');

  var clients = {};

  var Clients = {

    getClient: function(user){

      var id       = user.get('id'),
          provider = user.get('platform');

      if ( !clients[id] ) {
        var options = _.extend({}, Provider.get(provider).authOptions, user.get('token'));

        var aOAuth2 = new OAuth2(options);
        var client  = new Client(aOAuth2, Provider.get(provider), user);
        clients[id] = client;
      }

      return clients[id];
    },

    removeClient: function(user){
      var id = user.get('id');
      if ( clients[id] ) {
        clients[id] = null;
      }
    }
  };

  module.exports = Clients;

});
