define(function(require, exports, module) {

  var Model  = require('./model');
  var Emotion = Model.extend({

    idAttribute: 'phrase',

    constructor: function GMEmotion(attributes, options){
      Model.prototype.constructor.apply(this, arguments);
    }

  });

  module.exports = Emotion;

});
