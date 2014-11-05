define(function(require, exports, module) {
  var root     = this;
  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var Backbone = require('backbone');
  var $        = require('$');
  var _        = require('_');
  var View     = require('../view');
  var utils    = require('../util/utils');
  var Notification = require('../notification');

  var user_url = 'http://weibo.com/n/';

  var Status = View.extend({

    initialize: function GVStatus(options){
      this.setElement( $($('#_tpl_status').html()) );
      View.prototype.initialize.call(this, options);
      this.render();
      Status.timer.start();

      var that = this;
      this.model.on('change', function(){
        console.info('change');
        that.updateCounter();
      }, that);
    },

    remove: function(){
      this.model.off(null, null, this);
      Status.timer.off(null, null, this);
      View.prototype.remove.call(this);
    },

    updateTime: function(){
      // 时间
      this.$('.time').text(utils.timeParse(this.model.get('created_at')));
    },

    updateCounter: function(){
      var model = this.model;
      this.$('.w-item-action .comments .num').text(model.get('comments_count'));
      this.$('.w-item-action .retweet .num').text(model.get('reposts_count'));
      this.$('.w-item-action .like .num').text(model.get('attitudes_count'));
      this.$('.w-item-action .favorite').addClass( !!model.get('favorited') ? 'favorited' : '' );
    },

    render: function(){
      var that = this;
      if ( !that.rendered ) {

        var isRT = that.options.isRT;
        if ( isRT ) {
          that.$el.addClass('w-item-rt');
        }

        var model = that.model;
        var user = model.get('user');
        var currentUser = gegedaa.Users.getCurrentUser();

        // 正文
        that.$('.text').html( model.contentHtml() );

        if ( user.get('idstr') ) { // 否则该微博被删除

          Status.timer.on('tick', function(){
            that.updateTime();
          }, that);

          if ( currentUser.get('idstr') == user.get('idstr') ) {
            var $del = $('<a href="#" class="delete" title="删除"><i class="iconfont">&#xe008;</i></a>');
            that.$('.w-item-action').append($del);
            $del.on('click', function(e){
              e.preventDefault();
              that.trigger('delete', model);
            });
          }

          that.$('.owner-name').text( user.get('screen_name') ).attr('href', user_url + user.get('screen_name')).data('name', user.get('screen_name'));

          // verified_type
          // 0 个人
          // 1 以上应该是机构类型
          if ( !!user.get('verified') ) {
            var $vp = that.$('.verified');
            $vp.attr('title', user.get('verified_reason')).show();
            if ( user.get('verified_type') > 0 ) {
              $vp.addClass('verified-company');
            } else {
              $vp.addClass('verified-personal');
            }
          }

          // 评论数
          var $commentBtn = that.$('.w-item-action .comments').on('click', function(){
            that.trigger('comment');
            return false;
          });

          // 转发数
          var $repostBtn = that.$('.w-item-action .retweet').on('click', function(){
            that.trigger('repost');
            return false;
          });

          // 讚
          var likeLoading;
          var $like = that.$('.w-item-action .like');
          $like.on('click', function(){
            return false;
          });

          that.updateCounter();

          // 收藏
          var favoriteLoading;
          var $favoriteBtn = that.$('.w-item-action .favorite');
          function favComplete(){
            $favoriteBtn.removeClass('loading');
            favoriteLoading = false;
          }

          $favoriteBtn.on('click', function(){
            if ( favoriteLoading ) return;
            var $this = $(this);
            if ( model.client ) {
              favoriteLoading = true;
              $this.addClass('loading');
              if ( $this.hasClass('favorited') ) {
                model.client.favorite_destroy({
                  id: that.model.id
                }, function(data){
                  setTimeout(function(){
                    $this.removeClass('favorited');
                    model.set('favorited', false);
                    favComplete();
                    Notification.trigger('unfavorite', data, model.client.user);
                  }, 700);
                }, function(err){
                  favComplete();
                  if (err && err.error_code == 20705) {
                    $this.removeClass('favorited');
                    model.set('favorited', false);
                    Notification.trigger('unfavorite', null, that.model.client.user);
                  }
                });
              } else {
                model.client.favorite_create({
                  id: that.model.id
                }, function(data){
                  setTimeout(function(){
                    $this.addClass('favorited');
                    model.set('favorited', true);
                    favComplete();
                    Notification.trigger('favorited', data, that.model.client.user);
                  }, 700);
                }, function(err){
                  favComplete();
                  if (err && err.error_code == 20704) {
                    $this.addClass('favorited');
                    model.set('favorited', true);
                    Notification.trigger('favorited', null, that.model.client.user);
                  }
                });
              }
            }
            return false;
          });

          // 地理位置

          if ( model.get('geo_link') ) {
            that.$('.location').attr('href', model.get('geo_link')).show();
          }

          that.$('.time').attr('href', model.get('url'));
          that.updateTime();
          that.$('.weibo-source').html(model.get('source'));

          if ( !isRT ) {
            that.$('.w-item-avatar .source').attr('href', user_url + user.get('screen_name') ).find('img').attr('src', user.get('profile_image_url'));

            var rt = model.get('retweeted_status');
            if ( rt && rt.get('user') && rt.get('user').get('idstr') ) { // 有可能转载微博被删除
              that.$('.w-item-avatar .rt').attr('href', user_url + rt.get('user').get('screen_name')).find('img').attr('src', rt.get('user').get('profile_image_url'));
            } else {
              that.$('.w-item-avatar .rt').remove();
            }
          } else {
            that.$('.w-item-avatar').remove();
          }

          var pics = model.get('pic_urls');
          var picUrls = [];
          if ( pics && pics.length > 0 ) {
            if ( model.showThumbPic() ) {
              that.$el.addClass('small-pics');
            }
            var html = '<div class="status-pics pics-' + pics.length + ' clearfix">';
            if ( pics.length == 1 && root.GegedaaApp.windowMode !== 'popup' ) {
              html += '<div class="pic pic-1" data-index="0"><img src="' + pics[0].thumbnail_pic.replace('thumbnail', 'bmiddle') + '"></div>';
              picUrls.push(pics[0].thumbnail_pic.replace('thumbnail', 'bmiddle'));
            } else {
              _.each(pics, function(pic, i){
                // thumbnail
                // large
                // mw1024
                // square 80x80
                // bmiddle 440
                html += '<div data-index="' + i + '" class="pic pic-' + i + '" style="background:url(' + pic.thumbnail_pic.replace('thumbnail', 'bmiddle') + ') no-repeat center;background-size: cover;"></div>';
                picUrls.push(pic.thumbnail_pic.replace('thumbnail', 'bmiddle'));
              });
            }

            html += '</div>';
            that.$('.w-item-content').append(html).on('click', '.pic', function(){
              var index = $(this).data('index');
              $(root).trigger('browserpicture', [index, picUrls]);
            });
          }
        } else {
          that.$('.w-item-header').remove();
          that.$('.w-item-action').remove();
          that.$('.w-item-avatar').remove();
        }

      }
      View.prototype.render.call(this);
    }
  });

  Status.timer = {
    timer: null,
    start: function(){
      var that = this;
      if ( !that.timer ) {
        that.timer = setInterval(function(){
          that.trigger('tick');
        }, 60000);
      }
    }
  };

  _.extend(Status.timer, Backbone.Events);

  module.exports = Status;
});
