/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ShareaboutsDashboardPlacesListView = Backbone.Marionette.ItemView.extend({
    template: '#shareabouts-dashboard-places-list-tpl',
    modelEvents: {
      'change': 'render'
    },
    ui: {
      scrolltable: '.table-container',
      scrollLeft: '.scroll-button.left',
      scrollRight: '.scroll-button.right'
    },
    events: {
      'click @ui.scrollLeft': 'handleScrollLeft',
      'click @ui.scrollRight': 'handleScrollRight'
    },
    initialize: function(options) {
      this.plugin = options.plugin;

      // For now, debounce the add-place handler, since it will rerender the
      // entire table. TODO: We can probably do the adding smarter though.
      this.plugin.places.on('add', _.debounce(_.bind(this.handleAddPlace, this), 500));

      this.columnHeaders = [];
      $(window).on('resize', _.bind(this.onWindowResize, this));
      this.plugin.app.on('toggle:projectDashboard:tabs', _.bind(this.onToggleTabs, this));
    },
    getHeadersForValue: function(key, value) {
      var self = this,
          headers = [];

      if (_.isArray(value) || _.isObject(value)) {
        _.each(value, function(item, subKey) {
          var itemHeaders = self.getHeadersForValue(subKey.toString(), item);
          _.each(itemHeaders, function(itemHeader, index) {
            itemHeaders[index] = key + '.' + itemHeader;
          });
          headers = headers.concat(itemHeaders);
        });
      }

      else {
        headers = [key];
      }

      return headers;
    },
    getPlaceColumnHeaders: function(place) {
      var data = place.attributes,
          headers = [], key, value,
          exclude = ['visible'];

      for (key in data) {
        if (_.contains(exclude, key)) { continue; }
        headers = headers.concat(this.getHeadersForValue(key, data[key]));
      }

      return headers;
    },
    updateColumnHeaders: function(headers) {
      var self = this;
      _.each(headers, function(header) {
        var newIndex = _.sortedIndex(self.columnHeaders, header);
        self.columnHeaders.splice(newIndex, 0, header);
      });
      self.columnHeaders = _.uniq(self.columnHeaders, true);
    },
    handleAddPlace: function(place) {
      var newColumnHeaders = this.getPlaceColumnHeaders(place);
      this.updateColumnHeaders(newColumnHeaders);
      this.render();
    },
    serializeData: function() {
      var attrLabelMap = {
        'url': 'api url',
        'created_datetime': 'created',
        'updated_datetime': 'last updated',
        'geometry.coordinates.0': 'geometry lng',
        'geometry.coordinates.1': 'geometry lat',
        'geometry.type': 'geometry type',
        'private-email': 'email'
      };

      var attrTypeMap = {
        'created_datetime': 'time',
        'updated_datetime': 'time',
        'submitter.avatar_url': 'image',
        'url': 'url'
      };

      Handlebars.registerHelper('isTimeAttr', function(key, options) {
        return (attrTypeMap[key] === 'time' ? options.fn(this) : options.inverse(this));
      });

      Handlebars.registerHelper('isImageAttr', function(key, options) {
        return (attrTypeMap[key] === 'image' ? options.fn(this) : options.inverse(this));
      });

      Handlebars.registerHelper('isUrlAttr', function(key, options) {
        return (attrTypeMap[key] === 'url' ? options.fn(this) : options.inverse(this));
      });

      Handlebars.registerHelper('isDefaultAttr', function(key, options) {
        return (_.isUndefined(attrTypeMap[key]) ? options.fn(this) : options.inverse(this));
      });

      var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this);
      data.headers = this.columnHeaders;
      data.places = this.plugin.places.toJSON();
      data.submissions = this.plugin.submissions.toJSON();

      data.labels = attrLabelMap;

      return data;
    },

    fixTableHeader: function() {
      if (window.matchMedia(Foundation.media_queries.large).matches) {
        var tbodyHeight = $(window).height() - $('#places-datatable table').offset().top - 45;
        this.$('#places-datatable tbody').css({ maxHeight: tbodyHeight });
      } else {
        this.$('#places-datatable tbody').css({ maxHeight: 'none' });
      }
    },

    toggleScrollNavButtons: function() {
      if ( this.ui.scrolltable.scrollLeft() > 15 ) {
        this.$('.scroll-button.left').removeClass('hide');
      } else {
        this.$('.scroll-button.left').addClass('hide');
      }

      var tableContainerWidth = this.ui.scrolltable.width();
      var tableWidth = this.$('#places-datatable table').width();
      if ( this.ui.scrolltable.scrollLeft() <= tableWidth - tableContainerWidth - 15 ) {
        this.$('.scroll-button.right').removeClass('hide');
      } else {
        this.$('.scroll-button.right').addClass('hide');
      }
    },

    handleScrollLeft: function(evt) {
      evt.preventDefault();
      this.ui.scrolltable.animate({ scrollLeft: 0 });
    },

    handleScrollRight: function(evt) {
      evt.preventDefault();
      var tableWidth = this.$('#places-datatable table').width();
      this.ui.scrolltable.animate({ scrollLeft: tableWidth });
    },

    initSortableTable: function() {
      var options = {
        valueNames: this.columnHeaders,
        page: 50,
        plugins: [ ListPagination({outerWindow: 2}) ]
      };
      this.table = new List('places-datatable', options);
      this.ui.scrolltable.scroll(_.bind(this.toggleScrollNavButtons, this));
      this.toggleScrollNavButtons();
    },

    render: function() {
      Backbone.Marionette.ItemView.prototype.render.apply(this, arguments);
      this.initSortableTable();
      return this;
    },

    onShow: function() {
      this.fixTableHeader();
    },

    onWindowResize: function() {
      this.fixTableHeader();
      this.toggleScrollNavButtons();
    },

    onToggleTabs: function() {
      this.fixTableHeader();
    }
  });

}(Planbox, jQuery));