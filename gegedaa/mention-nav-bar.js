// events change, refresh
define(function(require, exports, module) {
  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;
  var Unread    = bg.gegedaa.Unread;

  var $         = require('$');
  var NavBarBase= require('./nav-bar-base');

  var MentionNavBar = NavBarBase.extend({

    initialize: function(options){
      var that = this;
      that.setElement($($('#_tpl_mention_menu').html()));
      NavBarBase.prototype.initialize.call(that, options);

      that.items = that.$('.item');
      that.items.each(function(i){
        $(this).on('click', function(e){
          e.preventDefault();
          that.setSelectedItem(i);
        });
      });

      Unread.on('countupdated', function(){
        that.updateNoticeCount();
      }, that);

      that.updateNoticeCount();
    },

    remove: function(){
      Unread.off(null, null, this);
      NavBarBase.prototype.remove.call(this);
    },

    updateNoticeCount: function(){
      var user  = gegedaa.Users.getCurrentUser();
      if ( user ) {
        var $items = this.items;

        this._setNoticeCount($items.eq(0).find('.notice'), Unread.get(user, 'mention_status'));
        this._setNoticeCount($items.eq(1).find('.notice'), Unread.get(user, 'mention_cmt'));
        this._setNoticeCount($items.eq(2).find('.notice'), Unread.get(user, 'cmt'));
        this._setNoticeCount($items.eq(4).find('.notice'), Unread.get(user, 'dm'));
      }
    },

    _setNoticeCount: function(el, count){
      if ( !el ) return;
      if ( count ) {
        el.text(count).attr('title', count).show();
      } else {
        el.hide();
      }
    }

  });

  module.exports = MentionNavBar;
});
