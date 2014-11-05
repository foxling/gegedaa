define(function(require, exports, module) {
/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 *
 * Requires: 1.2.2+
 */

    var jQuery = require('$');
(function($) {

    var types = ['DOMMouseScroll', 'mousewheel'];

    if ($.event.fixHooks) {
        for ( var i=types.length; i; ) {
            $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
        }
    }

    if ( !$.event.special.mousewheel ) {
        $.event.special.mousewheel = {
            setup: function() {
                if ( this.addEventListener ) {
                    for ( var i=types.length; i; ) {
                        this.addEventListener( types[--i], handler, false );
                    }
                } else {
                    this.onmousewheel = handler;
                }
            },

            teardown: function() {
                if ( this.removeEventListener ) {
                    for ( var i=types.length; i; ) {
                        this.removeEventListener( types[--i], handler, false );
                    }
                } else {
                    this.onmousewheel = null;
                }
            }
        };
    }

    if ( !$.fn.mousewheel ) {
      $.fn.extend({
        mousewheel: function(fn) {
          return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
          return this.unbind("mousewheel", fn);
        }
      });
    }

    function handler(event) {
        // console.info(event);
        var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // chrome orgEvent.wheelDelta 120, touch 3
        // firefox detail == 1

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = Math.ceil(Math.abs(orgEvent.wheelDelta) < 120 ? orgEvent.wheelDelta / 3 : orgEvent.wheelDelta / 120); }
        if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }

        // New school multidimensional scroll (touchpads) deltas
        deltaY = delta;

        // orgEvent.HORIZONTAL_AXIS 1
        // orgEvent.VERTICAL_AXIS 2

        // Gecko
        if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaY = 0;
            deltaX = -1*delta;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // console.info(orgEvent.wheelDelta, orgEvent.detail, args);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

})(jQuery);
});
