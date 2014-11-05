define(function(require, exports, module) {

  var Backbone = require('backbone');
  var $        = require('$');
  var _        = require('_');
  var View     = require('../view');
  var utils    = require('../util/utils');

  var user_url = 'http://weibo.com/n/';

  var Status = View.extend({

    initialize: function GVStatus(options){
      this.setElement( $($('#_template_user_item').html()) );
      View.prototype.initialize.call(this, options);
      this.render();
    },

    render: function(){
      var that = this;
      var user = that.model;

      var url = user_url + user.get('screen_name');
      that.$('.user-name').text( user.get('screen_name') ).attr('href', url);
      that.$('.user-image').attr('href', url).find('img').attr('src', user.get('profile_image_url'));
      that.$('.statuses-count').text(user.get('statuses_count'));
      that.$('.friends-count').text(user.get('friends_count'));
      that.$('.followers-count').text(user.get('followers_count'));

      var $followButton = that.$('.follow-button');
      var c = function(){
        if ( !!user.get('following') ) {
          $followButton.addClass('followed').text( !!user.get('follow_me') ? '互相关注' : '已关注' );
        } else if ( !!user.get('follow_me') ) {
          $followButton.removeClass('followed').text('回关注');
        } else {
          $followButton.removeClass('followed').text('关注');
        }
      };

      $followButton.hover(function(){
        if ( !!user.get('following') ) {
          $followButton.text('取消关注');
        } else if ( !!user.get('follow_me') ) {
          $followButton.text('回关注');
        }
      }, c);

      c();

      if ( !that.rendered ) {
        var loading;
        $followButton.on('click', function(e){
          e.preventDefault();

          if ( loading ) return;
          loading = true;
          $followButton.addClass('loading');

          var following = !!user.get('following');
          if ( user.client ) {
            user.client[ following ? 'friend_destroy' : 'friend_create' ]({
              uid: user.get('idstr')
            }, function(){
              loading = false;
              following = !following;
              user.set('following', following);
              that.render();
              $followButton.removeClass('loading');
            }, function(){
              loading = false;
              $followButton.removeClass('loading');
            });
          }
        });
      }

      View.prototype.render.call(this);
    }
  });

  module.exports = Status;
});
