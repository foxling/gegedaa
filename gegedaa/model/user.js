define(function(require, exports, module) {
  
  var Model = require('./model');

  module.exports = Model.extend({
    
    constructor: function GMUser(attributes, options){
      Model.prototype.constructor.apply(this, arguments);
    },

    getProfileImage: function(size){
      var url = this.get('profile_image_url');
      return url.replace('/50/', '/' + size + '/');
    }
  });

});