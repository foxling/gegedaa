// events change, refresh
define(function(require, exports, module) {

  var $         = require('$');
  var View      = require('./view');

  var NavBarBase = View.extend({

    initialize: function GVNavBarBase(options){
      var that = this;
      View.prototype.initialize.call(that, options);
      this.items = $();
    },

    setSelectedItem: function(index, norefresh){
      if ( index === -1 ) {
        this.items.eq(this.activeIndex).removeClass('active');
        this.activeIndex = index;
        return this;
      }

      if (index !== this.activeIndex) {
        this.items.eq(this.activeIndex).removeClass('active');
        this.activeIndex = index;
        this.items.eq(index).addClass('active');
        this.trigger('change', index);
      } else if (!norefresh) {
        this.trigger('refresh', index);
      }
      return this;
    }

  });

  module.exports = NavBarBase;

});
