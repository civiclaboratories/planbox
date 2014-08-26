/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ProjectListItemAdminView = Backbone.Marionette.ItemView.extend({
    template: '#project-list-item-admin-tpl',
    tagName: 'li',
    className: 'project',
    ui: {
      slugForm: '.slug-form',
      slugField: '.slug-field',
      changeSlugBtn: '.change-slug',
      cancelSlugBtn: '.cancel-slug-change'
    },
    events: {
      'click @ui.changeSlugBtn': 'handleOpenSlugForm',
      'click @ui.cancelSlugBtn': 'handleCloseSlugForm',
      'submit @ui.slugForm': 'handleSlugFormSubmit'
    },
    handleOpenSlugForm: function(evt) {
      evt.preventDefault();
      var slugWidth = this.$('.slug').width();
      this.ui.slugField.width(Math.max(slugWidth, 20));
      this.$('.url').addClass('hide');
      this.$('form').removeClass('hide');
      $('.slug-field').select();
    },
    handleCloseSlugForm: function(evt) {
      evt.preventDefault();
      this.$('.url').removeClass('hide');
      this.$('form').addClass('hide');
      this.render();
    },
    getErrorMessage: function(attr, errors) {
      return this.$('[data-error-attr="' + attr + '"]');
    },
    handleSlugFormSubmit: function(evt) {
      evt.preventDefault();
      var self = this;

      this.$('.error').remove();
      this.model.save({'slug': this.ui.slugField.val()}, {
        patch: true,
        wait: true,
        success: function() {
          self.render();
        },
        error: function(model, $xhr, options) {
          var errors;
          if ($xhr.status === 400) {
            errors = $xhr.responseJSON;
            self.ui.slugForm.append('<small class="error">' + self.getErrorMessage('slug', errors) + '</small>');
          } else {
            alert('Something went wrong while setting the plan slug.\n' +
              'We have been notified of the error and will look into it ASAP.');
            throw NS.profileException(
              'Failed to set project slug for project with id "' + model.get('id') + '". ' +
              'HTTP status ' + $xhr.status + ' ' + $xhr.statusText + '.');
          }
        }
      });
    }
  });

  NS.ProjectListAdminView = Backbone.Marionette.CompositeView.extend({
    template: '#project-list-admin-tpl',
    itemView: NS.ProjectListItemAdminView,
    itemViewContainer: '.project-list',

    modelEvents: {
      'sync': 'handleModelSync'
    },

    handleModelSync: function() {
      this.render();
    }
  });

}(Planbox, jQuery));