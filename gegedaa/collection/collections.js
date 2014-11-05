define(function(require, exports, module) {

  var bg      = chrome.extension.getBackgroundPage();
  var Clients = bg.gegedaa.Clients;
  var _       = require('_');

  var Classes = {
    Home: require('./home'),
    Mention: require('./mention'),
    Comments: require('./comments'),
    CommentsByMe: require('./comments-by-me'),
    MentionComments: require('./mention-comments'),
    MyTimeline: require('./mytimeline'),
    Groups: require('./groups'),
    Followers: require('./friendships'),
    Friends: require('./friends'),
    Favorites: require('./favorites')
  };

  var collections = {};

  module.exports = {

    createCollection: function(clazzName, options){
      var Clazz = Classes[clazzName];
      options = _.extend({}, options);

      if ( Clazz ) {
        return new Clazz(null, options);
      } else {
        throw 'not found class: ' + collection;
      }
    },

    // 用户的数据集
    get: function(user, collection){
      if ( !user ) return null;

      if ( !collections[user.id] ) {
        collections[user.id] = {};
      }

      if (!collection) {
        return collections[user.id];
      }

      if ( !collections[user.id][collection] ) {
        var instance = this.createCollection(collection, {
          client: Clients.getClient(user)
        });
        collections[user.id][collection] = instance;
      }

      return collections[user.id][collection];
    }
  };

});
