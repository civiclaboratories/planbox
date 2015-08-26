/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  // Exceptions ===============================================================
  NS.shareaboutsException = function(message, data) {
    return NS.genericException('ShareaboutsException', message, data);
  };

  // App ======================================================================
  // (NS.app is defined in base-app.js)

  NS.ShareaboutsDashboardPlugin = NS.Plugin.extend({
    initialize: function() {
      this.config = this.getShareaboutsConfig();
      if (!this.config) { return; }

      this.dataset = new Backbone.Model();
      this.dataset.url = this.config.details.dataset_url;

      this.places = new Shareabouts.PlaceCollection();
      this.places.url = this.config.details.dataset_url.replace(/^\/|\/$/g, '') + '/places';

      this.comments = new Shareabouts.PaginatedCollection();
      this.comments.url = this.config.details.dataset_url.replace(/^\/|\/$/g, '') + '/comments';

      this.submissions = new Shareabouts.PaginatedCollection();
      this.submissions.url = this.config.details.dataset_url.replace(/^\/|\/$/g, '') + '/submissions';

      // Log in to the Shareabouts server
      $.ajax({
        url: '/shareabouts/oauth-credentials',
        data: {'project_id': NS.Data.project.id},
        success: _.bind(this.fetchShareaboutsData, this)
      });

      this.app.on('show:projectDashboard:after', _.bind(this.onShowProjectDashboard, this));
      this.app.on('show:projectDashboard:activityPanel:after', _.bind(this.onShowActivityPanel, this));
      this.app.on('toggle:projectDashboard:tabs', _.bind(this.onTogglePanel, this));
    },

    getAjaxBeforeSendFunction: function(credentials) {
      credentials = credentials || this.credentials;
      return function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + credentials.access_token);
      };
    },

    fetchShareaboutsData: function(credentials) {
      this.credentials = credentials;
      var addAccessToken = this.getAjaxBeforeSendFunction(credentials);
      var syncWithAccessToken = function(method, model, options) {
        _.defaults(options || (options = {}), {
          beforeSend: addAccessToken
        });
        return Backbone.sync.call(this, method, model, options);
      };

      // Patch all the sync methods to use the access token.
      this.dataset.sync = this.places.sync = this.comments.sync = this.submissions.sync = syncWithAccessToken;
      this.places.model.prototype.sync = this.comments.model.prototype.sync = this.submissions.model.prototype.sync = syncWithAccessToken;

      var includes = {'include_private': true, 'include_invisible': true};
      this.dataset.fetch();
      this.places.fetchAllPages({ data: includes });
      this.comments.fetchAllPages({ data: includes });
      this.submissions.fetchAllPages({ data: includes });
    },

    getShareaboutsConfig: function() {
      var projectSections = NS.Data.project.sections,
          shareaboutsSection = _.findWhere(projectSections, {type: 'shareabouts'});
      return shareaboutsSection;
    },

    _addPlacesListTab: function(view) {
      var tabTemplate = Handlebars.templates['shareabouts-dashboard-places-tab-tpl'],
          sectionTemplate = Handlebars.templates['shareabouts-dashboard-places-list-tpl'];
      view.$('.tabs').append(tabTemplate());
      view.$('.tabs-content').append('<section role="tabpanel" aria-hidden="true" class="content no-paddings" id="panel-places-list"></section>');

      view.addRegion('placesListRegion', '#panel-places-list');
      view.placesListRegion.show(new NS.ShareaboutsDashboardPlacesListView({
        plugin: this
      }));
    },

    _addCommentsListTab: function(view) {
      var tabTemplate = Handlebars.templates['shareabouts-dashboard-comments-tab-tpl'],
          sectionTemplate = Handlebars.templates['shareabouts-dashboard-comments-list-tpl'];
      view.$('.tabs').append(tabTemplate());
      view.$('.tabs-content').append('<section role="tabpanel" aria-hidden="true" class="content no-paddings" id="panel-comments-list"></section>');

      view.addRegion('commentsListRegion', '#panel-comments-list');
      view.commentsListRegion.show(new NS.ShareaboutsDashboardCommentsListView({
        plugin: this
      }));
    },

    onShowProjectDashboard: function(view) {
      this._addPlacesListTab(view);
      this._addCommentsListTab(view);
    },

    onShowActivityPanel: function() {

    },

    onTogglePanel: function(tab, view) {

    }
  });

}(Planbox, jQuery));