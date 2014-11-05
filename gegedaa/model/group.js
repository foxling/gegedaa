define(function(require, exports, module) {
  
  var Model  = require('./model');
  var Group = Model.extend({
    idAttribute: 'idstr',
    
    constructor: function GMGroup(attributes, options){
      Model.prototype.constructor.apply(this, arguments);
    }
  });

  module.exports = Group;
});