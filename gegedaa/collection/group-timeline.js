define(function(require, exports, module) {

  var Home = require('./home');

  var GroupTimeline = Home.extend({
    constructor: function GCGroupTimeline(models, options){
      Home.prototype.constructor.call(this, models, options);

      this.clientMethod = 'groups_timeline';
    },

    apiParams: function(){
      return {
        list_id: this.options.id
      };
    }
  });

  module.exports = GroupTimeline;
});
