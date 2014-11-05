define(function(require, exports, module) {
  var $    = require('$');
  var View = require('../view');

  var UsersSuggestion = View.extend({

    constructor: function GVUserSuggestion(options){
      var that = this;
      this.setElement( $('<div class="user-suggestion">') );
      View.prototype.constructor.call(this, options);
      this.$el.on('click', '.item', function(){
        that.$('.selected').removeClass('selected');
        $(this).addClass('selected');
        var text = that.selected();
        // if ( that.input ) {
          // that.close();
        // }
        that.trigger('item_click', text);
      });
    },

    setCollection: function(collection){
      if (collection)
        this.collection = collection;

      return this;
    },

    setInput: function(input){
      if ( !input ) return;
      this.off('item_click');
      this.input = input;
      return this;
    },

    search: function(text){
      var users;
      if ( text ) {
        users = this.collection.search(text).slice(0, 10);
      } else {
        users = this.collection.models.slice(0, 10);
      }
      this.resultCount = (users && users.length) || 0;
      this._createResult(users);
      this._position();
      return this;
    },

    next: function(){
      var $selected = this.$('.selected');
      var $next = $selected.next();
      $selected.removeClass('selected');
      if ( !$next.length ) $next = this.$('.item').first();
      $next.addClass('selected');
      this._postionItem($next);
      return this;
    },

    prev: function(){
      var $selected = this.$('.selected');
      var $prev = $selected.prev();
      if ( !$prev.length ) $prev = this.$('.item').last();
      $selected.removeClass('selected');
      $prev.addClass('selected');
      this._postionItem($prev);
      return this;
    },

    selected: function(){
      var $selected = this.$('.selected');
      if ( $selected.length ) {
        return $selected.data('name');
      }
      return '';
    },

    _postionItem: function(selected){
      var height = this.$el.height(), scrollTop = this.$el.scrollTop();
      var top = selected.position().top;
      // console.info(scrollToptop,);
      if ( top < 0 || top >= height ) {
        this.$el.scrollTop( scrollTop + top );
      }
      return this;
    },

    _createResult: function(users){
      var html = '';
      if ( !users || !users.length ) {
        // html = '<div></div>';
      } else {
        $.each(users, function(i){
          html += '<div class="clearfix item' + ( i == 0 ? ' selected' : '' ) + '" data-name="' + this.get('screen_name') +
          '"><img src="' + this.get('profile_image_url') + '">@' + this.get('screen_name') + ( this.get('remark') ? ' (' + this.get('remark') + ')' : '' ) + '</div>'
        });
      }
      this.$el.empty();
      if ( html ) {
        this.$el.html(html);
      } else {
        this.close();
      }
    },

    open: function(css){
      if ( !this.opened ) {
        this.$el.css(css).show();
        this.opened = true;
      } else if (css) {
        this.$el.css(css);
      }
      return this;
    },

    _position: function(){
      var $win   = $(window),
          width  = $win.width(),
          height = $win.height();

      var offset = this.$el.offset(),
          selfWidth = this.$el.width(),
          css = {};

      if ( offset.left + selfWidth > width ) {
        css['left'] = width - selfWidth;
      }

      if ( height - offset.top < 100 ) {
        css['top'] = height - 100;
      }

      if ( !$.isEmptyObject(css) ) this.$el.css(css);
    },

    close: function(){
      if ( this.opened ) {
        this.$el.hide();
        this.opened = false;
      }
      return this;
    }
  });

  module.exports = UsersSuggestion;

});
