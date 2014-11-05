define(function(require, exports, module) {

  var Backbone = require('backbone');
  var _        = require('_');

  var View = Backbone.View.extend({
    initialize: function GView(options){
      Backbone.View.prototype.initialize.call(this, options);
      this.children = [];
    },

    layout: function(){

    },

    remove: function(){
      _.each(this.children, function(view){
        view.remove();
      });

      Backbone.View.prototype.remove.call(this);
    },

    render: function GView(){
      this.rendered = true;
      return this;
    },

    addChild: function(view, notAppend){
      this.children.push(view);
      view.parent = this;
      if ( !notAppend ) {
        this.$el.append(view.$el);
      }
    }
  });

  module.exports = View;

});
