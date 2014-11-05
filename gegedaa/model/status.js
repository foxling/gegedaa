define(function(require, exports, module) {

  var bg      = chrome.extension.getBackgroundPage();
  var gegedaa = bg.gegedaa;

  var Model   = require('./model');
  var User    = require('./user');
  var utils   = require('../util/utils');
  var geoReg  = /我在(这里)*:(.+)$/;
  var Status  = Model.extend({

    constructor: function GMStatus(attributes, options){
      Model.prototype.constructor.apply(this, arguments);
    },

    parse: function(response){

      if ( response.user && response.user.id && response.mid ) {
        response.url = 'http://weibo.com/' + response.user.id + '/' + utils.WeiboUtility.mid2url(response.mid);
      }

      response.user = new User(response.user, {
        client: this.client
      });

      if ( response.source ) {
        response.source = response.source.replace('rel="nofollow"', 'rel="nofollow" target="_blank"');
      }

      if ( response.retweeted_status ) {
        var d = response.retweeted_status;
        response.retweeted_status = new Status(d, {
          parse: true,
          client: this.client
        });
      }

      return response;
    },

    isRt: function(){
      return !!this.get('retweeted_status');
    },

    showThumbPic: function(){
      if ( this.contentHtml().indexOf('class="content-link"') != -1 || utils.getTextByteLen(this.get('text')) > 140 ) {
        return true;
      }
      return false;
    },

    contentHtml: function(){
      if ( !this.get('content_html') ) {
        var text = this.get('text');

        // if ( this.get('geo') ) {
          var r = text.match(geoReg);
          if ( r && r.length ) {
            this.set('geo_link', r[2]);
            text = text.replace(geoReg, '');
          }
        // }

        text = utils.formatStatus(text);

        // 表情转换
        var settings = gegedaa.Settings.get('basic');
        if ( settings && settings.emotion ) {
          text = text.replace(/\[[\u4e00-\u9fa5\w\-]+\]/g, function($0, $1){
            var emotion = gegedaa.Emotions.get($0);
            if ( emotion ) {
              return '<img class="face" src="' + emotion.get('icon') + '">'
            }
            return $0;
          });
        }
        this.set('content_html', text);
      }
      return this.get('content_html');
    }

  });

  module.exports = Status;

});
