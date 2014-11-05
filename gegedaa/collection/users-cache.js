define(function(require, exports, module) {

  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;

  var ClientCollection = require('./client-collection');
  var User             = require('../model/user');


  var UsersCache = ClientCollection.extend({

    model: User,

    constructor: function GCUsersCache(models, options){
      ClientCollection.prototype.constructor.apply(this, arguments);
    },

    findFromUid: function(uid, callback){
      var user = this.find(function(user){
        return user.id == uid;
      });

      console.info(user);

      if ( user ) {
        callback(user);
      } else {
        this.fetchFromUid(uid, callback);
      }
    },

    fetchFromUid: function(uid, callback){
      var that = this;
      that.client.user_show({
        uid: uid
      }, function(data){
        var user = that.addUser(data);
        callback(user);
      });
    },

    findFromScreenName: function(name, callback){
      var user = this.find(function(user){
        return user.get('screen_name') == name;
      });

      if ( user ) {
        callback(user);
      } else {
        this.fetchFromScreenName(name, callback);
      }
    },

    fetchFromScreenName: function(name, callback){
      console.info('fetchFromScreenName', name);
      var that = this;
      that.client.user_show({
        screen_name: name
      }, function(data){
        var user = that.addUser(data);
        callback(user);
      }, function(err){
        console.info(err);
      });
    },

    setUser: function(user){
      if ( user ) {
        var client = gegedaa.Clients.getClient(user);
        this.client = client;
      }
    },

    addUser: function(model){
      var user = this.get(model.idstr);
      if ( !user ) {
        user = this.push(model, {parse: true});
      }
      return user;
    },

    search: function(name){
      return this.filter(function(user){
        if ( !name ) return false;
        var key = name.toLowerCase();
        if ( user.get('screen_name').toLowerCase().indexOf(key) > -1 ) return true;
        if ( user.get('name').toLowerCase().indexOf(key) > -1 ) return true;
        if ( user.get('remark') && user.get('remark').toLowerCase().indexOf(key) > -1 ) return true;
        return false;
      });
    }

  });

  module.exports = new UsersCache(null, {
    client: {}
  });

});
