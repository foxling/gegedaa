define(function(require) {
  // var g = require('./global');
  var root      = this;
  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;

  var $               = require('$');
  var _               = require('_');
  var Notification    = require('./notification');
  var constance       = require('./util/constance');
  var Provider        = require('./provider');
  var OAuth2          = require('./oauth2/oauth2');
  var AlertView       = require('./view/alert-view');
  var UsersStatus     = require('./users-status');
  var StatusViewer    = require('./view/status-viewer');
  var UsersSuggestion = require('./view/users-suggestion');
  var extension       = require('./util/extension');

  require('./util/jquery-textarea-suggestion');

  var app          = require('./ggd-app');
  var $appBody     = app.$el;

  var $win         = $(root);

  root.GegedaaApp = app;

  if ( app.windowMode == 'popup' ) {
    $('html,body').addClass('popup');
  }

  var currentUser = gegedaa.Users.getCurrentUser();

  var usersSuggestion = new UsersSuggestion({
    collection: gegedaa.UsersCache
  });

  root.usersSuggestion = usersSuggestion;

  // 主要的栏目模块
  var ViewController        = require('./view-controller');
  var MentionViewController = require('./view/mention-tab');
  var HomeViewController    = require('./view/home');
  var ProfileTab            = require('./view/profile-tab');

  var home    = new HomeViewController({model:currentUser});
  var mention = new MentionViewController({model:currentUser});
  var profile = new ProfileTab({model:currentUser});
  var search  = new ViewController();

  app.setViews([home, mention, profile, search]);

  // 全局导航条，包含发送面板
  var nav = require('./nav');
  nav.on('switch_user', function(id){
    id = 'sina' + id;
    var currentUser = gegedaa.Users.getCurrentUser();
    var user = gegedaa.Users.get(id);
    if ( user && user.id != currentUser.id ) {
      setCurrentUser(user);
    }
  });
  nav.postPanel.on('new_status', function(users, data){
    gegedaa.postNewStatus(users, data);
  });
  nav.postPanel.setSuggestionView(usersSuggestion);

  function newStatusPostFailed(user, error){
    if ( !user ) return;
    var alert = new AlertView();
    alert.show('帐号 <strong>' + user.get('screen_name') + '</strong> 发送错误：' + (error ? error.error : 'unknow'), null, {
      hideBtnNo: true
    });
  }

  function updateTitle(){
    var currentUser  = gegedaa.Users.getCurrentUser();
    var Unread       = gegedaa.Unread;
    if ( currentUser ) {
      var settings = gegedaa.Settings.get('notice', currentUser.id);
      var count = 0;
      if ( settings.mentions.badge ) count += Unread.get(currentUser, 'mention_status') + Unread.get(currentUser, 'mention_cmt');
      if ( settings.comments.badge ) count += Unread.get(currentUser, 'cmt');
      if ( settings.dmessage.badge ) count += Unread.get(currentUser, 'dm');
      if ( settings.followers.badge ) count += Unread.get(currentUser, 'follower');
      document.title = (count > 0 ? '(' + count + ')' : '') + chrome.i18n.getMessage('appName');
    }
  }

  // 插件消息接收
  extension.onMessage(function(message, sender, sendResponse) {
    if ( message ) {
      switch (message.name) {
        case constance.message.BG_INITED:
          location.reload();
          break;

        case constance.message.AUTH_CALLBACK:
          $('#'+OAuth2.IFRAME_ID).remove();
          break;

        case constance.message.NEW_USER_ADDED:
          nav.refresh();
          if ( gegedaa.Users.getUsers().length === 1 ) {
            setCurrentUser(gegedaa.Users.getCurrentUser());
          }
          break;
        case constance.message.USER_DELETE:
          nav.refresh();
          setCurrentUser(gegedaa.Users.getCurrentUser());
          break;
        case constance.message.USER_UPDATED:
          if ( message.uid ) {
            var user = gegedaa.Users.get(message.uid);
            var currentUser = gegedaa.Users.getCurrentUser();
            if ( user && user.id == currentUser.id ) {
              location.reload();
            }
          }
          break;
        case constance.message.USER_SWITCHED:
          Notification.trigger('switch_user', gegedaa.Users.getCurrentUser());
          break;
        case constance.message.NEW_STATUS_POSTED:
          nav.postPanel.postComplete(message.errorUsers);
          break;
        case constance.message.NEW_STATUS_POST_ERROR:
          newStatusPostFailed(message.user, message.error);
          break;
        case constance.message.NEW_STATUS_NOTICE:
          updateTitle();
          break;
      }
    }
  });


  var unloaded, unloadfun = function(e){
    if (unloaded) return;
    unloaded = true;
    bg.console.info('window ' + e.name);
    app.remove();
    app = null;
    $win.off();
  };
  $win.on('unload', unloadfun).on('beforeunload', unloadfun).on('error', function(e){
    bg.location.reload();
  });
  bg.console.info('window events binded');

  var ImageViewer = require('./view/image-viewer');
  var imageViewer;

  // init
  loadSkin();
  initStyle();

  (function(){
    var $popup = $('html,body');
    function windowResize(){
      var css = {
        width: $win.width() + 'px',
        height: $win.height(),
        'max-width': 'none'
      };
      $popup.css(css);
      $appBody.css(css);
    }

    if ( app.windowMode != 'popup' || window.location.href.indexOf('windowmode=modal') > -1 ) {
      windowResize();
      $win.on('resize', windowResize);
    }
  })();

  setTimeout(init, 10);

  $(document).on('click', '.owner-name,.user-name,.user-show,.at-username', function(e){
    e.preventDefault();

    var $this = $(this);
    var name = $this.data('name');

    if ( !name ) {
      var a = $this.attr('href').split('/');
      name = a[a.length-1];
    }

    if ( name ) {
      var p = new ProfileTab({
        userScreenName: name
      });
      app.presentView(p);
    }
  }).on('click', '.bg-link', function(e){
    if ( app.windowMode == 'popup' ) {
      e.preventDefault();
      app.openUrl(this.href, false);
    }
    return true;
  }).on('contextmenu', '.bg-link,.user-show,.at-username,.owner-name', function(e){
    e.preventDefault();
    var href = this.href || $(this).data('href');
    app.openUrl(this.href, false);
  });

  function setCurrentUser(user){
    if ( user ) {
      gegedaa.Users.setCurrentUser(user.id);
      if ( gegedaa.Clients.getClient(user).isAccessTokenExpired() ) {
        var aOAuth2 = new OAuth2(Provider.sina.authOptions);
        aOAuth2.authorize(true);
        return;
      }
    }
  }

  function init(){
    app.setNavigationBar(nav);

    var user = gegedaa.Users.getCurrentUser();
    if ( !user || gegedaa.Clients.getClient(user).isAccessTokenExpired() ) {
      var aOAuth2 = new OAuth2(Provider.sina.authOptions);
      aOAuth2.authorize(true);
      return;
    }

    imageViewer = new ImageViewer();
    $('body').append(imageViewer.$el, usersSuggestion.$el);

    $win.on('browserpicture', function(e, index, pics){
      imageViewer.open(index, pics);
    });


    var statusViewer;
    Notification.on('favorited', function(data, user){
      if ( !data ) return;
      var collection = gegedaa.Collections.get(user, 'Favorites');
      if ( !collection.get(data.status.id) ) {
        collection.unshift(data, {parse: true});
      }
    }).on('unfavorite', function(data, user){
      if ( !data ) return;
      var collection = gegedaa.Collections.get(user, 'Favorites');
      var model = collection.get(data.status.id);
      if ( model ) {
        collection.remove(model);
      }
    }).on('add_user', function(){
      var aOAuth2 = new OAuth2(Provider.sina.authOptions);
      aOAuth2.authorize(true);
    }).on('view_status', function(model){
      if ( !statusViewer ) {
        statusViewer = new StatusViewer();
      }
      statusViewer.show(model);
    });
  }

  function loadSkin(){
    var head = document.getElementsByTagName('head');
    var settings = gegedaa.Settings.get('basic');
    if ( settings && settings.skin && settings.skin != 'default' ) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'style/' + settings.skin + '/style.css';
      head[0] && head[0].appendChild(css);
    }
  }

  function initStyle(){
    var style = document.createElement('style'),
        rules = document.createTextNode( gegedaa.Settings.getStyle() );

    style.type = 'text/css';
    if ( style.styleSheet ) {
      style.styleSheet.cssText = rules.nodeValue;
    } else {
      style.appendChild(rules);
    }
    var head = document.getElementsByTagName('head');
    head[0] && head[0].appendChild(style);
  }

  // Google 统计
  require('./ga').init();
});
