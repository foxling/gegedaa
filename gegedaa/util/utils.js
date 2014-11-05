define(function(require, exports, module) {
  var _ = require('_');
  var $ = require('$');
  var global = require('../global');

  var utils = {

    textCount: function(counter, callback){
      var handler, lasterText, that = this;
      return function(e){
        switch (e.type) {
          case 'focus':
            if ( !handler ) {
              handler = setInterval(function(){
                var txt = that.val();
                if (txt == lasterText){
                  // 与上一次文字相同时，避免后面的dom修改
                  return;
                }
                var len = 140 - Math.ceil( utils.getTextByteLen(txt) / 2 );
                if ( counter ) {
                  counter.text(len);
                  if (len < 0) {
                    counter.addClass('overflow');
                  } else {
                    counter.removeClass('overflow');
                  }
                }
                callback && callback(txt.length, txt);
              }, 30);
            }
            break;
          case 'blur':
            clearInterval(handler);
            handler = null;
            break;
        }
      };
    },

    moveCursorToEnd: function(input){
      if ( !input ) return;

      var len = input.value.length;

      input.focus();

      if (document.selection) {
        var sel = input.createTextRange();
        sel.moveStart('character', len);
        sel.collapse();
        sel.select();
      } else if (
        typeof input.selectionStart == 'number' &&
        typeof input.selectionEnd   == 'number') {

        input.selectionStart = input.selectionEnd = len;
      }

    },

    //
    // 补位，比如日期 9 变成 09
    // @param {mixed} num  需要补位的数字或者字符串，一般是数字
    // @param {int}   n    需要补成几位
    // @return {string}    返回一个字符串

    pad: function(num, n) {
      var len = num.toString().length;
      while (len < n) {
        num = '0' + num;
        len++;
      }
      return num.toString();
    },

    formatStatus: function(str){
      if ( !str ) return str;
      var replaced = this.url2link(str.replace('<', '&lt;').replace('>', '&gt;'));
      replaced = replaced.replace(/(@)([\u4e00-\u9fa5\w\-]+)/ig,
                  '<a href="http://weibo.com/n/$2" class="at-username" target="_blank">$&</a>');
      // [\u4E00-\u9FA5]|[\uFE30-\uFFA0]
      // return replaced.replace(/#([_\u4e00-\u9fa5\w\-\s]+)#/ig, '<a href="http://s.weibo.com/weibo/$1" target="_blank" class="tag-link">$&</a>');

      var tags = replaced.match(/#([^#@]+)#/ig);
      if ( tags && tags.length > 0 ) {
        var i = 0, len = tags.length, tag;
        for ( i = 0; i < len; i++ ) {
          tag = tags[i];
          replaced = replaced.replace(tag, '!!!' + i + '!!!');
        }
        for ( i = 0; i < len; i++ ) {
          tag = tags[i];
          replaced = replaced.replace('!!!' + i + '!!!', '<a href="http://huati.weibo.com/k/' + encodeURIComponent(tag.replace(/#/g, '')) + '" target="_blank" class="tag-link">' + tag + '</a>');
        }
      }
      return replaced;
    },

    // url、tag 转换为a标签
    url2link: function(str){
      // return str;
      //``http://cps.youku.com/redirect.html?id=000002bc&url=http://v.youku.com/v_show/id_XNDkwMjEzMDU2.html``645``

      var regx = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/ig
      // var regx = /(http|ftp|https):\/\/[^\s]+/ig;
      var links = str.match(regx);
      if ( links && links.length > 0 ) {
        var i, len = links.length, link;
        for ( i = 0; i < len; i++ ) {
          link = links[i];
          str = str.replace(link, '***' + i + '***');
        }
        for ( i = 0; i < len; i++ ) {
          link = links[i];
          str = str.replace('***' + i + '***', '<a href="' + link + '" class="content-link bg-link" target="_blank">' + link + '</a>');
        }
      }

      return str;
    },

    getTextByteLen: function(text){
      if ( !text ) return 0;
      var cArr = text.match(/[^\x00-\xff]/ig);
      return text.length + (cArr == null ? 0 : cArr.length);
    },

    dateStr: function(d){
      var dateStr = this.pad((d.getMonth()+1),2) + '-' +
                                    this.pad(d.getDate(),2) + ' ' +
                                    this.pad(d.getHours(),2) + ':' + this.pad(d.getMinutes(),2);

      if ( d.getFullYear() != (new Date).getFullYear() ) {
        dateStr = d.getFullYear() + '-' + dateStr;
      }
      return dateStr;
    },

    timeParse: function(timeString){
      var t = Date.parse(timeString);
      if ( !t ) {
        return '';
      }
      var now = new Date(), diff = (now.valueOf() - t) / 1000;
      var datetime = new Date(t);

      if ( datetime.getFullYear() == now.getFullYear() && datetime.getMonth() == now.getMonth() ) {

        if ( datetime.getDate() == now.getDate() ) {
          if (diff < 60) {
            return '刚刚';
          } else if( diff < 3600 ) {
            return Math.floor(diff / 60) + '分钟前';
          } else {
            return '今天 ' + this.pad(datetime.getHours(),2) + ':' + this.pad(datetime.getMinutes(),2);
          }
        } else if ( now.getDate() - datetime.getDate() == 1 ) {
          return '昨天 ' + this.pad(datetime.getHours(),2) + ':' + this.pad(datetime.getMinutes(),2);
        } else {
          return this.dateStr(datetime);
        }
      }

      return this.dateStr(datetime);
    },

    //
    // 补位，比如日期 9 变成 09
    // @param {mixed} num  需要补位的数字或者字符串，一般是数字
    // @param {int}   n    需要补成几位
    // @return {string}    返回一个字符串
    pad: function (num, n) {
      var len = num.toString().length;
      while (len < n) {
        num = '0' + num;
        len++;
      }
      return num.toString();
    }
  };

  // 新浪微博mid与url互转实用工具, 作者: XiNGRZ (http://weibo.com/xingrz)

  var WeiboUtility = {};

  // 62进制字典

  WeiboUtility.str62keys = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
  ];

  //
  // 62进制值转换为10进制
  // @param {String} str62 62进制值
  // @return {String} 10进制值

  WeiboUtility.str62to10 = function(str62) {
    var i10 = 0;
    for (var i = 0; i < str62.length; i++)
    {
      var n = str62.length - i - 1;
      var s = str62[i];
      i10 += this.str62keys.indexOf(s) * Math.pow(62, n);
    }
    return i10;
  };

  //
  // 10进制值转换为62进制
  // @param {String} int10 10进制值
  // @return {String} 62进制值

  WeiboUtility.int10to62 = function(int10) {
    var s62 = '';
    var r = 0;
    while (int10 != 0)
    {
      r = int10 % 62;
      s62 = this.str62keys[r] + s62;
      int10 = Math.floor(int10 / 62);
    }
    if ( s62.length < 4 ) s62 = utils.pad(s62, 4);
    return s62;
  };

  //
  // URL字符转换为mid
  // @param {String} url 微博URL字符，如 "wr4mOFqpbO"
  // @return {String} 微博mid，如 "201110410216293360"

  WeiboUtility.url2mid = function(url) {
    var mid = '';

    for (var i = url.length - 4; i > -4; i = i - 4) //从最后往前以4字节为一组读取URL字符
    {
      var offset1 = i < 0 ? 0 : i;
      var offset2 = i + 4;
      var str = url.substring(offset1, offset2);

      str = this.str62to10(str);
      if (offset1 > 0)  //若不是第一组，则不足7位补0
      {
        while (str.length < 7)
        {
          str = '0' + str;
        }
      }

      mid = str + mid;
    }

    return mid;
  };

  // WeiboUtility.mid2url(3501487810656704);
  // "zCHH2KQ0"
  //
  // mid转换为URL字符
  // @param {String} mid 微博mid，如 "201110410216293360"
  // @return {String} 微博URL字符，如 "wr4mOFqpbO"

  WeiboUtility.mid2url = function(mid) {
    mid += '';
    // if (typeof(mid) != 'string') return false;  //mid数值较大，必须为字符串！

    var url = '';

    for (var i = mid.length - 7; i > -7; i = i - 7) //从最后往前以7字节为一组读取mid
    {

      var offset1 = i < 0 ? 0 : i;
      var offset2 = i + 7;
      var num = mid.substring(offset1, offset2);
      num = this.int10to62(num);
      url = num + url;
    }
    url = url.replace(/^0*/, '');
    return url;
  };

  utils.WeiboUtility = WeiboUtility;

  utils.shortUrl = function (longUrl, callback){
    $.ajax({
      timeout: 5000,
      url: 'https://api.weibo.com/2/short_url/shorten.json',
      data: {url_long:longUrl, source:'3505891822'},
      dataType: 'json',
      success: function(json){
        if (json && json['urls'] && json['urls'][0]) {
          var url = json['urls'][0]['url_short'];
          callback && callback(url);
        }
      },
      error: function(){
        callback && callback();
      },
      complete: function(){
        $.ajaxSetup({
          timeout: 30000
        });
      }
    });
    // $.get('https://api.weibo.com/2/short_url/shorten.json',
    //   {url_long:longUrl, source:'3505891822'},
    //   function(json){
    //     if (json && json[0] && json[0]['url_short']) {
    //       var url = json[0]['url_short'];
    //       callback && callback(url);
    //     }
    //   },
    //   'json'
    // );
  };

  utils.shortUrlFromTab = function(tab, callback){

    if ( !tab ) return;
    var url = tab.url, title = tab.title, tabInfo = '';
    if ( url != title ) tabInfo += title;

    utils.shortUrl(url, function(_shortUrl){
      if ( _shortUrl ) {
        tabInfo += ' - ' + _shortUrl;
      } else {
        tabInfo += ' - ' + url;
      }

      callback && callback(tabInfo);
    });
  };

  utils.dataURItoBlob = function(dataURI) {
    if ( !dataURI ) return;

    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var binary = atob(dataURI.split(',')[1]);

    var len = binary.length;
    var arr = new Uint8Array(len);
    var i   = 0;
    for(; i < len; i++){
      arr[i] = binary.charCodeAt(i);
    }

    var buffer = arr.buffer;

    var blob;

    try {
      if ( global.CHROME_VERSION < 21 ) {
        blob = new Blob([buffer], {type: mimeString});
      } else {
        blob = new Blob([arr], {type: mimeString});
      }
    } catch(e) {
      try {
        var bb = new (window.BlobBuilder || window.WebKitBlobBuilder);
        bb.append(buffer);
        blob = bb.getBlog(mimeString);
      } catch(e) {}
    }
    return blob;
  }

  module.exports = utils;

});

