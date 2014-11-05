define(function(require, exports, module) {

  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;
  var $         = require('$');
  var NavBarBase= require('./nav-bar-base');
  var postPanel = require('./post-panel');
  var Users     = bg.gegedaa.Users;
  var Unread    = bg.gegedaa.Unread;
  var Notification = require('./notification');
  var App          = require('./ggd-app');

  var Nav = NavBarBase.extend({
    initialize: function GNav(options){

      var that = this;
      that.type = 0;

      that.setElement($($('#_tpl_app_nav').html()));
      NavBarBase.prototype.initialize.call(that, options);

      that.postPanel = postPanel.on('open', function(){
        that.setNavType(1);
      }).on('close', function(){
        that.setNavType(0);
      });
      that.postPanel.userSelector = that;
      that.$('.app-nav-inner').append(postPanel.$el);

      that.$el.on('click', function(e){
        Notification.trigger('scroll_to_top');
      });

      // 栏目tab
      that.items = that.$('.main a');
      that.items.each(function(i){
        var $this = $(this);
        $this.on('click', function(e){
          e.stopPropagation();
          e.preventDefault();
          that.setSelectedItem(i);
        });
        if ($this.hasClass('my-timeline')) {
          $this.on('contextmenu', function(e){
            e.stopPropagation();
            e.preventDefault();
            var currentUser = Users.getCurrentUser();
            var href = 'http://weibo.com/' + currentUser.get('idstr');
            App.openUrl(href, false);
          });
        } else {
          $this.on('contextmenu', function(e){
            e.stopPropagation();
            e.preventDefault();
            var href = this.href;
            App.openUrl(this.href, false);
          });
        }
      });

      // 发微博
      that.$('.new-post').on('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        postPanel.toggle();
      });

      var $userImages = that.$('.head');
      var $headMenu = that.$('.head-popup').on('click', '.user', function(e){
        e.stopPropagation();
        var $this = $(this);
        var id = $this.data('id');
        that.trigger('switch_user', id);
        $headMenu.hide();
      });
      $headMenu.on('mouseleave', function(){
        $headMenu.hide();
      });
      $userImages.on('click', '.ua', function(e){
        e.stopPropagation();
        var $this = $(this);
        if ( that.type == 1 ) {
          $this.toggleClass('selected');
        } else {
          $headMenu.show();
        }
      })

      // 设置按钮
      that.$('.setting').on('click', function(e){
        e.stopPropagation();
        e.preventDefault();

        App.openSettingsPage();
      });

      if ( App.windowMode != 'popup' ) {
        that.$('.w-popup').hide();
        that.$('.w-fullscreen').hide();
      } else {
        that.$('.w-popup').on('click', function(e){
          e.stopPropagation();
          e.preventDefault();
          App.openTab('modal');
        });

        that.$('.w-fullscreen').on('click', function(e){
          e.stopPropagation();
          e.preventDefault();
          App.openTab('tab');
        });
      }

      that.refresh();

      Unread.on('countupdated', function(){
        that.updateNoticeCount();
      }, that);

      Notification.on('switch_user', function(user){
        that.updateNoticeCount();
        $userImages.prepend($userImages.find('[data-id="' + user.get('idstr') + '"]'));
        $headMenu.prepend($headMenu.find('[data-id="' + user.get('idstr') + '"]'));
      }, that);

      that.$('.back-btn').click(function(e){
        e.stopPropagation();
        that.trigger('back');
      });
    },

    showBackNav: function(){
      this.$('.back-nav').show();
      return this;
    },

    hideBackNav: function(){
      this.$('.back-nav').hide();
      return this;
    },

    selectedUsers: function(){
      var userIds = [];
      this.$('.head .ua.selected').each(function(){
        var id = $(this).data('id');
        if ( id && Users.get('sina'+id) ) {
          userIds.push(Users.get('sina'+id));
        }
      });
      return userIds;
    },

    setNavType: function(m){
      var that = this;
      that.type = m;

      var currentUser = Users.getCurrentUser();
      if ( m === 1) {
        that.$el.addClass('state-post-opened');
        that.$('.head .ua[data-id="' + currentUser.get('idstr') + '"]').addClass('selected');
      } else {
        that.$el.removeClass('state-post-opened');
        that.$('.head .ua').removeClass('selected');
      }
    },

    remove: function(){
      Unread.off(null, null, this);
      Notification.off(null, null, this);
      NavBarBase.prototype.remove.call(this);
    },

    refresh: function(){
      var that = this;

      var currentUser = Users.getCurrentUser();

      if ( !currentUser ) return;

      var userHtmlTemplate = '<div class="user" data-id="%userid%">' +
              '<div class="avater"><img src="%userimage%"><i class="notice-pop"></i></div>' +
              '<span class="name">%username%</span>' +
            '</div>';

      var $head = that.$('.head').empty();

      var $users = that.$('.head-popup');
      $users.find('.user').remove();

      var usersHtml = '';
      var userImages = '';
      var c = function(user){
        usersHtml += userHtmlTemplate.replace('%userid%', user.get('idstr')).replace('%userimage%', user.get('profile_image_url')).replace('%username%', user.get('screen_name'));
        userImages += '<div data-id="' + user.get('idstr') + '" class="ua"><img src="' + user.get('profile_image_url') + '" title="' + user.get('screen_name') + '"></div>';
      };

      c(currentUser);
      Users.each(function(user){
        if ( user.id != currentUser.id ) {
          c(user);
        }
      });

      userImages += '<i class="notice-pop"></i>';

      $head.html(userImages);
      $users.prepend(usersHtml);

      that.updateNoticeCount();
    },

    updateNoticeCount: function(){
      var currentUser  = Users.getCurrentUser();
      if ( currentUser ) {
        var $items = this.items;
        this._setNoticeCount($items.filter('.home').find('.notice-pop'), Unread.get(currentUser, 'status'));

        // 提到，评论，私信
        var count = Unread.get(currentUser, 'mention_status') + Unread.get(currentUser, 'cmt') +
                    Unread.get(currentUser, 'mention_cmt') + Unread.get(currentUser, 'dm');
        this._setNoticeCount($items.filter('.mentions').find('.notice-pop'), count);
        this._setNoticeCount($items.filter('.my-timeline').find('.notice-pop'), Unread.get(currentUser, 'follower'));
      }

      var that = this;
      var count = 0;
      var totalCount = 0;
      Users.each(function(user){
        var settings = gegedaa.Settings.get('notice', user.id);
        var c = 0;
        if ( user.get('idstr') != currentUser.get('idstr') ) {
          // 提到，评论
          c = Unread.get(user, 'mention_status') + Unread.get(user, 'cmt') + Unread.get(user, 'mention_cmt') + Unread.get(user, 'dm') + Unread.get(user, 'follower');
          count += c;

          if ( settings.mentions.badge ) totalCount += Unread.get(user, 'mention_status') + Unread.get(user, 'mention_cmt');
          if ( settings.comments.badge ) totalCount += Unread.get(user, 'cmt');
          if ( settings.dmessage.badge ) totalCount += Unread.get(user, 'dm');
          if ( settings.followers.badge ) totalCount += Unread.get(user, 'follower');
        }
        that._setNoticeCount(that.$('.head-popup .user[data-id="' + user.get('idstr') + '"] .notice-pop'), c);
      });

      that._setNoticeCount(that.$('.head .notice-pop'), totalCount);
    },

    _setNoticeCount: function(el, count){
      if ( !el ) return;
      if ( count ) {
        el.text( count > 99 ? '99+' : count ).css('display', 'block');
      } else {
        el.hide();
      }
    }

  });

  module.exports = new Nav();

});
