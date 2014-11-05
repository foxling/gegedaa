define(function(require, exports, module) {

  var Backbone     = require('backbone');
  var _            = require('_');
  var $            = require('$');
  var View         = require('../view');
  var utils        = require('../util/utils');
  var gegedaa      = chrome.extension.getBackgroundPage().gegedaa;

  var CommentForm = View.extend({

    initialize: function GVCommentForm(options){
      this.setElement( $($('#_tpl_status_comment_post').html()) );
      View.prototype.initialize.call(this, options);
      this.statusModel = options.status;
      this.type        = options.type;

      this.render();
    },

    reset: function(){
      this.$text.val('');
      this.$textCounter.text('140');
      this.$both.prop('checked', false);
      this.comment_to = null;
    },

    post: function(){

      var that = this, loading;
      var text = that.$text.val();
      if ( loading ) return;

      if ( this.type !== 'repost' && !text ) {
        return ;
      }

      function complete(){
        loading = false;
        that.$submitBtn.removeClass('loading');
      }

      var client = this.statusModel.client;
      if ( client ) {

        loading = true;
        that.$submitBtn.addClass('loading');

        // api 参数
        var params = {
          id: that.statusModel.id
        };

        var isRepost = this.type === 'repost';

        // 评论带转发，或者转发并评论
        var both = that.$both.prop('checked');

        // 评论原微博
        var toOrigin = that.$('input[name="origin"]').prop('checked');

        // 只要是两者都要，那就是转发接口

        if ( both || isRepost ) {
          params.status = text;

          if ( both && !isRepost ) { // 评论并转发
            if ( this.statusModel.isRt() ) {
              var status = '//@' + this.statusModel.get('user').get('screen_name') + ':' + this.statusModel.get('text');
              if ( utils.getTextByteLen( status + text ) <= 280 ) {
                params.status += status;
              }
            }
          }

          if ( both ) {
            if ( toOrigin ) {
              params.is_comment = 3;
            } else {
              params.is_comment = 1;
            }
          } else if ( toOrigin ) {
            params.is_comment = 2;
          }

          client.repost(params, function(data){
            that.trigger('reposted', data);
            that.reset();
            complete();
          }, function(err){
            console.info(err);
            complete();
          });
        } else {
          params.comment = text;

          // 评论原微博
          if ( this.statusModel.isRt() && toOrigin ) {
            params.comment_ori = 1;
          }

          if ( that.comment_to ) { // 回复评论
            params.cid = that.comment_to;
            params.without_mention = 1;
            client.comments_reply(params, function(data){
              that.trigger('commented', data);
              that.reset();
              complete();
            }, function(err){
              console.info(err);
            });
          } else {
            client.comments_create(params, function(data){
              that.trigger('commented', data);
              that.reset();
              complete();
            }, function(err){
              console.info(err);
              complete();
            });
          }
        }
      }
    },

    render: function(){
      var that = this;
      if ( !that.rendered ) {

        that.$userImage = that.$('.u-picture img').attr('src', gegedaa.Users.getCurrentUser().get('profile_image_url'));

        that.$textCounter = that.$('.counter');
        that.$text = that.$('.comment-text').textareaSuggestion({
          list: window.usersSuggestion
        }).keydown(function(e){
          e.stopPropagation();
          var key = e.keyCode;
          if ( ' 13 '.indexOf(' ' + key + ' ') > -1 ) {
            e.preventDefault();
          }
          if ( key === 13 && (e.ctrlKey || e.metaKey ) ) {
            that.post();
            e.stopImmediatePropagation();
          }
        }).autosize();
        that.$text.on('focus blur', utils.textCount.call(that.$text, that.$textCounter, function(len, text){
          if ( len == 0 ) {
            that.comment_to = 0;
          }
        }));

        that.$submitBtn = that.$('.comment-post-btn').on('click', function(){
          that.post();
        });
        that.$both = that.$('input[name="rt"]');

        var $actionName = that.$('.action-name');

        if ( this.type === 'repost' ) {
          $actionName.text('评论');
          that.$text.attr('placeholder', '转发理由');
          that.$submitBtn.text('转发');

          if ( that.statusModel.isRt() ) {
            that.$text.val( '//@' + that.statusModel.get('user').get('screen_name') + ': ' + that.statusModel.get('text') );
          }
        } else {
          $actionName.text('转发');
          that.$text.attr('placeholder', '添加评论');
          that.$submitBtn.text('评论');
        }

        that.$origin = that.$('.origin').css('visibility', that.statusModel.isRt() ? 'visible' : 'hidden');

        var emotionsInited, $emotions = that.$('.emotions').on('click', '.emo', function(){
          var phrase = $(this).data('phrase');
          var elText = that.$text.focus()[0];
          var text = that.$text.val();
          var index = elText.selectionStart;
          that.$text.val(text.substring(0, index) + phrase + text.substring(index));
          elText.selectionStart = elText.selectionEnd = index + phrase.length;
          $emotions.hide();
        });
        that.$('.emon').on('click', function(){
          if ( !emotionsInited ) {
            var emotionsHtml = '';
            gegedaa.Emotions.each(function(model){
              emotionsHtml += '<img class="emo" src="' + model.get('url') + '" data-phrase="' + model.get('phrase') + '">';
            });
            $emotions.html(emotionsHtml);
            emotionsInited = true;
          }
          $emotions.toggle();
        });
      }

      View.prototype.render.call(that);
    }
  });

  module.exports = CommentForm;
});
