define(function(require, exports, module) {

  var Backbone = require('backbone');
  var View = require('./view');

  var CardBox = View.extend({
    className: 'card-box',
    initialize: function CardBox(options){
      View.prototype.initialize.call(this, options);

      this.cards = [];
    },

    setSelectedItem: function(i){
      if ( this.selectedItemIndex != i ) {
        var card = this.cards[i];

        if ( !card.rendered ) card.render();

        card.$el.css({
          'z-index': 1,
          'display': 'block'
        });

        if ( this.selectedItemIndex != undefined ) {
          var currentCard = this.cards[this.selectedItemIndex];
          if (currentCard) {
            currentCard.$el.css({
              'z-index': 0,
              'display': 'none'
            });
          }
        }

        this.selectedItemIndex = i;
      }
      return this;
    },

    addItem: function(card){
      this.cards.push(card);
      this.$el.append(card.$el.css('display', 'none'));
      return this;
    }

  });

  module.exports = new CardBox();
});
