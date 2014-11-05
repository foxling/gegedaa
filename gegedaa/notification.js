define(function(require, exports, module) {
  var _ = require('_');
  var Backbone = require('backbone');

  var Notification = _.extend({}, Backbone.Events);

  module.exports = Notification;
});
