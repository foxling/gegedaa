define(function(require, exports, module) {
  var g = require('./global');
  var $ = require('$');

  module.exports = {
    init: function(){
      if ( !g.DEBUG ) {
        this.push(['_setAccount', 'UA-30213511-1']);
        this.push(['_trackPageview']);
        var userAgent = navigator.userAgent;
        if (userAgent.indexOf(' Chrome/') > -1 ) {
          var re = userAgent.match(/\sSE\s|LBBROWSER|CoolNovo/);
          var b = 'chrome';
          if (re && re.length) {
            b = re[0];
          }
          b = b.replace(/\s*/g, '');
          this.push(['_setCustomVar', 1, 'browser', b, 1]);
        }

        $(function() {
          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
          ga.src = 'https://ssl.google-analytics.com/ga.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        });
      }
    },

    push: function(p){
      if ( !window._gaq ) window._gaq = [];
      window._gaq.push(p);
    }
  };
});
