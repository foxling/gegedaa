define(function(require, exports, module) {

  var $ = require('$');
  var utils = require('./utils');

  if (!$.fn.autosize) {
    $.fn.autosize = function(){
      var measurer;
      return this.each(function(){
        var $text = $(this);
        var timer;
        $text.on('focus', function(){
          clearInterval(timer);
          timer = setInterval(check, 30);
        }).on('blur', function(){
          clearInterval(timer);
          check();
        });

        var lastText;
        function check(){
          if ( !measurer ) {
            measurer = createCloner($text);
            $('body').append(measurer);
          }
          var text = $text.val();
          if ( text != lastText ) {
            lastText = text;
            measurer.text(text);
            $text.height(measurer.height());
          }
        }

      });
    };
  }

  if ( $.fn.textareaSuggestion ) return;

  function cloneStyle(textarea){
    var css = {};
    css['word-spacing'] = textarea.css('word-spacing');
    css['line-height'] = textarea.css('line-height');
    css['padding'] = textarea.css('padding');
    css['font-size'] = textarea.css('font-size');
    css['font-family'] = textarea.css('font-family');
    css['word-wrap'] = textarea.css('word-wrap');
    css['white-space'] = 'pre-wrap';
    css['box-sizing'] = 'box-sizing';
    css['width'] = textarea.width() + 'px';
    return css;
  }

  function createCloner(textarea){
    var css = cloneStyle(textarea);
    var $div = $('<div>').css($.extend(css, {
      position: 'absolute',
      left: '-9999px',
      top: '-9999px'
    }));
    $('body').append($div);
    return $div;
  }

  $.fn.textareaSuggestion = function(options){

    options = options || {};

    var list = options.list;

    var matchText;

    return this.each(function(){

      var $textarea = $(this),
          el = this,
          timer;

      $textarea.on('focus', function(){
        clearInterval(timer);
        matchText = '';
        timer = setInterval(checkText, 30);
        list.close().setInput($textarea);
        list.on('item_click', function(name){
          $textarea.focus();
          select(name);
          utils.moveCursorToEnd($textarea[0]);
        });
      }).on('blur', function(){
        clearInterval(timer);
        // list.close();
      }).keydown(function(e){
        var key = e.keyCode;
        if ( list.opened && ' 38 40 13 '.indexOf(' ' + key + ' ') > -1 ) {
          e.preventDefault();
          switch (key) {
            case 13:
              select(list.selected());
              list.close();
              break;

            case 38:
              list.prev();
              break;

            case 40:
              list.next();
              break;
          }
        }
      });

      function select(name){
        var val = $textarea.val(), len = val.length;
        if ( name && len ) {
          var text = val.substring(0, el.selectionStart), afterText = val.substring(el.selectionStart);
          text = text.replace(/@([^\s]*)$/, '@' + name + ' ');
          $textarea.val( text + afterText );
        }
      }

      function checkText(){
        var val = $textarea.val(), len = val.length;
        if ( len ) {
          var text = val.substring(0, el.selectionStart);
          var m = text.match(/@([^\s]*)$/);
          if ( m && m.length && m[1] != '' ) {
            if ( m[1] != matchText ) {
              // bg.console.info(m[1], '=', matchText);
              var $cloner = el['cloner'];
              if ( !$cloner ) {
                $cloner = el['cloner'] = createCloner($textarea);
              }
              $cloner.text(text).append('<span>');

              var offset = $textarea.offset(), position = $('span', $cloner).position();
              var cursorOffset = {
                left: offset.left + position.left,
                top: offset.top + position.top
              };
              list.open({
                left: cursorOffset.left + 10,
                top: cursorOffset.top
              }).search(m[1]);
            }
            matchText = m[1];
            // options.callback && options.callback(m[1], cursorOffset);
          } else {
            matchText = '';
            list.close();
            // options.callback && options.callback(false);
          }
        } else {
          matchText = '';
          list.close();
        }
      }
    });

  };
});
