define(function(require) {

  var $         = require('$');
  var _         = require('_');
  var constance = require('./util/constance');
  var Client    = require('./client/client');
  var User      = require('./model/user');
  var Provider  = require('./provider');
  var OAuth2    = require('./oauth2/oauth2');
  var extension = require('./util/extension');

  var root = this;
  var g    = root.gegedaa = {};

  g.Settings    = require('./settings');
  g.Clients     = require('./client/clients');
  g.Users       = require('./model/users');
  g.Collections = require('./collection/collections');
  g.Unread      = require('./collection/unread');
  g.Emotions    = require('./collection/emotions');
  g.UsersCache  = require('./collection/users-cache');

  // 老数据兼容
  var users = g.Users.getUsers();
  _.each(users, function(user){
    var json = user.toJSON();
    json.id = json.id.toLowerCase();
    g.Users.addUser(json);
  });

  users = g.Users.getUsers();

  function fetchFriends(){
    if ( users.length == 0 ) {
      return ;
    }

    var user = users.pop();
    var nextCursor = 0;

    function fetch() {
      var client = g.Clients.getClient(user);
      client.friends({
        uid: user.get('idstr'),
        count: 100,
        cursor: nextCursor
      }, function(data, next_cursor){
        nextCursor = next_cursor;
        if ( data && data.length > 0 ) {
          var models = [];
          _.each(data, function(model){
            g.UsersCache.addUser(model);
          });
        }

        if ( nextCursor ) {
          fetch();
        } else {
          fetchFriends();
        }
      }, function(err){
        fetchFriends();
      });
    }

    fetch();
  }

  fetchFriends();

  var lastCommentsCount = 0;
  g.Unread.on('countupdated', function(){
    var comments = 0, statuses = 0;
    var sound;

    // g.Users.each(function(user){
    //   comments += g.Unread.get(user, 'mention_status') + g.Unread.get(user, 'cmt') + g.Unread.get(user, 'mention_cmt');
    //   comments += g.Unread.get(user, 'follower') + g.Unread.get(user, 'dm');
    //   statuses += g.Unread.get(user, 'status');
    // });

    _.each(g.Unread.getAll(), function(count, uid){
      var settings = g.Settings.get('notice', uid);
      _.each(count, function(val, key){
        switch (key) {
          case 'mention_status': // 新提及我的微博数
          case 'mention_cmt': // 新提及我的评论数
            if ( settings.mentions.badge ) comments += val;
            if ( settings.mentions.sound && val > 0 ) sound = true;
            break;
          case 'cmt':
            if ( settings.comments.badge ) comments += val;
            if ( settings.comments.sound && val > 0 ) sound = true;
            break;
          case 'dm':
            if ( settings.dmessage.badge ) comments += val;
            if ( settings.dmessage.sound && val > 0 ) sound = true;
            break;

          case 'follower':
            if ( settings.followers.badge ) comments += val;
            if ( settings.followers.sound && val > 0 ) sound = true;
            break;

          case 'status':
          case 'bilateral':
            if ( settings.home.badge ) statuses += val;
            if ( settings.home.sound && val > 0 ) sound = true;
            break;
        }
      });
    });

    if ( comments ) {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [204, 0, 0, 255]
      });
    } else {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [0, 128, 255, 255]
      });
    }

    var total = comments || statuses;

    if ( !total ) {
      total = '';
    } else {
      total += ''; //字符串
    }

    chrome.browserAction.setBadgeText({
      text: (total > 99 ? '99+' : total)
    });

    if ( sound && comments > lastCommentsCount ) {
      root.playMsgSound();
    }
    lastCommentsCount = comments;
  });

  g.Users.on('user_add', function(id){
    console.info('user_add', id);

    // 新增第一个用户
    if ( g.Users.length == 1 ) {
      // loadStatuses();
    }

    extension.sendMessage({
      name: constance.message.NEW_USER_ADDED,
      uid: id
    });
  }).on('user_update', function(id){
    console.info('user_update', id);
    var user = g.Users.get(id);
    if ( user ) {
      var client = g.Clients.getClient(user);
      client.oauth2.updateToken(user.get('token'));

      extension.sendMessage({
        name: constance.message.USER_UPDATED,
        uid: id
      });
    }
  }).on('user_delete', function(user){
    extension.sendMessage({
      name: constance.message.USER_DELETE,
      user: user
    });
  }).on('user_switched', function(){
    extension.sendMessage({
      name: constance.message.USER_SWITCHED
    });
  });

  g.Settings.on('change', function(){
    if ( g.Settings.get('basic')['menushare'] ) {
      createContextMenu();
    } else {
      removeContextMenu();
    }
  });

  // 接收消息
  extension.onMessage(function(message, sender, sendResponse) {
    // console.info('bg onMessage', message, sender);
    if ( message ) {
      switch (message.name) {
        case constance.message.AUTH_CALLBACK:
          finishAuth(message.url);
          break;
      }
    }
  });

  // 未读消息检查
  g.Unread.on('countupdated', function(){
    // console.info('unread updated', g.Unread.getAll());
    extension.sendMessage({
      name: constance.message.NEW_STATUS_NOTICE
    });
  });
  g.Unread.start();

  // loadStatuses();

  function loadStatuses(){
    // 初始化数据
    var currentUser = g.Users.getCurrentUser();
    if ( currentUser ) {
      g.Collections.get(currentUser, 'Home').load();
      g.Collections.get(currentUser, 'Groups').fetch();
    } else {
      console.log('no users');
    }
  }

  // ========== 发微博 ==========================
  g.postNewStatus = function(users, formData){
    if ( !users || !users.length || !formData ) {
      return false;
    }

    var length = users.length;
    var errorUsers = [];

    _.each(users, function(user){
      var client = g.Clients.getClient(user);
      if ( formData.toString() == '[object FormData]' ) {
        client.upload(formData, success, fail);
      } else {
        client.update(formData, success, fail);
      }
    });

    function success(result){
      var collection = g.Collections.get(this.user, 'Home');
      if (collection) {
        collection.unshift(result, {parse: true, at:0});
      }

      length -= 1;
      checkDone();
    }

    function fail(err){
      console.info('new status error', error);

      length -= 1;

      if (this.user) {
        errorUsers.push(this.user);
        extension.sendMessage({
          name: constance.message.NEW_STATUS_POST_ERROR,
          user: this.user,
          error: err
        });
      }
      checkDone();
    }

    function checkDone(){
      if ( length <= 0 ) {
        extension.sendMessage({
          name: constance.message.NEW_STATUS_POSTED,
          errorUsers: errorUsers
        });
      }
    }
  }
  // ============================================

  // 授权
  var currentProvider = 'sina';

  function finishAuth(url){
    var aOAuth2 = new OAuth2(Provider[currentProvider].authOptions);
    aOAuth2.on('auth_finish', function(){
      var client = new Client(aOAuth2, Provider[currentProvider]);
      client.user_show({
        uid: aOAuth2.uid
      }, function(result){
        if ( result && result.id ) {
          var userData = result;
          userData.token = {
            access_token: aOAuth2.accessToken,
            auth_time:    aOAuth2.authTime,
            expires_in:   aOAuth2.expiresIn
          };

          // 用户ID
          userData.uid      = userData.idstr;
          // 包含平台标识的ID
          userData.id       = currentProvider + userData.idstr;
          // 用户所属平台
          userData.platform = currentProvider;
          // 用户性别
          userData.gender   = userData.gender == "m" ? 1 : 0;

          g.Users.addUser(userData);
        }
      }, function(){
        console.info('error');
      });
    });
    aOAuth2.finishAuth(url);
  }

  // 播放声音
  var msgSound;
  root.playMsgSound = function() {
    if ( msgSound ) msgSound.play();
  }

  $(function(){
    console.log('bg inited');
    newVersionNotice();

    msgSound = document.getElementById('notice-sound');

    extension.sendMessage({
      name: constance.message.BG_INITED
    });

    // 更新用户资料
    g.Users.each(function(user){
      var client = g.Clients.getClient(user);
      if ( client ) {
        client.user_show({
          uid: user.get('idstr')
        }, function(data){
          delete data.id;
          data.gender = data.gender == "m" ? 1 : 0;
          user.set(data);
        });
      }
    });

    removeContextMenu();
    if ( g.Settings.get('basic')['menushare'] ) {
      createContextMenu();
    }

    // Google 统计
    require('./ga').init();
  });

  var contextMenuCreated;

  // 移除右键菜单
  function removeContextMenu(){
    chrome.contextMenus.removeAll();
    contextMenuCreated = false;
  }

  // 创建右键菜单
  function createContextMenu(){
    if ( contextMenuCreated ) return;
    chrome.contextMenus.create({
      title: '通过咯咯哒分享',
      contexts: ["all"],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
      onclick: function(info, tab){ // info, tab

        chrome.windows.getCurrent(function(_window){
          g.openerWindow = _window;
        });

        var params = {
          title: tab.title,
          url:   tab.url
        };

        if ( info.selectionText ) {
          params.txt = info.selectionText;
        }

        if ( info.srcUrl ) {
          params.srcUrl = info.srcUrl;
        }

        popupWrite(params);

      }
    });
    contextMenuCreated = true;
  }

  function popupWrite(params, users){
    var url = chrome.extension.getURL('write.html');

    // 搜狗浏览器 windows create 就是打开插件页面，不需要全路径
    try {
      if ( sogouExplorer ) url = 'write.html';
    } catch(e){}

    params = params || {};

    if ( users ) params.selectedUsers = users;

    url += '#' + JSON.stringify(params);

    var winW = 500,
        winH = 220,
        sw   = window.screen.width,
        sh   = window.screen.height;

    var left = Math.floor((sw - winW) / 2),
        top  = Math.floor((sh - winH) / 2);

    chrome.windows.create({
      url: url,
      width: winW,
      height: winH,
      top: top,
      left: left,
      focused: true,
      type: "popup"
    });
  }

  // 新版本更新提示
  function newVersionNotice(){
    var notice = localStorage['NewVersionNotice'];
    if ( !notice || notice < '2.0.5' ) {
      var notification, title='更新', message = '咯咯哒更新至 2.0.5 版本', icon = 'http://gegedaa.b0.upaiyun.com/icons/48.png';
      if (root.webkitNotifications) {
        notification = root.webkitNotifications.createNotification(
          icon,
          title,
          message
        );
        notification.show();
      } else if (root.Notification) {
        notification = new Notification(title, {body: message, icon:icon});
      }
      if (notification) {
        localStorage['NewVersionNotice'] = '2.0.5';
      }
    }
  }

  g.popupWrite = popupWrite;

});
