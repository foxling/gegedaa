define(function(require, exports, module) {
  var bg            = chrome.extension.getBackgroundPage();
  var gegedaa       = bg.gegedaa;

  var Backbone      = require('backbone');
  var $             = require('$');
  var View          = require('../view');
  var AlertView     = require('./alert-view');
  var StatusWrapper = require('./status-wrapper');
  var utils         = require('../util/utils');
  var Notification  = require('../notification');
  var CommentForm   = require('./comment-form');

  var CommentView = View.extend({

    initialize: function GVStatusWrapper(options){
      View.prototype.initialize.call(this, options);
      this.render();
    },

    className: 'comment-item-wrapper',

    render: function(){
      var that = this;
      if ( !that.rendered ) {

        var model = that.model;

        if ( model.get('reply_comment') ) {
          that.$el.addClass('reply-comment');
        }

        that.$el.append(CommentView.commentHtml(model));
        that.$('.quote').on('click', function(){
          Notification.trigger('view_status', model.get('status'));
          return false;
        });
        that.$('.reply').click(function(){
          if ( that.postFormVisible ) {
            that.hidePostForm();
          } else {
            that.showPostForm();
          }
        });
        that.$('.delete').click(function(){
          var alert = new AlertView();
          alert.showInView(that.$el, '确认删除该评论？', function(result){
            if (result) {
              var currentUser = gegedaa.Users.getCurrentUser();
              var client = gegedaa.Clients.getClient(currentUser);
              var id = model.id;
              if ( client && id ) {
                client.comment_destroy({cid: id}, function(){
                  if ( model.collection ) model.collection.remove(model);
                  that.remove();
                });
              }
            }
          });
        });
      }

      View.prototype.render.call(this);
    },

    showPostForm: function(){
      var that = this;
      if ( !that.postForm ) {
        that.postForm = new CommentForm({
          status: that.model.get('status'),
          type: 'comment'
        }).on('commented', function(data){
          console.info(data);
          that.hidePostForm();
        });
        that.$el.append(this.postForm.$el);
        that.postForm.comment_to = that.model.get('idstr');
        that.postForm.$text.val( '回复 @' + that.model.get('user').get('screen_name') + ': ');
        utils.moveCursorToEnd(that.postForm.$text[0]);
      }
      that.postForm.$text.focus();
      that.postForm.$el.show();
      that.postFormVisible = true;
    },

    hidePostForm: function(){
      if ( this.postForm ) {
        this.postForm.$text.blur();
        this.postForm.$el.hide();
        this.postFormVisible = false;
      }
    }
  });
  CommentView.postFormTemplate = function(){
    if ( !this.__postFormTemplateHtml ) {
      this.__postFormTemplateHtml = $('#_tpl_status_comment_post').html();
    }
    return this.__postFormTemplateHtml;
  };
  CommentView.template = function(){
    if ( !this.__templateHtml ) {
      this.__templateHtml = $('#_tpl_comment').html();
    }
    return this.__templateHtml;
  };

  CommentView.commentHtml = function(model){
    var user = model.get('user');
    var currentUser = gegedaa.Users.getCurrentUser();
    var html = this.template().replace(/%userlink%/g,  'http://weibo.com/u/' + user.get('id'))
                               .replace(/%username%/g,  user.get('screen_name'))
                               .replace(/%userimage%/g, user.get('profile_image_url'))
                               .replace(/%text%/g,      model.contentHtml())
                               .replace('%time%',       utils.timeParse(model.get('created_at')))
                               .replace('%id%',         model.id);

    if ( currentUser.get('idstr') == user.get('idstr') ) {
      html = html.replace('%delete%', '<div class="delete iconfont">&#xe008;</div>').replace('%reply%', '');
    } else {
      html = html.replace('%delete%', '').replace('%reply%', '<div class="reply iconfont"></div>');
    }

    var commentText, t, who;
    if ( model.get('reply_comment') ) {
      var reply = model.get('reply_comment');
      commentText = reply['text'];

      var userId = reply.user.id;
      if ( userId == currentUser.get('uid') ) {
        who = '我';
      } else {
        who = ' <a class="user-name" data-name="' + reply.user.screen_name + '" href="http://weibo.com/u/' + userId + '">' + reply.user.screen_name + '</a>';
      }

      t = '回复了' + who + '的评论';
    } else {

      var status = model.get('status');
      commentText = status.get('text');

      var userId = status.get('user').get('idstr');
      if ( userId == currentUser.get('uid') ) {
        who = '我';
      } else {
        var name = status.get('user').get('screen_name');
        who = ' <a class="user-name" data-name="' + name + '" href="http://weibo.com/u/' + userId + '">' + name + '</a>';
      }

      t = '评论了' + who + '的微博';
    }

    // 表情转换
    // commentText = commentText.replace(/\[[\u4e00-\u9fa5\w\-]+\]/g, function($0, $1){
    //   var emotion = gegedaa.Emotions.get($0);
    //   if ( emotion ) {
    //     return '<img class="face" src="' + emotion.get('icon') + '">'
    //   }
    //   return $0;
    // });
    var u = currentUser.get('uid') == user.get('id') ? '我' : '<a class="user-name" href="http://weibo.com/u/' + user.get('id') + '" data-name="' + user.get('screen_name') + '">' +
                  user.get('screen_name') + '</a>';

    var summary = u + t + ': <a href="#" class="quote">' + commentText + '</a>';
    html = html.replace('%summary%', summary);
    return html;
  };

  module.exports = CommentView;
});
