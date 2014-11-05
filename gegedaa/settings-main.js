define(function(require, exports, module) {

  var $         = require('$');
  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;
  var Settings  = gegedaa.Settings;
  var Backbone  = require('backbone');
  var AlertView = require('./view/alert-view');
  var Provider  = require('./provider');
  var OAuth2    = require('./oauth2/oauth2');
  var constance = require('./util/constance');
  var extension = require('./util/extension');

  document.title = chrome.i18n.getMessage('settingsPageTitle');

  $(function(){
    // $('#browser-version').text('浏览器版本: ' + window.navigator.appVersion);

    // bg.getSinaLoginedId();

    // if ( DEBUG ){
      $('#debug').click(function(){
        gegedaa.Users.each(function(user){
          var token = $.extend({}, user.get('token'));
          console.info(token);
          token['auth_time'] = 22222;
          user.set('token', token);
        });
        gegedaa.Users.save();
      });
    // }

    // 设置面板管理
    var panels = function(){
      var nav = $('.setting-nav li'),
          panel = $('.setting-section'),
          selected;

      // nav.each(function(i){
      //   var item = $(this);
      //   item.click(function(){
      //     select(i);
      //   });
      // });

      function select(i){
        nav.removeClass('selected');
        nav.eq(i).addClass('selected');
        if (selected) {
          selected.hide();
        }
        selected = panel.eq(i).show();
      }

      return {
        setActive: select
      };
    }();

    panels.setActive(0);

    var SettingsRoute = Backbone.Router.extend({

      routes: {
        "accounts": "accounts",
        "general": "general",
        "notifications": "notifications"
      },

      accounts: function() {
        panels.setActive(1);
      },

      general: function(){
        panels.setActive(0);
      },

      notifications: function(){
        panels.setActive(2);
      }

    });

    new SettingsRoute();
    Backbone.history.start();

    $.fn.isAppSettings = function(){
      return this.each(function(){

        var $group = $(this), key = $group.data('key');

        if ( key ) {
          settings = Settings.get(key);

          var $items = $('input[type!="radio"], select, .i-radio', $group);
          if ( settings ) {
            $items.each(function(){
              var $this = $(this);
              if ( this.type == 'checkbox' ) {
                this.checked = !!settings[this.name];
              } else if ( $this.hasClass('i-radio') ) {
                $('input[type="radio"][value="' + settings[$this.data('name')] + '"]', $this).prop('checked', true);
              } else {
                $this.val(settings[this.name]);
              }
            });
          }

          $items.each(function(){
            var $item = $(this);
            if ( this.type == 'checkbox' ) {
              $item.change(function(){
                var change = {};
                change[this.name] = this.checked;
                Settings.set(key, change);
              });
            } else if ( $item.hasClass('i-radio') ) {
              $item.on('change', 'input[type="radio"]', function(){
                var change = {};
                change[$item.data('name')] = $(this).val();
                Settings.set(key, change);
              });
            } else {
              $item.on('change', function(e){
                var change = {};
                change[this.name] = this.value;
                Settings.set(key, change);
              });
            }
          });

          $('.number-input', this).numberInput({
            min: 520,
            max: 600,
            step: 10
          });
        }
      });
    };

    $.fn.numberInput = function(options){

      options = options || {};

      var step = options.step || 1;
      var max = options.max || 99999;
      var min = options.min || -99999;

      return this.each(function(){
        var increase = $('.increase', this);
        var lessen = $('.lessen', this);
        var input = $('input[type="text"]', this);
        var value = input.val() - 0 || min;

        input.on('change', function(){
          value = input.val() - 0 || min;
        });

        increase.click(function(){
          input.val( Math.min(value+=step, max) ).trigger('change');
          check();
        });
        lessen.click(function(){
          input.val( Math.max(value-=step, min) ).trigger('change');
          check();
        });

        function check(){
          if ( value == max ) {
            increase.prop('disabled', true);
          } else {
            increase.prop('disabled', false);
          }
          if ( value == min ) {
            lessen.prop('disabled', true);
          } else {
            lessen.prop('disabled', false);
          }
        }
      });

    };

    // {"users":
    // {
    // "all":{},
    // "SINA1885325062":{
    //   "notice":{
    //     "home":"2","mentions":"1","comments":"1"
    //   }
    // },"SINA2210086133":{"notice":{"home":"0","mentions":"1","comments":"1"}},"SINA1564533510":{},"SINA2881004164":{"notice":{"home":"0","mentions":"1","comments":"1"}}}}

    $.fn.isNoticeSettings = function(){

      return this.each(function(){

        var $this = $(this),
            users = $('select[name="userlist"]', $this),
            settingType   = $this.data('key');

        $('input.sound').mouseover(function(){
          bg.playMsgSound();
        });

        var userlist = '';//'<option value="all">所有帐号</option>';

        gegedaa.Users.each(function(user){
          userlist += '<option value="' + user.id + '">' + user.get('screen_name') + '</option>';
        });

        users.html(userlist).on('change', function(){
          setValue();
        });

        var $items = $('input[type="checkbox"]', $this);

        $items.on('change', function(e){
          save()
        });

        setValue();

        function save(){
          var uid = users.val();
          var settings = Settings.get(settingType, uid);
          $.each(settings, function(type, val){
            $.each(val, function(key, val){
              settings[type][key] = $items.filter('[name="' + type + '[' + key + ']"]').prop('checked');
            });
          });
          Settings.set(settingType, settings, uid);
        }

        // notice: {
        //   home: {
        //     badge: 1,
        //     sound: 0
        //   },
        //   mentions: {
        //     badge: 1,
        //     sound: 1
        //   },
        //   comments: {
        //     badge: 1,
        //     sound: 1
        //   }
        // }

        function setValue(){
          var settings = Settings.get(settingType, users.val());
          $.each(settings, function(type, val){
            $.each(val, function(key, val){
              $items.filter('[name="' + type + '[' + key + ']"]').prop('checked', !!val);
            });
          });
        }

      });
    };

    $('#basic-setting').isAppSettings();
    $('#notice-settings').isNoticeSettings();

    // // 设置项初始化
    // var basic         = $('#basic-setting'),
    //     fontSize      = basic.find('select[name="font-size"]'),
    //     menuPosition  = basic.find('select[name="menu-position"]'),
    //     emotion       = basic.find('input[name="emotion"]'),
    //     share         = basic.find('input[name="share"]'),
    //     shortcutShow  = basic.find('input[name="shortcut-show"]'),
    //     shortcutWrite = basic.find('input[name="shortcut-write"]'),
    //     result        = basic.find('.result'),
    //     settings      = bge.Settings.get('basic');

    // settings.fontSize     && fontSize.val(settings.fontSize || '12px');
    // settings.menuPosition && menuPosition.val(settings.menuPosition || 'left');
    // emotion.prop('checked', !!settings.emotion);
    // share.prop('checked', !!settings.share);
    // shortcutShow.val( settings.shortcutShow || '' );
    // shortcutWrite.val( settings.shortcutWrite || '' );

    // $('.save-btn', basic).click(function(){
    //   settings.fontSize      = fontSize.val();
    //   settings.menuPosition  = menuPosition.val();
    //   settings.emotion       = emotion.prop('checked');
    //   settings.share         = share.prop('checked');
    //   settings.shortcutShow  = shortcutShow.val();
    //   settings.shortcutWrite = shortcutWrite.val();


    //   bge.Settings.set('basic', settings);
    //   result.show();

    //   setTimeout(function(){
    //     result.hide();
    //   }, 2000);
    // });

    var AccountSetting = Backbone.View.extend({

      initialize: function(){

        this.setElement( $('#account-setting') );

        this.$list = this.$('.acounts-list');
        this.$tips = this.$('.tips');

        var that  = this,
            users = gegedaa.Users.getUsers();

        $.each(users, function(i, user){
          var client = gegedaa.Clients.getClient(user);
          that.addUser(user, client.isAccessTokenExpired());
        });

        var account  = $('#account-setting');

        $('.acount-btn', account).click(function(){

          // 如果查询到新浪登录后的ID
          if ( bg.sinaLoginedId ) {
            gegedaa.Users.each(function(user){
              if ( user.get('uid') == bg.sinaLoginedId ) {
                bg.sinaForcelogin = true;
                return false;
              }
            });
          }

          that.$tips.hide();

          var btn       = $(this),
              platform  = btn.data('platform'),
              settings  = Provider[platform],
              authorize = settings['authorize'],
              apis      = settings['apis'];

          var aOAuth2 = new OAuth2(Provider.sina.authOptions);
          aOAuth2.authorize(true);
        });

      },

      addUser: function(user, isAccessTokenExpired) {
        var item = $('<li class="card">' +
              '<img src="' + user.get('profile_image_url') + '" alt="" width="50px" class="avater"/>' +
              '<span class="name">' + user.get('screen_name') + '</span>' +
              '<span class="weibo-name">新浪微博</span>' +
              '<span class="weibo-icon sina"></span>' +
              ( isAccessTokenExpired ? '<span class="expired">授权过期</span>' : '' ) +
              '<a href="#" class="delete"></a>' +
            '</li>');
        $('.delete', item).click(function(){
          if (confirm('确认注销该帐号？')){
            gegedaa.Users.deleteUser(user.id);
            gegedaa.Clients.removeClient(user);
            item.remove();
          }
          return false;
        });
        this.$list.append(item);
      }
    });

    var accounts = new AccountSetting();


    // 主题
    var $currentSkin = $('.theme.'+$('input[name="skin"]').val()).addClass('active');
    $('td .theme').click(function(){
      $('input[name="skin"]').val($(this).data('name')).change();
      if ( $currentSkin ) $currentSkin.removeClass('active');
      $currentSkin = $(this).addClass('active');
    });

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
            var user = gegedaa.Users.get(message.uid);
            if ( user ) {
              accounts.addUser(user, false);
            }
            break;
        }
      }
    });
  });
});
