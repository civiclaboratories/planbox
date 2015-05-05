/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ShareaboutsDashboardCommentsListView = Backbone.Marionette.ItemView.extend(
    _.extend({}, NS.SnapshotGeneratorMixin, {
      template: '#shareabouts-dashboard-comments-list-tpl',
      modelEvents: {
        'change': 'render'
      },
      ui: {
        scrolltable: '.table-container',
        scrollLeft: '.scroll-button.left',
        scrollRight: '.scroll-button.right',
        visibleCheckboxes: '.visible-checkbox',
        generateSnapshot: '.generate-snapshot',
        snapshotsWrapper: '.existing-snapshot-wrapper'
      },
      events: {
        'click @ui.scrollLeft': 'handleScrollLeft',
        'click @ui.scrollRight': 'handleScrollRight',
        'change @ui.visibleCheckboxes': 'handleVisibilityChange',
        'click @ui.generateSnapshot': 'handleGenerateSnapshotClick'
      },
      initialize: function(options) {
        this.plugin = options.plugin;

        // For now, debounce the add-place handler, since it will rerender the
        // entire table. TODO: We can probably do the adding smarter though.
        this.plugin.comments.on('add', _.debounce(_.bind(this.handleAddComment, this), 500));

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
      getColumnHeaders: function(place) {
        var data = place.attributes,
            headers = [], key, value,
            exclude = ['visible', 'dataset', 'place', 'set', 'updated_datetime', 'url'];

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
      handleAddComment: function(comment) {
        var newColumnHeaders = this.getColumnHeaders(comment);
        this.updateColumnHeaders(newColumnHeaders);
        this.render();
      },
      serializeData: function() {
        var attrLabelMap = {
          'url': 'api url',
          'created_datetime': 'created',
          'updated_datetime': 'last updated',
          'private-email': 'email'
        };

        var attrTypeMap = {
          'created_datetime': 'time',
          'updated_datetime': 'time',
          'submitter.avatar_url': 'image',
          'place': 'url',
          'dataset': 'url',
          'set': 'url',
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
        data.comments = this.plugin.comments.toJSON();

        data.labels = attrLabelMap;

        return data;
      },

      handleVisibilityChange: function(evt) {
        var $checkbox = $(evt.currentTarget),
            checked = $checkbox.prop('checked'),
            id = $checkbox.attr('data-shareabouts-id'),
            comment = this.plugin.comments.get(id),
            $row = $checkbox.closest('tr');

        $checkbox.prop('disabled', true);
        comment.save({visible: checked}, {
          url: comment.get('url') + '?include_invisible',
          patch: true,
          success: function() {
            $row.toggleClass('row-visible', checked);
            $row.toggleClass('row-invisible', !checked);
            $row.find('.visible-value').html(checked.toString());
          },
          error: function() {
            $checkbox.prop('checked', !checked);
            // TODO: Handle error
          },
          complete: function() {
            $checkbox.prop('disabled', false);
          }
        });
      },

      handleGenerateSnapshotClick: function(evt) {
        evt.preventDefault();
        this.generateSnapshot({
          datasetUrl: this.plugin.dataset.get('url'),
          setName: 'comments'
        });
      },

      fixTableHeader: function() {
        if (window.matchMedia(Foundation.media_queries.large).matches) {
          var tbodyHeight = $(window).height() - $('#comments-datatable table').offset().top - 45;
          this.$('#comments-datatable tbody').css({ maxHeight: tbodyHeight });
        } else {
          this.$('#comments-datatable tbody').css({ maxHeight: 'none' });
        }
      },

      toggleScrollNavButtons: function() {
        if ( this.ui.scrolltable.scrollLeft() > 15 ) {
          this.$('.scroll-button.left').removeClass('hide');
        } else {
          this.$('.scroll-button.left').addClass('hide');
        }

        var tableContainerWidth = this.ui.scrolltable.width();
        var tableWidth = this.$('#comments-datatable table').width();
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
        var tableWidth = this.$('#comments-datatable table').width();
        this.ui.scrolltable.animate({ scrollLeft: tableWidth });
      },

      initSortableTable: function() {
        var options = {
          valueNames: this.columnHeaders,
          page: 50,
          plugins: [ ListPagination({outerWindow: 2}) ]
        };
        this.table = new List('comments-datatable', options);
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
    })
  );

}(Planbox, jQuery));