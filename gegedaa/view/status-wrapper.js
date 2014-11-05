define(function(require, exports, module) {

  var Backbone   = require('backbone');
  var $          = require('$');
  var View       = require('../view');
  var Status     = require('./status');
  var AlertView  = require('./alert-view');

  var Comments   = require('./comments-list');
  var Reposts    = require('./reposts-timeline');

  var StatusWrapper = View.extend({

    initialize: function GVStatusWrapper(options){
      View.prototype.initialize.call(this, options);
      this.render();
    },

    className: 'item-wrapper',

    remove: function(){
      this.reposts && this.reposts.remove();
      this.comments && this.comments.remove();
      View.prototype.remove.call(this);
    },

    commentsWillRemove: function(){
      var $next = this.$el.next();
      if ( $next && $next.length ) {
        this.nextItemTop = $next.position().top;
      }
    },

    commentsDidRemove: function(){
      if (!this.nextItemTop) return;

      var $scroller = this.$el.parents('.card-content');
      var $next = this.$el.next();
      var top = $scroller.scrollTop();

      if ( $next && $next.length ) {
        var newTop = top - parseInt(this.nextItemTop - $next.position().top);
        $scroller.scrollTop(newTop);
      }
      this.nextItemTop = 0;
    },

    destroy: function(model){
      var that = this;
      var alert = new AlertView();
      alert.showInView(that.$el, '确认删除该微博？', function(result){
        if (result && model.client ) {
          model.client.destroy({
            id: model.get('idstr')
          }, function(){
            that.model.collection.remove(that.model);
            that.$el.slideUp(100, function(){
              that.remove();
            });
          });
        }
      });
    },

    render: function(){
      var that = this;
      if ( !that.rendered ) {

        var model = that.model;

        var s = new Status({
          model: model
        }).on('comment', function(){
          that.showComments(model);
        }).on('repost', function(){
          that.showReposts(model);
        }).on('delete', function(m){
          that.destroy(m);
        });

        that.addChild(s);

        // 如果有转载内容
        var rt = model.get('retweeted_status');
        if ( rt ) {
          var rtView = new Status({
            model: rt,
            isRT: true
          }).on('comment', function(){
            that.showComments(rt);
          }).on('repost', function(){
            that.showReposts(rt);
          }).on('delete', function(m){
            that.destroy(m);
          });

          s.$('.w-item-content').after(rtView.$el);
          that.children.push(rtView);
          // that.addChild(rtView);
          that.$el.addClass('has-rt');
        }
      }

      View.prototype.render.call(this);
    },

    showComments: function(model, nofocus){
      var that = this;

      if ( that.reposts ) {
        that.reposts.remove();
      }

      var show = true;

      if ( that.comments ) {
        if ( that.comments.statusModel == model ) {
          show = false;
        }
        that.comments.remove();
      }

      if ( show ) {
        that.comments = new Comments({
          status: model,
          textareaFocus: !nofocus
        }).on('willremove', function(){
          that.commentsWillRemove();
        }).on('didremove', function(){
          that.comments = null;
          that.commentsDidRemove();
        });

        that.$el.append(that.comments.$el);
        that.comments.render();
      }
    },

    showReposts: function(model){
      var that = this;

      if ( that.comments ) {
        that.comments.remove();
      }

      var show = true;
      if ( that.reposts ) {
        if ( that.reposts.statusModel == model ) {
          show = false;
        }
        that.reposts.remove();
      }

      if ( show ) {
        that.reposts = new Reposts({
          status: model
        }).on('willremove', function(){
          that.commentsWillRemove();
        }).on('didremove', function(){
          that.reposts = null;
          that.commentsDidRemove();
        });
        that.$el.append(that.reposts.$el);
        that.reposts.render();
      }
    }
  });

  module.exports = StatusWrapper;
});
