define(function(require, exports, module) {

  var bg          = chrome.extension.getBackgroundPage();
  var gegedaa     = bg.gegedaa;

  var $           = require('$');
  var utils       = require('./util/utils');
  var View        = require('./view');
  var UsersStatus = require('./users-status');
  var App         = require('./ggd-app');

  var PostPanel = View.extend({

    initialize: function GPostPanel(options){
      var that = this;
      View.prototype.initialize.call(that, options);
      that.setElement( $( $('#_tpl_post_panel').html() ) );

      that.$postButton = that.$('.post').on('click', function(){
        that.post();
      });

      that.$text = that.$('.text');
      that.$textCounter = that.$('.text-count');
      that.$text.on('focus blur', utils.textCount.call(that.$text, that.$textCounter, function(len, text){})).on('blur', function(){
        UsersStatus.set(null, 'statusText', that.$text.val());
      }).keydown(function(e){
        e.stopPropagation();
        var key = e.keyCode;
        if ( ' 27 13 '.indexOf(' ' + key + ' ') > -1 ) {
          e.preventDefault();
        }
        if ( key === 27 ) {
          that.close();
        } else if ( key === 13 && (e.ctrlKey || e.metaKey ) ) {
          that.post();
          e.stopImmediatePropagation();
        }
      });

      that.$file = that.$('input[type="file"]');

      if ( App.windowMode == 'popup' ) {
        that.$('.link').click(function(){
          chrome.tabs.getSelected(null, function(tab){
            var txt = that.$text.val();
            utils.shortUrlFromTab(tab, function(tabInfo){
              that.$text.val( txt ? txt + ' ' + tabInfo + ' ' : tabInfo);
              utils.moveCursorToEnd(that.$text[0]);
            });
          });
        });

        that.$('.picture').click(function(){
          var text = that.$text.val();
          var selectedUsers = that.userSelector ? that.userSelector.selectedUsers() : null;

          chrome.windows.getCurrent(function(_window){
            gegedaa.openerWindow = _window;
          });

          gegedaa.popupWrite({
            txt: text,
            from_post_panel: true
          }, selectedUsers);
        }).find('input').remove();
      } else {
        that.$('.link').hide();
        that.$file.change(function(e){
          var file = this.files && this.files[0];
          if ( file ) {
            that.readFile(file);
          }
        });
        that.$('.upload-pic .remove').on('click', function(){
          that.removeImg();
        });
      }

      if ( UsersStatus.get(null, 'statusText') ) {
        that.$text.val(UsersStatus.get(null, 'statusText'));
      }

      var emotionsInited;
      that.$emotions = that.$('.emotions').on('click', '.emo', function(){
        var phrase = $(this).data('phrase');
        var elText = that.$text.focus()[0];
        var text = that.$text.val();
        var index = elText.selectionStart;
        that.$text.val(text.substring(0, index) + phrase + text.substring(index));
        elText.selectionStart = elText.selectionEnd = index + phrase.length;
        that.$emotions.hide();
      });
      that.$('.emon').on('click', function(){
        if ( !emotionsInited ) {
          var emotionsHtml = '';
          gegedaa.Emotions.each(function(model){
            emotionsHtml += '<img class="emo" src="' + model.get('url') + '" data-phrase="' + model.get('phrase') + '">';
          });
          that.$emotions.html(emotionsHtml);
          emotionsInited = true;
        }
        that.$emotions.toggle();
      });
    },

    setSuggestionView: function(v){
      this.$text.textareaSuggestion({
        list: v
      });
    },

    readFile: function(file, blob){
      var that = this;
      var reader = new FileReader();
      reader.onloadend = function(event) {
        reader.onloadend = null;
        var img = event.target.result;
        that.previewImg(img);
        that.$text.focus();
      };
      reader.readAsDataURL(file);
    },

    previewImg: function(img){
      this.$('.upload-pic .pic').css('background-image', 'url(' + img + ')');
      this.$el.addClass('has-pic');
    },

    removeImg: function(){
      this.$('.upload-pic .pic').css('background-image', 'none');
      this.$el.removeClass('has-pic');
      this.resetPicInput();
      this.$text.focus();
    },

    open: function(){
      this.$el.addClass('opened');
      this.$text.focus();
      $('#post-panel-overlayer').show();
      this.opened = true;
      this.trigger('open');
    },

    close: function(){
      this.$emotions.hide();
      this.$el.removeClass('opened');
      this.$text.blur();
      this.opened = false;
      $('#post-panel-overlayer').hide();
      this.trigger('close');
    },

    toggle: function(){
      if (this.opened) {
        this.close();
      } else {
        this.open();
      }
    },

    reset: function(){
      this.$textCounter.text('140');
      this.$text.val('');
      this.$postButton.removeClass('loading').prop('disable', false);
      this.removeImg();
    },

    resetPicInput: function(){
      var parent = this.$file.parent(),
          form   = $('<form></form>');
      form.append(this.$file);
      form[0].reset();
      parent.append(this.$file);
    },

    postComplete: function(){
      this.reset();
      this.close();
    },

    post: function(){
      var that  = this;
      var files = that.$file[0].files,
          len   = files.length,
          txt   = this.$text.val(),
          img;

      if ( len > 0 ) {
        img = files[0];
      }

      if ( !img && !txt ) return;

      that.$postButton.addClass('loading').prop('disable', true);

      var data;

      if ( img ) {
        txt = txt || '分享了图片';
        data = new FormData();
        data.append('status', encodeURIComponent(txt));
        data.append('pic', img);
      } else {
        data = {
          status: txt
        };
      }

      var users;

      if ( that.userSelector ) {
        users = that.userSelector.selectedUsers();
      }

      if ( !users || !users.length ) {
        users = [gegedaa.Users.getCurrentUser()];
      }

      this.trigger('new_status', users, data);
    }
  });

  module.exports = new PostPanel();
});
