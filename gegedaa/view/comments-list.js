define(function(require, exports, module) {
  var bg           = chrome.extension.getBackgroundPage();
  var gegedaa      = bg.gegedaa;
  var Backbone     = require('backbone');
  var _            = require('_');
  var $            = require('$');
  var View         = require('../view');
  var CommentsShow = require('../collection/comments-show');
  var utils        = require('../util/utils');
  var CommentForm  = require('./comment-form');
  var AlertView    = require('./alert-view');

  var CommentsList = View.extend({

    initialize: function GVCommentsList(options){
      var that = this;
      that.setElement( $($('#_tpl_status_comments').html()) );
      View.prototype.initialize.call(that, options);
      that.statusModel = options.status;
      that.type = 'comment';
      that.textareaFocus = options.textareaFocus;

      that.$el.on('click', '.reply', function(){
        // console.info($(this).parent().data('id'));
        var id = $(this).parent().data('id');
        if ( id ) {
          var model = that.collection.get(id);
          if ( model ) {
            if ( that.type === 'comment' ) {
              that.postForm.comment_to = id;
              that.postForm.$text.val( '回复 @' + model.get('user').get('screen_name') + ': ');
              utils.moveCursorToEnd(that.postForm.$text[0]);
            } else {
              that.postForm.$text.val( '//@' + model.get('user').get('screen_name') + ': ' + model.get('text') ).focus();
            }
          }
        }
      }).on('click', '.delete', function(){
        var $commentView = $(this).parent();
        var alert = new AlertView();
        alert.showInView($commentView, '确认删除该评论？', function(result){
          if (result) {
            var currentUser = gegedaa.Users.getCurrentUser();
            var client = gegedaa.Clients.getClient(currentUser);
            var id = $commentView.data('id');
            if ( client && id ) {
              client.comment_destroy({cid: id}, function(){
                $commentView.remove();
              });
            }
          }
        });
      });
    },

    remove: function(){
      this.collection.off();
      if ( this.postForm ) this.postForm.remove();

      this.$el.remove();
      this.trigger('didremove');

      View.prototype.remove.call(this);
    },

    _template: function(){
      if ( !this.__templateHtml ) {
        this.__templateHtml = $('#_tpl_status_comment').html();
      }
      return this.__templateHtml;
    },

    _commentHtml: function(model){
      var user = model.get('user');
      var currentUser = gegedaa.Users.getCurrentUser();
      var html = this._template().replace(/%userlink%/g, 'http://weibo.com/u/' + user.get('id'))
                                     .replace(/%username%/g,   user.get('screen_name'))
                                     .replace(/%userimage%/g, user.get('profile_image_url'))
                                     .replace(/%text%/g,      model.contentHtml())
                                     .replace('%delete%', currentUser.get('idstr') == user.get('idstr') ? '<div class="delete iconfont">&#xe008;</div>' : '')
                                     .replace('%reply%', currentUser.get('idstr') != user.get('idstr') ? '<div class="reply iconfont"></div>' : '');
      return html.replace(/%time%/g, utils.timeParse(model.get('created_at'))).replace('%id%', model.id);
    },

    load: function(){
      if ( this.collection ) {
        this.collection.load();
        this.$moreBtn.addClass('loading');
      }
    },

    _configPostForm: function(){
      var that = this;
      this.postForm = new CommentForm({
        status: this.statusModel,
        type: 'comment'
      }).on('commented', function(data){
        console.info(data);
        that.collection.add([data], {parse:true});
      }).on('reposted', function(data){ // 同时转发的话
        that.collection.add([data], {parse:true});
      });
      this.$el.prepend(this.postForm.$el);

      if (this.textareaFocus)
        this.postForm.$text.focus();
    },

    _configCollection: function(){
      var that = this;
      if ( !this.collection ) {
        this.collection = new CommentsShow(null, {
          client: this.statusModel.client,
          statusId: this.statusModel.id
        });
      }
      return this.collection;
    },

    render: function(){
      var that = this;
      if ( !that.rendered ) {

        this._configPostForm();

        that.$list = this.$('.comments');

        that.$moreBtn = this.$('.comments-pages .more').on('click', function(){
          if ( that.$moreBtn.hasClass('nomore') ) return false;
          that.load();
          return false;
        });

        that.$closeBtn = this.$('.comments-pages .close').on('click', function(){
          that.trigger('willremove');
          that.remove();
          return false;
        });

        that._configCollection().on('loaded', function(models){

          if ( models && models.length > 0 ) {
            var html = '';
            _.each(models, function(model){
              html += that._commentHtml(model);
            });
            that.$list.append(html);
          }

          that.$moreBtn.removeClass('loading');
          if ( !models || models.length == 0 ) {
            that.$moreBtn.addClass('nomore').text('没有更多了');
          }
        }).on('add', function(model){
          var html = that._commentHtml(model);
          that.$list.prepend(html);
        });

        that.load();
      }

      View.prototype.render.call(this);
    }
  });

  module.exports = CommentsList;
});
