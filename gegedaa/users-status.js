define(function(require, exports, module) {
  var bg          = chrome.extension.getBackgroundPage();
  var _           = require('_');
  var usersStatus = {};

  try {
    var usersData = bg.localStorage['UsersStatus'];
    _.extend(usersStatus, JSON.parse(usersData));
  } catch(e) {}


  function save(){
    bg.localStorage['UsersStatus'] = JSON.stringify( usersStatus );
  }

  module.exports = {
    set: function(user, key, val){
      if ( !key ) return;

      if (!user) {
        usersStatus[key] = val;
      } else {
        if ( !usersStatus[user.id] ) {
          usersStatus[user.id] = {};
        }
        usersStatus[user.id][key] = val;
      }

      save();
    },

    get: function(user, key){
      if ( !user ) {
        return usersStatus[key];
      } else if ( usersStatus[user.id] ) {
        return usersStatus[user.id][key];
      }

      return null;
    }
  };

});
