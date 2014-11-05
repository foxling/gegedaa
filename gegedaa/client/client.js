define(function(require, exports, module) {

  var $ = require('$');

  function Client(oauth2, provider, user){
    this.oauth2         = oauth2;
    this.apis           = provider.apis;
    this.parser         = provider.clientParser;
    this.user           = user;
  }

  Client.prototype = {

    isAccessTokenExpired: function(){
      return this.oauth2.isAccessTokenExpired();
    },

    post: function(url, data, callback, onError){
      this.request(url, 'POST', data, callback, onError);
    },

    get: function(url, data, callback, onError){
      this.request(url, 'GET', data, callback, onError);
    },

    request: function(url, method, data, callback, onError, multipart){
      var that = this;

      if ( navigator.onLine === false ) {
        onError && onError.call(that, that.parser.error({
          "request": url,
          "error_code": "-1",
          "error": "无网络连接"
        }));
        return;
      }

      if ( !this.oauth2 || !this.oauth2.accessToken || this.isAccessTokenExpired() ) {
        onError && onError.call(that, that.parser.error({
          "request": url,
          "error_code": "21315",
          "error": "授权已过期"
        }));
        return;
      }

      var ajaxParams = {
        url: url,
        timeout: multipart ? 600000 : 25000, // 默认15秒，上传照片10分钟
        dataType: 'json',
        type: method,
        headers: {Authorization: 'OAuth2 ' + this.oauth2.accessToken},
        data: data,
        processData: !multipart,
        success: function(json){
          if ( !json || json.error ) {
            onError && onError.call(that, that.parser.error(json || false) );
          } else {
            callback && callback.call(that, json);
          }
        },
        error: function(jqXHR, textStatus, errorThrown){
          // bg.console.info(jqXHR, textStatus, errorThrown);
          var errorData;
          try{
            errorData = JSON.parse(jqXHR.responseText);
          }catch(e){}

          onError && onError.call(that, that.parser.error(errorData || false) );
        },
        complete: function(){}
      };

      if ( method.toLowerCase() === 'post' ) {
        if ( multipart ) ajaxParams.contentType = false;
        else ajaxParams.contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
      }

      $.ajax(ajaxParams);

    },

    unread: function(data, callback, onError){
      if ( !data || !data.uid ) return;
      this.get(this.apis.unread, data, callback, onError);
    },

    set_count: function(data, callback, onError){
      this.post(this.apis.setcount, data, callback, onError);
    },

    user_show: function(data, callback, onError){
      this.get(this.apis.url('user_show'), data, callback, onError);
    },

    // ----------------------------------------------
    // timeline
    // ----------------------------------------------

    home: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('home'), data, function(result){
        callback(that.parser.statuses(result.statuses))
      }, onError);
    },

    bilateral_timeline: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('bilateral_timeline'), data, function(result){
        callback(that.parser.statuses(result.statuses))
      }, onError);
    },

    mentions: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('mentions'), data, function(result){
        callback(that.parser.statuses(result.statuses))
      }, onError);
    },

    comments_mentions: function(data, callback, onError){
      var that = this;
      that.get(that.apis.url('comments_mentions'), data, function(result){
        callback(that.parser.comments(result.comments))
      }, onError);
    },

    comments_to_me: function(data, callback, onError){
      var that = this;
      that.get(that.apis.url('comments_to_me'), data, function(result){
        callback(that.parser.comments(result.comments))
      }, onError);
    },

    comments_by_me: function(data, callback, onError){
      var that = this;
      that.get(that.apis.url('comments_by_me'), data, function(result){
        callback(that.parser.comments(result.comments))
      }, onError);
    },

    repost_timeline: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('repost_timeline'), data, function(result){
        callback(that.parser.statuses(result.reposts))
      }, onError);
    },

    comments_show: function(data, callback, onError){
      // {id, count}
      this.get(this.apis.url('comments_show'), data, function(result){ callback(result.comments) }, onError);
    },

    favorites: function(data, callback, onError){
      var that = this;
      that.get(that.apis.url('favorites'), data, function(result){
        callback(that.parser.favorites(result.favorites));
      }, onError);
    },

    user_timeline: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('user_timeline'), data, function(result){
        callback(that.parser.statuses(result.statuses))
      }, onError);
    },

    groups: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('groups'), data, function(result){
        callback(result.lists)
      }, onError);
    },

    groups_timeline: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('groups_timeline'), data, function(result){
        callback(that.parser.statuses(result.statuses))
      }, onError);
    },

    // ----------------------------------------------
    // update
    // ----------------------------------------------

    update: function(data, callback, onError){
      this.post(this.apis.url('update'), data, callback, onError);
    },

    upload: function(data, callback, onError){
      this.request(this.apis.url('upload'), 'POST', data, callback, onError, true);
    },

    update_url: function(data, callback, onError){
      this.post(this.apis.url('update_url'), data, callback, onError);
    },

    comments_create: function(data, callback, onError){
      this.post(this.apis.url('comments_create'), data, callback, onError);
    },

    comments_reply: function(data, callback, onError){
      this.post(this.apis.url('comments_reply'), data, callback, onError);
    },

    repost: function(data, callback, onError){
      this.post(this.apis.url('repost'), data, callback, onError);
    },

    favorite_create: function(data, callback, onError){
      this.post(this.apis.url('favorite_create'), data, callback, onError);
    },

    // ----------------------------------------------
    // destroy
    // ----------------------------------------------

    destroy: function(data, callback, onError){
      this.post(this.apis.url('destroy'), data, callback, onError);
    },

    comment_destroy: function(data, callback, onError){
      this.post(this.apis.url('comment_destroy'), data, callback, onError);
    },

    favorite_destroy: function(data, callback, onError){
      this.post(this.apis.url('favorite_destroy'), data, callback, onError);
    },

    // ----------------------------------------------
    // friends
    // ----------------------------------------------

    friends: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('friends'), data, function(result){
        callback(result.users, result.next_cursor || 0)
      }, onError);
    },

    followers: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('followers'), data, function(result){
        callback(result.users, result.next_cursor || 0)
      }, onError);
    },

    friend_create: function(data, callback, onError){
      this.post(this.apis.url('friend_create'), data, callback, onError);
    },

    friend_destroy: function(data, callback, onError){
      this.post(this.apis.url('friend_destroy'), data, callback, onError);
    },

    // ----------------------------------------------
    // emotions
    // ----------------------------------------------
    emotions: function(data, callback, onError){
      var that = this;
      this.get(this.apis.url('emotions'), data, function(result){
        callback(result)
      }, onError);
    },

    statuses_show: function(data, callback, onError){
      this.get(this.apis.url('statuses_show'), data, callback, onError);
    }
  };

  module.exports = Client;

});
