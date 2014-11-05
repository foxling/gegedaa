define(function(require, exports, module) {
  var bg            = chrome.extension.getBackgroundPage();
  var gegedaa       = bg.gegedaa;

  var $             = require('$');
  var _             = require('_');
  var View          = require('../view');
  var StatusWrapper = require('./status-wrapper');

  var StatusViewer = View.extend({

    tagName: 'div',

    attributes: {
      'class': 'status-viewer'
    },

    initialize: function GVStatusViewer(options){
      View.prototype.initialize.call(this, options);

      var that = this;

      this.$content = $('<div class="content"></div>');
      this.$el.append(this.$content).click(function(e){
        if ( e.target == that.$el[0] ) {
          that.hide();
        }
      });

      $('<div class="close-btn"></div>').click(function(){
        that.hide();
      }).appendTo(this.$content);

      that.$el.on('click', '.at-username, .user-show', function(){
        that.hide();
      });
    },

    show: function(model){
      if ( this.statusView ) {
        this.statusView.remove();
      }

      this.model = model;
      this.statusView = new StatusWrapper({
        model: model
      });

      this.$content.append(this.statusView.$el);
      this.$el.appendTo('body').show();

      this.statusView.showComments(model, true);
      this.update();
    },

    hide: function(){
      this.$el.hide();
      this.statusView && this.statusView.remove();
      this.statusView = null;
    },

    update: function(){
      var user = gegedaa.Users.getCurrentUser();
      var that = this;
      if ( user && this.model ) {
        var client = gegedaa.Clients.getClient(user);
        client.statuses_show({
          id: this.model.id
        }, function(result){
          if ( that.statusView ) {
            // console.info(result);
            that.model.set({
              attitudes_count: result.attitudes_count,
              comments_count: result.comments_count,
              favorited: result.favorited,
              reposts_count: result.reposts_count
            }, {parse: true});
          }
        }, function(){

        });
      }
    }
  });

  module.exports = StatusViewer;
});
