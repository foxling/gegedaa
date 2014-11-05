define(function(require, exports, module) {

  var _ = require('_');
  var Backbone = require('backbone');
  var global   = require('./global');

  var settings = {
        users: {}
      },
      storage  = localStorage['Settings'],
      style = '';

  var defaultSettings = {
    basic: {
      menuposition: 'left',
      emotion: true,
      menushare: true,
      fontsize: '13px',
      windowwidth: 520,
      smoothscroll: false,
      pic: 'left',
      skin: 'default'
    },
    notice: {
      home: {
        badge: 1,
        sound: 0
      },
      dmessage: {
        badge: 1,
        sound: 1
      },
      mentions: {
        badge: 1,
        sound: 1
      },
      comments: {
        badge: 1,
        sound: 1
      },
      followers: {
        badge: 1,
        sound: 1
      }
    }
  };

  function cloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  try {
    var storageJSON = JSON.parse(storage);
    _.extend(settings, storageJSON);
  } catch(e) {}

  function validWindowSize(data){
    if ( data && data['windowwidth'] ) {
      var width = parseInt(data['windowwidth']) || 520;
      var val = Math.min(Math.max(520, width), 700);
      data['windowwidth'] = Math.floor(val / 10) * 10;
    }
  }

  var Settings = {

    get: function(key, user){
      // return [key, user];
      if ( !key ) return;

      var def = cloneObject(defaultSettings[key]);
      if ( user ) {
        if ( !settings.users[user] ) {
          settings.users[user] = {};
        }
        return _.extend(def, settings.users[user][key]);
      } else {
        return _.extend(def, settings[key]);
      }
    },

    set: function(key, val, user){
      var data = {};

      if ( user ) {
        if ( !settings.users[user] ) {
          settings.users[user] = {};
        }
        settings.users[user][key] = _.extend(data, settings.users[user][key], val);
      } else {
        settings[key] = _.extend(data, settings[key], val);
      }

      if ( key == 'basic' ) {
        validWindowSize(settings[key]);
        createStyle();
      }

      this.trigger('change');

      save();
    },

    getStyle: function(){
      return style;
    }
  };

  function save(){
    // bg.console.info(settings);
    localStorage['Settings'] = JSON.stringify(settings);
  }

  function createStyle(){
    var basic = Settings.get('basic');
    if ( basic.fontsize ) {
      style = '.w-item-content .text {font-size:' + basic.fontsize + '}';
    }
    if ( basic.windowwidth ) {
      style += '#app-body, .popup {width:' + basic.windowwidth + 'px}';
    }
    if ( global.OS === 'WIN7') {
      style += 'body {font-family:"微软雅黑"}'
    }
  }

  createStyle();

  module.exports = _.extend(Settings, Backbone.Events);
});
