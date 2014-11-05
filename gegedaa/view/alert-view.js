define(function(require, exports, module) {

  var $        = require('$');
  var View     = require('../view');

  var AlertView = View.extend({

    constructor: function GVAlertView(options){
      var that = this;

      that.$overlay = $('#g-alert-view');

      if ( !that.$overlay.length ) {
        that.$overlay = $('<div class="alert-box" id="g-alert-view"></div>').appendTo('body');
      }

      that.setElement(
        $('<div class="alert-box-inner">' +
            '<p class="text"></p>' +
            '<a class="yes" href="#">确认</a>' +
            '<a class="no" href="#">取消</a>' +
          '</div>')
      );

      that.$btnYes  = that.$('.yes').click(function(){
        that.callback && that.callback.call(that, true);
        that.dismiss();
        return false
      });

      that.$btnNo   = that.$('.no').click(function(){
        that.callback && that.callback.call(that, false);
        that.dismiss();
        return false
      });

      that.$message = that.$('.text');

      View.prototype.constructor.call(that, options);
    },

    setMessage: function(message){
      this.$message.html( message );
    },

    dismiss: function(){
      if ( this.previousAlertView ) {
        AlertView.currentAlertView = this.previousAlertView;
        AlertView.currentAlertView.$el.show();
      } else {
        this.$overlay.hide();
        AlertView.currentAlertView = null;
      }

      this.remove();
    },

    show: function( message, callback, options ) {
      this.showInView($('body'), message, callback, options);
    },

    showInView: function( superview, message, callback, options ){

      options = options || {};
      superview = superview ? $(superview) : $('body');

      this.setMessage(message);

      this.callback = callback;

      if ( options.yesText ) {
        this.$btnYes.text(options.yesText);
      } else {
        this.$btnYes.text('确认');
      }

      if ( options.hideBtnNo ) {
        this.$btnNo.hide();
      } else {
        this.$btnNo.show();
      }

      if ( options.hideBtnYes ) {
        if ( this.callback ) {
          this.callback.call(this);
          this.$btnYes.hide();
        } else {
          this.$btnYes.hide();
        }
      } else {
        this.$btnYes.show();
      }

      if ( options.type ) {
        this.$el.addClass(options.type + '-box');
      }

      if ( AlertView.currentAlertView ) {
        this.previousAlertView = AlertView.currentAlertView;
        AlertView.currentAlertView.$el.hide();
      }

      this.$overlay.append(this.$el).appendTo(superview).show();
      AlertView.currentAlertView = this;

      var height = this.$el.height();
      this.$el.css('margin-top', -Math.ceil(height / 2));
      return this;
    }

  });

  module.exports = AlertView;

});
