define(function(require, exports, module) {

  var Global = {
    DEBUG: false,

    bg: function(){
      var bg;
      try {
        bg = chrome.extension.getBackgroundPage();
      } catch(e) {
        try {
          bg = sogouExplorer.extension.getBackgroundPage();
        } catch(e){}
      }
      return bg;
    }(),

    isSogou: function(){
      try {
        if ( sogouExplorer ) return true;
      } catch(e){}

      return false;
    }()
  };

  (function(userAgent){
    Global.CHROME_VERSION = parseInt(userAgent.match(/chrome\/([\.\d]+)/i)[1]);
    Global.OS = /Windows NT 6/i.test(userAgent) ? 'WIN7' : ( /Macintosh/i.test(userAgent) ? 'OSX' : 'XP' );
  })(navigator.userAgent);

  // if ( DEBUG ) {
  //   window.onerror = function(errorMsg, url, lineNumber) {
  //     bg.console.error(url, lineNumber, errorMsg);
  //   };

  //   window.addEventListener('unload', function(){
  //     bg.console.info('unload', location.href);
  //     if ( !DEBUG ) window.onerror = null;
  //   }, false);
  // }

  module.exports = Global;
});
