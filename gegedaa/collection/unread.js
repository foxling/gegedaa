define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var Clients  = bg.gegedaa.Clients;
  var Users    = bg.gegedaa.Users;
  var Backbone = require('backbone');
  var _        = require('_');


  var data = {};
  var checkTimer, checkCount = 0;
  var checkQueue = [];

  function dispatch(now){
    if ( checkQueue.length === 0 || now ) {
      Unread.trigger('countupdated');
    }
  };

  var Unread = {

    start: function(){
      var that = this;
      clearInterval(checkTimer);
      checkTimer = setInterval(function(){
        that.update();
      }, 30000);
      that.update();
      return that;
    },

    get: function(user, key){
      if ( !user || !key ) return 0;
      var userCount = data[user.id];
      if ( userCount && userCount[key] ) {
        return userCount[key];
      }
      return 0;
    },

    set: function(user, key, val){
      var userCount = data[user.id];
      if ( !userCount ){
        userCount = data[user.id] = {};
      }
      userCount[key] = val;
    },

    reset: function(user, key){
      if ( !key ) return;
      this.set(user, key, 0);
      dispatch(1);

      if ( key == 'status' || key == 'nokey' ) return;

      var client = Clients.getClient(user),
          params = {
            type: key
          };
      client.set_count(params);
    },

    getAll: function(){
      return data;
    },

    ///////////////////////////////////////
    // status         int 新微博未读数
    // follower       int 新粉丝数
    // cmt            int 新评论数
    // dm             int 新私信数
    // mention_status int 新提及我的微博数
    // mention_cmt    int 新提及我的评论数
    // group          int 微群消息未读数
    // private_group  int 私有微群消息未读数
    // notice         int 新通知未读数
    // invite         int 新邀请未读数
    // badge          int 新勋章数
    // photo          int 相册消息未读数

    _update: function(user){

      var that = this;

      if ( !user ) return;

      var currentCollection = bg.gegedaa.Collections.get(user, 'Home');
      var client            = Clients.getClient(user);

      var maxId = currentCollection.maxId();

      if ( maxId > 0 ) {
        var statusQueueId = user.id + 'status';
        checkQueue.push(statusQueueId);

        client.home({
          count: 100,
          trim_user: 1,
          since_id: maxId - 0 + 1
        }, function(data){
          if ( data && data.length > 0 ) {
            that.set(user, 'status', data.length);
          } else {
            that.set(user, 'status', 0);
          }

          checkQueue = _.without(checkQueue, statusQueueId);
          dispatch();
        }, function(err){
          checkQueue = _.without(checkQueue, statusQueueId);
          dispatch();
        });
      } else {
        that.set(user, 'status', 0);
      }

      var queueId = user.id + 'api';
      client.unread({
        uid: user.get('uid')
      }, function(unread){
        that.set(user, 'mention_status', unread.mention_status);
        that.set(user, 'cmt',            unread.cmt);
        that.set(user, 'mention_cmt',    unread.mention_cmt);
        that.set(user, 'dm',             unread.dm);
        that.set(user, 'follower',       unread.follower);
        checkQueue = _.without(checkQueue, queueId);
        dispatch();
      }, function(){
        checkQueue = _.without(checkQueue, queueId);
        dispatch();
      });

      checkCount ++;

    },

    update: function(){
      var that = this;
      var users = Users.getUsers();

      if ( !users || !users.length ) return;

      _.each(users, function(user, i){
        checkQueue.push(user.id + 'api');
        setTimeout(function(){
          that._update(user);
        }, 1500 * i);
      });

    }
  };

  _.extend(Unread, Backbone.Events);

  module.exports = Unread;

});
