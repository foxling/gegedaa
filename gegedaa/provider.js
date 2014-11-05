define(function(require, exports, module) {
  var _ = require('_');
  var utils = require('./util/utils');
  var WeiboUtility = utils.WeiboUtility;

  var sina = {
    info: {
      site_name       : '新浪微博',
      site_url        : 'http://weibo.com/',
      username_prefix : 'http://weibo.com/n/',
      uid_prefix      : 'http://weibo.com/u/',
      weibo_prefix    : 'http://weibo.com/',
      web_logout      : 'http://weibo.com/logout.php'
    },
    authOptions: {
      clientId: 'app id', // TODO
      clientSecret: 'app secret', // TODO
      scope: 'friendships_groups_read',
      redirectUri: 'http://gegedaa.com/oauth2-callback/sina.html'
    },
    apis: {
      url: function(api){
        return this.HOST + this[api] + '.json';
      },
      HOST: 'https://api.weibo.com/2/',
      user_show: 'users/show',

      unread: 'https://rm.api.weibo.com/2/remind/unread_count.json',
      setcount: 'https://rm.api.weibo.com/2/remind/set_count.json',

      // timeline
      home: 'statuses/home_timeline',
      mentions: 'statuses/mentions',
      comments_mentions: 'comments/mentions',
      comments_to_me: 'comments/to_me',
      comments_by_me: 'comments/by_me',
      favorites: 'favorites',
      user_timeline: 'statuses/user_timeline',
      bilateral_timeline: 'statuses/bilateral_timeline',

      repost_timeline: 'statuses/repost_timeline',
      comments_show: 'comments/show',

      groups: 'friendships/groups',
      groups_timeline: 'friendships/groups/timeline',

      // post
      update: 'statuses/update',
      upload: 'statuses/upload',
      update_url: 'statuses/upload_url_text',

      statuses_show: 'statuses/show',
      comments_create: 'comments/create',
      comments_reply: 'comments/reply',
      repost: 'statuses/repost',
      destroy: 'statuses/destroy',
      comment_destroy: 'comments/destroy',
      favorite_create: 'favorites/create',
      favorite_destroy: 'favorites/destroy',

      // friends
      friend_create: 'friendships/create',
      friend_destroy: 'friendships/destroy',
      friends: 'friendships/friends',
      followers: 'friendships/followers',

      emotions: 'emotions'
    },
    clientParser: {
      error: function(result){
        result = result || {};
        var errorText;
        if ( result.error_code ) {
          if ( this.errorInfo[result.error_code] ) {
            result.error_cn = this.errorInfo[result.error_code];
          }
        }
        if ( !result.error ) result.error = 'error';
        return result;
      },
      status: function(status){
        if ( status.user ) {
          status.url = sina.info.weibo_prefix + status.user.id + '/' + WeiboUtility.mid2url(status.mid);
        }
        if ( status['retweeted_status'] ) {
          status['retweeted_status'] = this.status(status['retweeted_status']);
        }
        return status;
      },
      statuses: function(statuses){
        var that = this;
        statuses = _.isArray(statuses) ? statuses : [statuses];
        _.each(statuses, function(item, i){
          statuses[i] = that.status(statuses[i]);
        });
        return statuses;
      },

      comments: function(comments){
        var that = this;
        comments = _.isArray(comments) ? comments : [comments];
        _.each(comments, function(item, i){
          if (comments[i]['status']){
            comments[i]['status'] = that.status(comments[i]['status']);
          }
        });
        return comments;
      },

      favorites: function(favorites){
        var that = this;
        favorites = _.isArray(favorites) ? favorites : [favorites];
        _.each(favorites, function(item, i){
          favorites[i]['status'] = that.status(favorites[i]['status']);
        });
        return favorites;
      },
      errorInfo: {
        '-1': '无网络连接',
        10001: '新浪服务器出错',
        10002: '新浪服务器暂停',
        10004: 'IP被限制',
        10013: '不合法的用户',
        10022: '请求太频繁，超出新浪限制，请稍后使用',
        20005: '不支持的图片格式，仅支持 jpg, png, gif',
        20006: '图片太大，不过超过5M',
        20008: '内容为空',
        20012: '文字超出140字符',
        20013: '文字超出300字符',
        20016: '发布内容过于频繁',
        20017: '提交相似的信息',
        20018: '包含非法网址',
        20019: '短时间内发送重复信息',
        20207: '该用户设置了信任用户才能评论',
        20003: '用户不存在，可能被禁用了',
        20206: '只有该用户关注的用户才能评论'
      }
    }
  };

  module.exports = {
    sina: sina,
    get: function(provider){
      if ( provider ) {
        return this[provider.toLowerCase()];
      }
      return {};
    }
  };

});
