define(function(require, exports, module) {
  var bg        = chrome.extension.getBackgroundPage();
  var gegedaa   = bg.gegedaa;

  var $         = require('$');
  var utils        = require('../util/utils');
  var View      = require('../view');

  function isImage(type) {
    switch (type) {
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/jpg':
        return true;
    }
    return false;
  }


  var WritePopup = View.extend({

    constructor: function vWrite(options){
      this.setElement( $( $('#template_write').html() ) );
      View.prototype.constructor.call(this, options);
    },

    initialize: function(opts){

      View.prototype.initialize.call(this, opts);

      var that = this;

      that.$picPreview = that.$('.com-ggd-picture');

      that.$el.on('dragenter', function(e){
        that.$picPreview.addClass('drag-file');
      }).on('dragover', function(e){
        e.stopPropagation();
        e.preventDefault();
      }).on('drop', function(e){
        e.stopPropagation();
        e.preventDefault();
        e = e.originalEvent;
        var files = e.dataTransfer.files;
        // console.info(files);
        var file = files && files[0];
        var type = file.type || 'n/a';
        if ( isImage(type) ) {
          if ( file.size && file.size < 5242880 ) {
            that.readFile(file, true);
          } else {
            RootAlert.open('只支持5M以内的图片', null, {
              hideNoBtn: true
            });
          }
        } else {
          RootAlert.open('只支持图片：jpg, png, gif', null, {
            hideNoBtn: true
          });
        }
      }).on('dragleave', function(e){
        that.$picPreview.removeClass('drag-file');
      });

      that.$postBtn    = that.$('.com-ggd-post');
      that.$text       = that.$('.com-ggd-text').on('keydown', function(e){
        if ( e.keyCode === 13 && (e.ctrlKey || e.metaKey ) ) {
          doPost();
          e.stopImmediatePropagation();
        } else if ( e.keyCode === 13 ) {
          e.preventDefault();
        }
      });

      // bg.console.info(that.options);
      if ( that.options.suggestion ) {
        that.$text.textareaSuggestion({
          list: that.options.suggestion
        });
      }

      that.$counter    = that.$('.com-ggd-text-count');
      that.$userAvatars = that.$('.com-ggd-avater');

      that.$text.on('focus blur', utils.textCount.call(that.$text, that.$counter)).on('webkitAnimationEnd', function(){
        that.$text.removeClass('isempty');
      });

      var $emotions = that.$('.com-ggd-emotions').on('click', '.emo', function(){
        var phrase = $(this).data('phrase');
        var elText = that.$text.focus()[0];
        var text = that.$text.val();
        var index = elText.selectionStart;
        that.$text.val(text.substring(0, index) + phrase + text.substring(index));
        elText.selectionStart = elText.selectionEnd = index + phrase.length;
        $emotions.hide();
      });
      var emotionsInited;
      that.$('.com-ggd-emon').click(function(){
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

      var sogou;

      try {
        sogou = !!sogouExplorer;
      } catch(e){}

      if ( !sogou ) {
        that.$screenShot = that.$('#screenshot').on('change', function(){
          if ( this.checked ) {
            if ( gegedaa.openerWindow ) {
              // console.info(gegedaa.openerWindow);
              chrome.tabs.captureVisibleTab(gegedaa.openerWindow.id, {format:'png'}, function(img){
                // console.info(img);
                var ss = utils.dataURItoBlob(img);
                if ( ss && ss.size > 200 ) {
                  that.imgPreview(img);
                  that.screenShot = ss;
                } else {
                  this.checked = false;
                }
              });
            } else {
              this.checked = false;
            }
          } else {
            that.removeImgPreview();
          }
        });
      } else {
        that.$('#screenshot').parent().remove();
      }

      that.$file = that.$('input[type="file"]').change(function(e){
        var file = this.files && this.files[0];
        if ( file ) {
          that.readFile(file);
        }
      });

      that.$('.com-ggd-close').click(function(){
        that.removeImgPreview();
        return false;
      });

      var users       = gegedaa.Users.getUsers(),
          currentUser = gegedaa.Users.getCurrentUser();

      $.each(users, function(i, val){
        var avatar = $('<img src="' + val.get('profile_image_url') + '" data-id="' + val.get('id') + '" />').click(function(){
          var s = that.getSelectedUsers();
          if ( s.length == 1 && s[0] == val.get('id') ) {
            return false;
          }
          avatar.toggleClass('com-ggd-selected');
        });
        if ( currentUser.get('id') == val.get('id') ) {
          avatar.addClass('com-ggd-selected');
        }
        that.$userAvatars.append(avatar);
      });

      that.$postBtn.click(doPost);
      function doPost(){

        if ( that.posting ) {
          return false;
        }

        var selectedUsers = that.getSelectedUsers();
        if ( !selectedUsers.length ) {
          return false;
        }

        var files = that.$file[0].files,
            len   = files.length,
            txt   = that.$text.val(),
            img;

        if ( !len ) {
          len = !!that.screenShot;
          img = that.screenShot;
        } else {
          img = files[0];
        }

        // 没图片也没文字
        if ( !len && !txt ) {
          that.$text.addClass('isempty');
          return false;
        }

        that.posting = true;
        that.$postBtn.addClass('loading').prop('disable', true);

        var data;

        if ( len ) {
          txt = txt || '分享了图片';
          data = new FormData();
          data.append('status', encodeURIComponent(txt));
          data.append('pic', img);
        } else {
          data = {
            status: txt
          };
          if ( that.picUrl ) {
            data.url = that.picUrl;
          }
        }

        that.trigger('update', {
          type: 'status_update_popup',
          data: data,
          users: selectedUsers
        });

        // bg.console.info(data, files);

      }
    },

    readFile: function(file, blob){
      var that = this;
      var reader = new FileReader();
      reader.onloadend = function(event) {
        reader.onloadend = null;
        var img = event.target.result;
        that.imgPreview(img);
        that.$text.focus();
        if ( blob ) {
          var ss = bg.dataURItoBlob(img);
          that.screenShot = ss;
        }
      };
      reader.readAsDataURL(file);
    },

    setPicUrl: function(url){
      if ( !url ) return;
      this.removeImgPreview();
      this.imgPreview(url);
      this.picUrl = url;
    },

    enable: function(){
      this.posting = false;
      this.$postBtn.removeClass('loading').prop('disable', false);
    },

    // 重置表单
    reset: function(){
      this.$text.val('');
      this.$counter.text(140);
      this.removeImgPreview();
      this.enable();
    },

    getSelectedUsers: function(){
      var userSelected = [];
      this.$userAvatars.find('.com-ggd-selected').each(function(){
        userSelected.push( $(this).attr('data-id') );
      });
      return userSelected;
    },

    setSelectedUsers: function(users){
      var that = this;
      $.each(users, function(){
        that.$userAvatars.find('img[data-id="'+this+'"]').addClass('com-ggd-selected');
      });
    },

    unSelectUser: function(uid){
      this.$userAvatars.find('img[data-id="' + uid + '"]').removeClass('com-ggd-selected');
    },

    imgPreview: function(src){
      if (this.$picPreview) {

        var $img = $('<img class="com-ggd-img">').css({
          'background': 'url(' + src + ') no-repeat center',
          'background-size': 'cover'
        });

        this.$picPreview.addClass('com-ggd-img-preview').append($img);
      }
    },

    removeImgPreview: function(){
      if (this.$screenShot) this.$screenShot.prop('checked', false);
      this.screenShot = null;
      this.picUrl = null;
      this.$picPreview.removeClass('com-ggd-img-preview')
        .find('img').remove();

      var parent = this.$file.parent(),
          form   = $('<form></form>');
      form.append( this.$file );
      form[0].reset();
      parent.append(this.$file);
    }

  });

  module.exports = WritePopup;
});
