define(function(require, exports, module) {

  var bg           = chrome.extension.getBackgroundPage();
  var gegedaa      = bg.gegedaa;
  var Unread       = bg.gegedaa.Unread;

  var $            = require('$');
  var _            = require('_');
  var NavBarBase   = require('../nav-bar-base');

  require('blurjs');

  var ProfileHeader = NavBarBase.extend({

    initialize: function GVProfileHeader(options){

      options = options || {};
      var that = this;
      that.setElement( $($('#template_profile_header').html()) );
      NavBarBase.prototype.initialize.call(that, options);

      that.items = that.$('.state li a');
      that.items.each(function(i){
        $(this).on('click', function(e){
          e.preventDefault();
          that.setSelectedItem(i);
        });
      });

      that.render();

      var currentUser = gegedaa.Users.getCurrentUser();
      if ( that.model && currentUser.get('idstr') == that.model.get('idstr') ) {
        Unread.on('countupdated', function(){
          that.updateNoticeCount();
        }, that);
      }
    },

    remove: function(){
      Unread.off(null, null, this);
      NavBarBase.prototype.remove.call(this);
    },

    updateNoticeCount: function(){
      var user  = this.model;
      if ( user ) {
        var $items = this.items;
        this._setNoticeCount($items.eq(2).find('.notice'), Unread.get(user, 'follower'));
      }
    },

    _setNoticeCount: function(el, count){
      if ( !el ) return;
      if ( count ) {
        el.text(count).attr('title', count).show();
      } else {
        el.hide();
      }
    },

    setUser: function(user){
      this.model = user;
      this.render();
    },

    render: function(){
      var user = this.model;
      var that = this;
      if ( user ) {
        // clear bg
        this.$el.css('background-image', 'none');

        this.$('.avater').html('<img src="' + user.get('avatar_large') + '">');
        this.$('.p-bio').text(user.get('description')).attr('title', user.get('description'));

        if ( user.get('gender') == 'm' || user.get('gender') == 1 ) {
          this.$('.p-info .gender').text('男').addClass('male');
        } else {
          this.$('.p-info .gender').text('女').addClass('female');
        }

        this.$('.p-info .location').text( user.get('location') );
        this.$('.p-name .name').text( user.get('screen_name') );

        this.$('.p-weibo strong').text( user.get('statuses_count') );
        this.$('.p-followers strong').text( user.get('followers_count') );
        this.$('.p-following strong').text( user.get('friends_count') );
        this.$('.p-fav strong').text( user.get('favourites_count') );

        // verified_type
        // 0 个人
        // 1 以上应该是机构类型
        if ( !!user.get('verified') ) {
          var $vp = this.$('.v-personal');
          $vp.attr('title', user.get('verified_reason')).show();
          if ( user.get('verified_type') > 0 ) {
            $vp.addClass('v-company');
          } else {
            $vp.removeClass('v-company');
          }
        }

        var $bg = $('<div></div>').css({
          'background-attachment': 'fixed',
          'background-image': 'url(' + user.get('avatar_large') + ')'
        });

        this.$el.blurjs({
          source: $bg,
          radius: 3,
          overlay: 'rgba(0,0,0,0.5)'
        });

        if ( !gegedaa.Users.findWhere({idstr: user.get('idstr')}) ) {
          this.items.last().hide();
        }

        this.checkFollowState();
      }

      if ( !this.rendered ) {
        var loading;
        var $followButton = this.$('.state .follow');
        $followButton.on('click', function(e){
          e.preventDefault();

          var currentUser = gegedaa.Users.getCurrentUser();
          if ( !currentUser || loading ) return;

          loading = true;
          $followButton.addClass('loading');

          var following = !!user.get('following');
          var client = gegedaa.Clients.getClient(currentUser);
          if ( client ) {
            client[ following ? 'friend_destroy' : 'friend_create' ]({
              uid: user.get('idstr')
            }, function(){
              loading = false;
              $followButton.removeClass('loading');
              following = !following;
              user.set('following', following);
              console.info(user.get('following'));
              that.checkFollowState();
            }, function(){
              loading = false;
              $followButton.removeClass('loading');
            });
          }
        });
      }

      this.updateNoticeCount();

      NavBarBase.prototype.render.call(this);
      return this;
    },

    checkFollowState: function(){
      var currentUser = gegedaa.Users.getCurrentUser();
      var user = this.model;

      if ( user.get('idstr') != currentUser.get('idstr') ) {

        var $f = this.$('.state .follow').css('display', 'block').hover(function(){
          if ( !!user.get('following') ) {
            $f.text('取消关注');
          }
        }, function(){
          if ( !!user.get('following') && !!user.get('follow_me') ) {
            $f.text('互相关注');
          } else if ( !!user.get('following') ) {
            $f.text('已关注');
          }
        }).removeClass('followed');

        var fm = !!user.get('follow_me'), f = !!user.get('following');

        if ( fm && f ) {
          $f.text('互相关注').addClass('followed');
        } else if ( f ) {
          $f.text('已关注').addClass('followed');
        } else if ( fm && !f ) {
          $f.text('回关注');
        } else {
          $f.text('关注');
        }
      }
    }
  });

  module.exports = ProfileHeader;
});
