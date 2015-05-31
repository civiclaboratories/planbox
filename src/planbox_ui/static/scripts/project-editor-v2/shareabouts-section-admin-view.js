/*globals Backbone jQuery Handlebars Modernizr _ Pen FileAPI chrono L */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ShareaboutsSectionAdminView = Backbone.Marionette.ItemView.extend(
    _.extend({}, NS.ContentEditableMixin, NS.SectionAdminMixin, NS.SnapshotGeneratorMixin, {
      template: '#shareabouts-section-admin-tpl',
      tagName: 'section',
      id: NS.SectionMixin.id,

      ui: {
        editables: '[data-attr]',
        richEditables: '.project-shareabouts-description',
        map: '.map',
        deleteSection: '.delete-section',
        generateSnapshot: '.generate-snapshot',
        snapshotsWrapper: '.existing-snapshot-wrapper'
      },
      events: {
        'blur @ui.editables': 'handleEditableBlur',
        'input @ui.editables': 'handleEditableBlur',
        'click @ui.deleteSection': 'handleDeleteSectionClick',
        'click @ui.generateSnapshot': 'handleGenerateSnapshotClick'
      },

      onShow: function() {
        var options = this.model.get('details'),
            i, layerOptions;

        this.map = L.map(this.ui.map.get(0), options.map);
        for (i = 0; i < options.layers.length; ++i) {
          layerOptions = options.layers[i];
          L.tileLayer(layerOptions.url, layerOptions).addTo(this.map);
        }

        this.map.on('moveend', _.bind(this.handleMapMoveEnd, this));
      },

      handleMapMoveEnd: function() {
        var center = this.map.getCenter(),
            zoom = this.map.getZoom(),
            mapOptions = _.defaults({
                center: [center.lat, center.lng],
                zoom: zoom
              },
              this.model.get('details').map
            );

        this.model.set('map', mapOptions);
      },

      handleGenerateSnapshotClick: function(evt) {
        evt.preventDefault();
        this.generateSnapshot({
          datasetUrl: this.model.get('details').dataset_url,
          setName: 'comments'
        });
      },

      presave: function() {

        // Shareabouts plugin presave
        // ==========================
        //
        // BEFORE THE PROJECT GETS SAVED, if there's not a dataset URL
        // already assigned, then make a call to create a dataset. Use
        // the Planbox-integrated route, as this will determine the
        // owner name and set up appropriate CORS permissions.

        var self = this;

        if (!this.model.get('details').dataset_url) {
          // Create the dataset and set the dataset url on the section model
          $.ajax({
            url: '/shareabouts/create-dataset',
            type: 'POST',
            data: {
              dataset_slug: NS.Data.owner.slug + '-' + (new Date()).getTime()
            },
            success: function(data) {
              self.model.set('dataset_url', data['dataset_url']);
              self.shareaboutsAccessData = data;
            },
            error: function(xhr, status, error) {
              // Remove the unsaved collection (and the view automatically)
              self.model.collection.remove(self.model);

              NS.showErrorModal('Unable to activate Shareabouts',
                'There was a temporary problem while we were setting up your ' +
                'Shareabouts map.',
                'We\'ve been notified and will investigate it right away. ' +
                'This is likely a temporary issue so please try again shortly.');
            }
          });
        }
      },

      postsave: function() {

        // Shareabouts plugin postsave
        // ===========================
        //
        // AFTER THE PROJECT GETS SAVED make a call that authorizes
        // the project to do thinks like access private data for the
        // project's dataset.

        var self = this;

        if (self.shareaboutsAccessData) {
          $.ajax({
            url: '/shareabouts/authorize-project',
            type: 'POST',
            data: self.shareaboutsAccessData,
            success: function(data) {
              delete self.shareaboutsAccessData;
            },
            error: function(xhr, status, error) {
              NS.showErrorModal('Unable to activate Shareabouts',
                'There was a temporary problem while we were setting up your ' +
                'Shareabouts map.',
                'We\'ve been notified and will investigate it right away. ' +
                'This is likely a temporary issue so please try again shortly.');
            }
          });
        }
      }
    })
  );

}(Planbox, jQuery));