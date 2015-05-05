/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  _.nowAndLater = function(func, wait) {
    // Run the wrapped function at least twice: once at the beginning
    // of a debounced period, and once after the last debounced call.

    var context, funcArgs, result, later;
    var debouncedFunc = _.debounce(func, wait, true);
    var now = function() {
      if (later) { clearTimeout(later); later = null; }
      debouncedFunc.apply(context, funcArgs);
    };

    return function() {
      context = this;
      funcArgs = arguments;

      result = now();                    // Now ...
      later = setTimeout(now, wait+50);  // ... and later.

      return result;
    };
  };

  NS.DatasetUniqueContribCountWidgetView = Backbone.Marionette.ItemView.extend({
    template: '#dataset-unique-contrib-count-widget-tpl',
    modelEvents: {
      'change': 'render'
    },
    initialize: function(options) {
      this.plugin = options.plugin;

      this.render = _.nowAndLater(this.render, 200);

      this.plugin.places.on('add', _.bind(this.render, this));
      this.plugin.submissions.on('add', _.bind(this.render, this));
    },
    serializeData: function() {
      var userTokens = this.plugin.places.pluck('user_token').concat(
        this.plugin.submissions.pluck('user_token'));
      userTokens = _.uniq(userTokens);

      var data = {
        'unique_contributor_count': userTokens.length
      };

      return data;
    }
  });

}(Planbox, jQuery));