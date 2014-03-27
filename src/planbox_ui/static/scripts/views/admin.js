/*globals Backbone jQuery Handlebars Modernizr _ Pen FileAPI */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  // Handlebars support for Marionette
  Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
    return Handlebars.compile(rawTemplate);
  };

  // Sections =================================================================
  NS.EventAdminView = NS.SectionListItemAdminView.extend(
    _.extend({}, NS.ContentEditableMixin, {
      template: '#event-admin-tpl',
      tagName: 'li',
      className: 'event',
      ui: {
        editables: '[contenteditable]',
        richEditables: '.event-description',
        deleteBtn: '.delete-event-btn'
      },
      events: {
        'blur @ui.editables': 'handleEditableBlur',
        'click @ui.deleteBtn': 'handleDeleteClick'
      }
    })
  );

  NS.TimelineSectionAdminView = NS.SectionListAdminView.extend(
    _.extend({}, NS.ContentEditableMixin, {
      template: '#timeline-section-admin-tpl',
      tagName: 'section',
      className: 'project-timeline',

      itemView: NS.EventAdminView,
      itemViewContainer: '.event-list',

      ui: {
        editables: '[contenteditable]:not(.event [contenteditable])',
        itemList: '.event-list',
        newItemFocus: '.event-title:last',
        addBtn: '.add-event-btn'
      },
      events: {
        'click @ui.addBtn': 'handleAddClick',
        'blur @ui.editables': 'handleEditableBlur'
      },
      onRender: function() {
        // We need to do this since SectionListAdminView and ContentEditableMixin
        // both override onRender.

        // ContentEditableMixin
        this.initRichEditables();
        // SectionListAdminView
        this.initSortableItemList();
      }
    })
  );

  NS.TextSectionAdminView = Backbone.Marionette.ItemView.extend(
    _.extend({}, NS.ContentEditableMixin, {
      template: '#text-section-admin-tpl',
      tagName: 'section',
      className: 'project-text',

      ui: {
        editables: '[contenteditable]',
        richEditables: '.project-text-content'
      },
      events: {
        'blur @ui.editables': 'handleEditableBlur'
      }
    })
  );

  NS.FaqAdminView = NS.SectionListItemAdminView.extend(
    _.extend({}, NS.ContentEditableMixin, {
      template: '#faq-admin-tpl',
      tagName: 'div',
      className: 'faq',

      ui: {
        editables: '[contenteditable]',
        richEditables: '.faq-answer',
        deleteBtn: '.delete-faq-btn'
      },
      events: {
        'blur @ui.editables': 'handleEditableBlur',
        'click @ui.deleteBtn': 'handleDeleteClick'
      }
    })
  );

  NS.FaqsSectionAdminView = NS.SectionListAdminView.extend(
    _.extend({}, NS.ContentEditableMixin, {
      template: '#faqs-section-admin-tpl',
      tagName: 'section',
      className: 'project-faqs',

      itemView: NS.FaqAdminView,
      itemViewContainer: '.faq-list',

      ui: {
        editables: '[contenteditable]:not(.faq [contenteditable])',
        itemList: '.faq-list',
        newItemFocus: '.faq-question:last',
        addBtn: '.add-faq-btn'
      },
      events: {
        'click @ui.addBtn': 'handleAddClick',
        'blur @ui.editables': 'handleEditableBlur'
      },
      onRender: function() {
        // We need to do this since SectionListAdminView and ContentEditableMixin
        // both override onRender.

        // ContentEditableMixin
        this.initRichEditables();
        // SectionListAdminView
        this.initSortableItemList();
      }
    })
  );


  // Admin ====================================================================

  NS.showErrorModal = function(title, subtitle, description) {
    NS.app.overlayRegion.show(new NS.ModalView({
      model: new Backbone.Model({
        title: title,
        subtitle: subtitle,
        description: description
      })
    }));
  };

  NS.showProjectSaveErrorModal = function(resp) {
    var statusCode = resp.status,
        respJSON = resp.responseJSON,
        title, subtitle, description;

    ////
    // TODO: We can have a single subtitle template and a description template
    //       for ajax errors, and then pass in a status code.
    ////
    title = 'Unable to save.';
    if (statusCode === 0) {
      // No network connectivity
      subtitle = Handlebars.templates['message-ajax-no-status-error-subtitle']({});
      description = Handlebars.templates['message-ajax-no-status-error-description']({});

    } else if (statusCode === 400) {
      // Bad request (missing title, at this point)
      subtitle = Handlebars.templates['message-ajax-bad-request-error-subtitle']({errors: respJSON});
      description = Handlebars.templates['message-ajax-bad-request-error-description']({errors: respJSON});

    } else if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      // Authentication error
      // NOTE: you get a 404 when trying to access a private project, which
      // could belong to the user but they're now signed out for some reason.
      subtitle = Handlebars.templates['message-ajax-authentication-error-subtitle']({});
      description = Handlebars.templates['message-ajax-authentication-error-description']({});

    } else if (statusCode >= 500) {
      // Unknown server error
      subtitle = Handlebars.templates['message-ajax-server-error-subtitle']({});
      description = Handlebars.templates['message-ajax-server-error-description']({});

    } else {
      // No idea
      subtitle = Handlebars.templates['message-ajax-unknown-error-subtitle']({});
      description = Handlebars.templates['message-ajax-unknown-error-description']({});
    }

    NS.showErrorModal(title, subtitle, description);
  };

  NS.ProjectAdminModalView = Backbone.Marionette.ItemView.extend({
    template: '#project-admin-modal-tpl',
    className: 'overlay',
    ui: {
      closeBtn: '.btn-close',
      publishBtn: '.btn-public',
      makePublicContent: '.make-public-content',
      shareContent: '.share-content'
    },
    events: {
      'click @ui.closeBtn': 'handleClose',
      'click @ui.publishBtn': 'handlePublish'
    },
    handleClose: function(evt) {
      evt.preventDefault();
      this.close();
    },
    handlePublish: function(evt) {
      var self = this;

      evt.preventDefault();

      this.model.save({public: true}, {
        // We are not interested in change events that come from the server,
        // and it causes the save button to enable after saving a new project
        silent: true,

        success: function() {
          self.ui.makePublicContent.addClass('is-hidden');
          self.ui.shareContent.removeClass('is-hidden');
        },
        error: function(model, resp) {
          NS.showProjectSaveErrorModal(resp);
        }
      });
    }
  });

  NS.ProjectAdminView = NS.BaseProjectView.extend(
    _.extend({}, NS.ContentEditableMixin, {
      template: '#project-admin-tpl',
      ui: {
        editables: '[contenteditable]:not(#section-list [contenteditable])',
        richEditables: '.project-description',
        saveBtn: '.save-btn',
        statusSelector: '.status-selector',
        statusLabel: '.project-status',
        visibilityToggle: '[name=project-public]',
        userMenuLink: '.user-menu-link',
        userMenu: '.user-menu',
        editableNavMenuLinks: '.project-nav a[contenteditable]',
        publishBtn: '.btn-public',
        fileInputs: 'input[type="file"]',
        coverImg: '.site-header',
        coverImgDropZone: '#cover-image-dnd',
        removeCoverImgLink: '.remove-img-btn'
      },
      events: {
        'blur @ui.editables': 'handleEditableBlur',
        'blur @ui.editableNavMenuLinks': 'handleEditableNavMenuLinkBlur',
        'change @ui.statusSelector': 'handleStatusChange',
        'change @ui.visibilityToggle': 'handleVisibilityChange',
        'click @ui.saveBtn': 'handleSave',
        'click @ui.userMenuLink': 'handleUserMenuClick',
        'click @ui.publishBtn': 'handlePublish',
        'change @ui.fileInputs': 'handleFileInputChange',
        'click @ui.removeCoverImgLink': 'handleRemoveImage'
      },
      modelEvents: {
        'change': 'dataChanged',
        'sync': 'onSync'
      },
      collectionEvents: {
        'change':  'dataChanged',
        'add':     'dataChanged',
        'remove':  'dataChanged',
        'reorder': 'dataChanged'
      },
      sectionViews: {
        'timeline': NS.TimelineSectionAdminView,
        'text': NS.TextSectionAdminView,
        'faqs': NS.FaqsSectionAdminView
      },
      initialize: function() {
        // Hijack paste and strip out the formatting
        this.$el.on('paste', '[contenteditable]', function(evt) {
          evt.preventDefault();

          var pasted;
          // WebKit and FF
          if (evt && evt.originalEvent && evt.originalEvent.clipboardData &&
              evt.originalEvent.clipboardData.getData) {
            // This preserves line breaks, so don't worry about getting the HTML
            pasted = evt.originalEvent.clipboardData.getData('text/plain');
          } else if (window.clipboardData && window.clipboardData.getData)  {
            // IE
            pasted = window.clipboardData.getData('Text');
          }

          // Convert line breaks into <br> and paste
          NS.Utils.pasteHtmlAtCaret(pasted.replace(/\n/g, '<br>'));
        });

      },
      onRender: function() {
        this.initRichEditables();
        this.initDropZone(this.ui.coverImgDropZone.get(0));
      },

      // Prefetches an image file for a url to speed up load time
      // Takes an optional callback.
      prefetchImage: function(url, callback) {
        var img = new Image();   // Create new img element
        img.addEventListener('load', callback, false);
        img.src = url;
      },

      // File Uploads
      previewImage: function(file, $el) {
        // Display the image preview.
        FileAPI.Image(file).get(function(err, img) {
          var url;
          if (!err) {
            url = img.toDataURL(file.type); //FileAPI.toDataURL(img);

            // TODO: don't hardcode this.
            $el.addClass('has-cover-image');
            $el.css('background-image', 'url(' + url + ')');
          }
        });
      },

      handleRemoveImage: function(evt) {
        evt.preventDefault();

        if (window.confirm('Are you sure you want to remove your cover image?')) {
          this.ui.coverImg.css('background-image', 'none');
          this.ui.coverImg.removeClass('has-cover-image');
          this.model.set('cover_img_url', '');
        }
      },

      uploadImage: function(files, $el) {
        var self = this,
            bucketUrl = 'https://' + NS.Data.s3UploadBucket + '.s3.amazonaws.com/',
            data = _.clone(NS.Data.s3UploadData),
            file = files[0],
            imageUrl = bucketUrl + data.key.replace('${filename}', file.name);

        // Make sure this is an image before continuing
        if (file.type.indexOf('image/') !== 0) {
          NS.showErrorModal(
            'Unable to save that file.',
            'This file doesn\'t seem to be an image file.',
            'Make sure the file you\'re trying to upload is a valid image file ' +
            'and try again.'
          );

          return;
        }

        // Apply the uploading class.
        $el.addClass('file-uploading');

        // Start the upload.
        data['Content-Type'] = file.type;
        FileAPI.upload({
          url: bucketUrl,
          data: data,
          files: {file: file},
          cache: true,
          complete: function (err, xhr){
            // Remove the uploading class.
            $el.removeClass('file-uploading');

            if (err) {
              NS.showErrorModal(
                'Unable to save that file.',
                'We were unable to save your image.',
                'Sorry about that. Please save your changes, reload the page, ' +
                'and try again. Please email us at ' + NS.Data.contactEmail + ' ' +
                'if you have any more trouble.'
              );

              return;
            }

            // Fetch the image to make loading faster
            self.prefetchImage(imageUrl);

            // On success, apply the attribute to the project.
            self.model.set('cover_img_url', imageUrl);
          }
        });

        this.previewImage(file, $el);
      },
      handleFileInputChange: function(evt) {
        evt.preventDefault();

        // Get the files
        var files = FileAPI.getFiles(evt);
        FileAPI.reset(evt.currentTarget);

        this.uploadImage(files, this.ui.coverImg);
      },
      initDropZone: function(el) {
        var self = this;
        if( FileAPI.support.dnd ){
          FileAPI.event.dnd(el,
            // onFileHover
            function (over){
              self.ui.coverImg.toggleClass('over', over);
            },
            // onFileDrop
            function(files) {
              self.ui.coverImg.removeClass('over');
              self.uploadImage(files, self.ui.coverImg);
            }
          );
        }
      },


      onSync: function() {
        // When the model is synced with the server, we're going to rerender
        // the view to match the data.
        this.render();
      },
      handleEditableNavMenuLinkBlur: function(evt) {
        var $target = $(evt.target),
            attr = $target.attr('data-attr') || 'menu_label',
            sectionId = $target.attr('data-id'),
            val = $target.text(),
            sectionCollection = this.model.get('sections'),
            sectionModel = sectionCollection.get(sectionId);

        evt.preventDefault();

        // Set the value of what was just blurred. Setting an event to the same
        // value does not trigger a change event.
        sectionModel.set(attr, val);
      },
      handleStatusChange: function(evt) {
        var $target = $(evt.target),
            attr = $target.attr('data-attr'),
            val = $target.val();

        evt.preventDefault();

        this.ui.statusLabel
          // .removeClass('project-status-not-started project-status-active project-status-complete')
          // .addClass('project-status-'+val)
          .find('strong').text(_.findWhere(NS.Data.statuses, {'value': val}).label);

        this.model.set(attr, val);
      },
      handleVisibilityChange: function(evt) {
        var $target = $(evt.target),
            attr = $target.attr('data-attr'),
            val = ($target.val() === 'true');

        evt.preventDefault();

        // For IE8 only
        this.ui.visibilityToggle.removeClass('checked');
        $target.addClass('checked');

        this.model.set(attr, val);
      },
      save: function(makePublic) {
        var self = this,
            data = null;

        if (makePublic) {
          data = {public: true};
        }

        this.model.clean();
        this.model.save(data, {
          // We are not interested in change events that come from the server,
          // and it causes the save button to enable after saving a new project
          silent: true,
          success: function(model) {
            var path = '/' + NS.Data.user.username + '/' + model.get('slug') + '/';

            if (window.location.pathname !== path) {
              if (Modernizr.history) {
                window.history.pushState('', '', path);
              } else {
                window.location = path;
              }
            }

            if (makePublic || !model.get('public')) {
              // Show the modal if we're publishing this right now
              NS.app.overlayRegion.show(new NS.ProjectAdminModalView({
                model: model
              }));
            }
          },
          error: function(model, resp) {
            NS.showProjectSaveErrorModal(resp);
          }
        });
      },
      handleSave: function(evt) {
        evt.preventDefault();
        var self = this,
            $target = $(evt.target);

        if (!$target.hasClass('btn-disabled')) {
          this.save();
        }
      },
      handlePublish: function(evt) {
        evt.preventDefault();
        this.save(true);
      },
      handleUserMenuClick: function(evt) {
        evt.preventDefault();
        this.ui.userMenu.toggleClass('is-open');
      },
      dataChanged: function() {
        // Show the save button
        this.ui.saveBtn.removeClass('btn-disabled');
      }
    })
  );
}(Planbox, jQuery));