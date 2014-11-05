define(function(require, exports, module) {

  var _                = require('_');
  var Home             = require('./home');

  var Mention = Home.extend({
    constructor: function GCMention(models, options){
      Home.prototype.constructor.call(this, models, options);

      this.clientMethod = 'mentions';
    }
  });

  module.exports = Mention;

});
