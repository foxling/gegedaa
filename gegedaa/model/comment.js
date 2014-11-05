define(function(require, exports, module) {
  var bg      = chrome.extension.getBackgroundPage();
  var gegedaa = bg.gegedaa;

  var Model  = require('./model');
  var User   = require('./user');
  var utils  = require('../util/utils');
  var Status = require('./status');
  var Comment = Model.extend({

    constructor: function GMComment(attributes, options){
      Model.prototype.constructor.apply(this, arguments);
    },

    parse: function(response){

      response['user'] = new User(response['user'], {
        client: this.client
      });

      if ( response['status'] ) {
        var d = response['status'];
        response['status'] = new Status(d, {
          parse: true,
          client: this.client
        });
      }

      return response;
    },

    contentHtml: function(){
      if ( !this.get('content_html') ) {
        var text = utils.formatStatus(this.get('text'));

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

  module.exports = Comment;

});
