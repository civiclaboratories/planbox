/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ProjectListEmptyAdminView = Backbone.Marionette.ItemView.extend({
    template: '#project-list-empty-admin-tpl',
    tagName: 'li'
  });

  NS.ProjectListItemAdminView = Backbone.Marionette.ItemView.extend(
    _.extend({}, NS.FormErrorsMixin, {
      template: '#project-list-item-admin-tpl',
      tagName: 'li',
      className: 'project',
      ui: {
        form: '.slug-form', // FormErrorsMixin expects a `form` ui element
        slugForm: '.slug-form',
        slugField: '.slug-field',
        changeSlugBtn: '.change-slug',
        cancelSlugBtn: '.cancel-slug-change',
        deleteBtn: '.delete'
      },
      events: {
        'click @ui.changeSlugBtn': 'handleOpenSlugForm',
        'click @ui.cancelSlugBtn': 'handleCloseSlugForm',
        'submit @ui.slugForm': 'handleSlugFormSubmit',
        'click @ui.deleteBtn': 'handleDelete'
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
      handleSlugFormSubmit: function(evt) {
        evt.preventDefault();
        var self = this;

        self.clearErrors();

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
              self.showFormErrors(errors);
            } else {
              alert('Something went wrong while setting the plan slug.\n' +
                'We have been notified of the error and will look into it ASAP.');
              throw NS.profileException(
                'Failed to set project slug for project with id "' + model.get('id') + '". ' +
                'HTTP status ' + $xhr.status + ' ' + $xhr.statusText + '.');
            }
          }
        });
      },
      handleDelete: function(evt) {
        evt.preventDefault();
        var self = this;
        console.log('confirming');
        this.$('.delete-confirmation')
          .foundation('reveal', 'open')
          .on('opened.fndtn.reveal', {view: this}, this.handleDeleteConfirmationReveal);
      },
      handleDeleteConfirmationReveal: function(evt) {
        var modal = $(this);
        var view = evt.data.view;
        modal.find('.confirm').on('click', _.bind(view.handleConfirmDelete, view));
      },
      handleConfirmDelete: function(evt) {
        evt.preventDefault();
        var model = this.model;
        this.$el
          .fadeOut('slow').promise()
          .then(function() {
            if (model.collection) { model.destroy(); }
          });
      },
      onRender: function() {
        this.initValidityMessages();
      }
    })
  );

  NS.ProjectListAdminView = Backbone.Marionette.CompositeView.extend({
    template: '#project-list-admin-tpl',
    childView: NS.ProjectListItemAdminView,
    childViewContainer: '.project-list',
    emptyView: NS.ProjectListEmptyAdminView,
    emptyViewOptions: function() {
      // Use the current model as opposed to a blank model in the empty project
      // list.
      return {model: this.model};
    },

    modelEvents: {
      'sync': 'handleModelSync'
    },

    handleModelSync: function() {
      this.render();
    },

    onShow: function() {
      if (!NS.Utils.cookies.get('supress-team-welcome-modal')) {
        $('#teamWelomeModal')
          .foundation('reveal', 'open')
          .on('opened.fndtn.reveal', _.bind(this.handleWelcomeModalOpened, this));
      }
    },

    handleWelcomeModalOpened: function(evt) {
      // Bind Modal supression events
      var $showWelcomeFlag = $(evt.currentTarget).find('[name="show_again"]');
      $showWelcomeFlag.on('change', _.bind(this.handleShowWelcomeModalFlagChange, this));
    },

    handleShowWelcomeModalFlagChange: function(evt) {
      if ($(evt.currentTarget).is(':checked')) {
        NS.Utils.cookies.destroy('supress-team-welcome-modal');
      } else {
        NS.Utils.cookies.save('supress-team-welcome-modal', true);
      }
    }

  });

}(Planbox, jQuery));