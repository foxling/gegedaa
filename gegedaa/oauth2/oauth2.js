define(function(require, exports, module) {

  var $ = require('$');
  var _ = require('_');
  var Backbone = require('backbone');

  function OAuth2(options){
    this.clientId     = options.clientId;
    this.clientSecret = options.clientSecret || '';
    this.scope        = options.scope || '';
    this.redirectUri  = options.redirectUri || '';

    this.updateToken(options);
  };

  OAuth2.IFRAME_ID = 'oauth2-authorize-iframe';

  OAuth2.prototype = {

    updateToken: function(token){
      this.expiresIn    = token.expires_in || 0;
      this.accessToken  = token.access_token || '';
      this.authTime     = token.auth_time || 0;
    },

    authorizeUrl: function(){
      return 'https://api.weibo.com/oauth2/authorize?' +
              'client_id=' + this.clientId +
              '&redirect_uri=' + encodeURIComponent(this.redirectUri) +
              '&scope=' + this.scope;
    },

    accessTokenUrl: function(){
      return 'https://api.weibo.com/oauth2/access_token';
    },

    isAccessTokenExpired: function(){
      var now = Date.now();
      return !this.accessToken || !this.expiresIn || this.authTime + this.expiresIn * 1000 <= now + 600 * 1000; // 10分钟时间差异
    },

    finishAuth: function(url){
      // bg.console.info(url);
      if (!url) return;
      var error = url.match(/\?error=(.+)/);
      if (error) {
        console.info(error[1]);
        return;
      }

      var m = url.match(/\?code=([\w\/\-]+)/);
      if ( m && m.length ) {
        this.getAccessToken(m[1]);
      }
    },

    authorize: function(forcelogin){
      var url = this.authorizeUrl() + (forcelogin ? '&forcelogin=true' : '');
      var iframe = '<iframe src="' + url + '" style="width:100%;height:100%;border:0;background:#FFF"></iframe>';
      $('body').append('<div id="' + OAuth2.IFRAME_ID + '" style="position:absolute;top:35px;bottom:0px;right:0px;left:0px;z-index:8;">' + iframe + '</div>');
    },

    getAccessToken: function(code){
      /* return
        {
         "access_token": "ACCESS_TOKEN",
         "expires_in": 1234,
         "remind_in":"798114",
         "uid":"12341234"
        }
      */

      var that = this;

      $.ajax({
        type: 'POST',
        url: this.accessTokenUrl(),
        data: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri
        },
        dataType: 'json',
        timeout: 3 * 1000,
        success: function(data){
          if ( data.access_token && data.expires_in ) {
            that.accessToken = data.access_token;
            that.expiresIn   = data.expires_in;
            that.uid         = data.uid;
            that.authTime    = Date.now();
            that.trigger('auth_finish');
          }
        },
        error: function(xhr, type){
          console.info('get access token failed');
        }
      })
    }
  };

  _.extend(OAuth2.prototype, Backbone.Events);

  module.exports = OAuth2;

});
