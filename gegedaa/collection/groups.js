define(function(require, exports, module) {

  var Backbone         = require('backbone');
  var ClientCollection = require('./client-collection');
  var Group            = require('../model/group');
  var _                = require('_');

  var Groups = ClientCollection.extend({
    constructor: function GCGroups(models, options){
      ClientCollection.prototype.constructor.call(this, models, options);

      this.clientMethod = 'groups';
      this.model = Group;
    },

    comparator: function(chapter) {
      var t = Date.parse(chapter.get('created_at'));
      if ( !t ) {
        return 0;
      }
      return t.valueOf();
    },

    fetch: function(){
      var that = this;
      if ( that.client['groups'] ) {
        that.client['groups']({}, function(data){
          _.each(data, function(group){
            if (!that.get(group.idstr)) {
              that.add(group, {sort:true});
            }
          });

          if ( that.length > 0 ) {
            that.trigger('updated');
          }
        });
      }
      return that;
    }
  });
  
  module.exports = Groups;

});