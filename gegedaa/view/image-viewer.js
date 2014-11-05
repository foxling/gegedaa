define(function(require, exports, module) {
  var $    = require('$');
  var _    = require('_');
  var View = require('../view');

  var ImageViewer = View.extend({

    tagName: 'div',

    attributes: {
      'class': 'image-viewer'
    },

    constructor: function GCVImageViewer(options){
      View.prototype.constructor.call(this, options);
    },

    remove: function(){
      if ( this.urls && this.urls.length > 0 ) {
        $.each(this.urls, function(){
          window.webkitURL.revokeObjectURL(this);
        });
      }
      View.prototype.remove.call(this);
      return this;
    },

    initialize: function(options){

      var that = this;

      that.urls = [];

      View.prototype.initialize.call(that, options);

      that.$el.append( $('#template_image_viewer').html() ).click(function(){
        that.hide();
      });

      that.$img = that.$('.img').on('click', 'img', function(e){
        e.stopPropagation();
        e.preventDefault();
        that._clickImg();
      });
      that.$left = that.$('.left').on('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        that.index -= 1;
        that._displayPic();
      });
      that.$right = that.$('.right').on('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        that.index += 1;
        that._displayPic();
      });

      that.$original = that.$('.original').on('click', function(e){e.stopPropagation()});
      that.$save = that.$('.save');

      if (!window.webkitURL || !window.webkitURL.createObjectURL) {
        console.info('没有这个方法：webkitURL.createObjectURL');
        that.$save.hide();
      } else {
        console.info('webkitURL.createObjectURL 支持');
        that.$save.click(function(e){
          e.stopPropagation();
          e.preventDefault();

          var src = that.$original.attr('href');
          var filename = src.substring(src.lastIndexOf("/") + 1);

          var xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.onload = function() {
            // xhr.response is a Blob
            var url = window.webkitURL.createObjectURL(xhr.response);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;

            that.urls.push(a);

            var e = document.createEvent('MouseEvents');
            e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            // window.webkitURL.revokeObjectURL(url);
          };
          xhr.open('GET', src);
          xhr.send();
          return false;
        });
      }

      try {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
      } catch (e) {
        console.info('XMLHttpRequest 不支持 blob type');
        that.$save.hide();
      }

    },

    _clickImg: function(){
      if ( this.pics.length > 1 ) {
        if ( this.index >= this.pics.length - 1 ) {
          this.hide();
        } else {
          this.index += 1;
          this._displayPic();
        }
      } else {
        this.hide();
      }
    },

    _displayPic: function(){
      var that  = this;

      if ( that.index < 0 ) that.index = 0;
      if ( that.index > that.pics.length - 1 ) that.index = that.pics.length - 1;

      that.$img.scrollTop(0).empty();

      var index = that.index;
      var pic   = that.pics[index];

      var $img = $('<img>');
      $img.on('load', function(){
        var imgWidth  = $img[0].naturalWidth;
        var imgHeight = $img[0].naturalHeight;

        var width = that.$img.width();
        var height = that.$img.height();

        if ( imgWidth < width && imgHeight < height ) {
          $img.css({
            position: 'absolute',
            left: (width  - imgWidth ) / 2,
            top:  (height - imgHeight) / 2
          });
        }
      }).attr('src', pic);

      that.$img.append($img);

      that.$original.attr('href', pic.replace('/bmiddle/', '/large/'));

      that.$left.css({
        'background-image': index > 0 ? 'url(' + that.pics[index-1] + ')' : 'none',
        'visibility': index > 0 ? 'visible' : 'hidden'
      });

      that.$right.css({
        'background-image': index < that.pics.length - 1 ? 'url(' + that.pics[index+1] + ')' : 'none',
        'visibility': index < that.pics.length - 1 ? 'visible' : 'hidden'
      });
    },

    open: function(index, pics){
      var that = this;

      if ( !pics || !pics.length ) return;

      that.index = index;
      that.pics  = pics;

      that._displayPic();

      if ( that.opened ) {
        that.hide();
      }

      that.show();

      return this;
    },

    show: function(){
      this.$el.addClass('opened');
      this.opened = true;
      return this;
    },

    hide: function(){
      // chrome bug
      this.$img.scrollTop(0).empty();
      this.$el.removeClass('opened');
      this.opened = false;
      return this;
    }
  });

  module.exports = ImageViewer;
});
