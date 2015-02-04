/*globals Backbone jQuery Handlebars Modernizr _ Pen FileAPI chrono */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ProjectAdminView = Backbone.Marionette.Layout.extend(
    _.extend({}, NS.ImageDropZonesMixin, NS.ContentEditableMixin, {
      template: '#project-admin-tpl',
      ui: {
        editables: '[data-attr]:not(#section-list [data-attr])',
        settingsToggle: '.section-settings-toggle',
        coverImageSwitch: '.cover-image-switch',
        logoImageSwitch: '.logo-image-switch',
        richEditables: '.rich-editable',
        saveBtn: '.save-btn',
        form: 'form.project-edit-form',
        visibilityToggle: '[name=project-public]',
        customDomainMessage: '.custom-domain-message',
        customDomainMessageBtn: '.custom-domain-message-btn',
        publishCheckbox: '#public-switch',
        imageDropZones: '.image-dnd',
        removeImageLinks: '.remove-img-btn',
        hightlightLinkSelector: '.highlight-link-selector',
        hightlightExternalLink: '.highlight-external-link',
        characterCountInput: '.character-count-container [maxlength]',
        addSectionButtons: '.add-section-btn'
      },
      events: {
        'blur @ui.editables': 'handleEditableBlur',
        'input @ui.editables': 'handleEditableBlur',
        'change @ui.visibilityToggle': 'handleVisibilityChange',
        'change @ui.coverImageSwitch': 'handleCoverImageSwitch',
        'change @ui.logoImageSwitch': 'handleLogoImageSwitch',
        'click @ui.settingsToggle': 'handleSettingsToggle',
        'click @ui.saveBtn': 'handleSave',
        'keypress @ui.form': 'handleKeypress',
        'click @ui.customDomainMessageBtn': 'handleCustomDomainMessageBtn',
        'change @ui.publishCheckbox': 'handlePublish',
        'click @ui.removeImageLinks': 'handleRemoveImage',
        'click @ui.addSectionButtons': 'handleAddSectionButtonClick',
        'change @ui.hightlightLinkSelector': 'handleHighlightLinkChange',
        'blur @ui.hightlightExternalLink': 'handleHighlightExternalLinkBlur',

        'input @ui.characterCountInput': 'handleCharacterCountChange',
        'keyup @ui.characterCountInput': 'handleCharacterCountChange'
      },
      regions: {
        sectionList: '#section-list',
        locationMap: '.location-map-region'
      },

      modelEvents: {
        'change': 'dataChanged',
        'sync': 'onSync'
      },

      collectionEvents: {
        'add': 'sectionChanged',
        'remove': 'sectionChanged'
      },

      sectionListView: NS.ProjectSectionListAdminView,

      initialize: function() {
        var self = this;

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

      notifyProjectOpen: function() {
        var self = this;
        this.model.markAsOpenedBy(NS.Data.user, {
          success: function(data) {
            self.clearMultiUserWarning();
          },
          error: function($xhr) {
            if ($xhr.status === 409) {
              self.setMultiUserWarning($xhr.responseJSON);
            }
          },
          complete: function($xhr) {
            self.updateLastSavedInfo($xhr.responseJSON);
          }
        });
      },

      setMultiUserWarning: function(activityData) {
        var template = Backbone.Marionette.TemplateCache.get('#multi-user-warning-tpl'),
            content = template(activityData);
        this.$('.multi-user-warning-wrapper').html(content);
      },

      clearMultiUserWarning: function() {
        this.$('.multi-user-warning-wrapper').empty();
      },

      updateLastSavedInfo: function() {},

      onShow: function() {
        var self = this;
        this.initRichEditables();
        this.initDropZones();

        this.sectionList.show(new this.sectionListView({
          model: this.model,
          collection: this.collection,
          parent: this
        }));

        this.locationMap.show(new NS.ProjectLocationMapView({
          model: this.model
        }));

        // Set the initial character counts for each countable
        this.ui.characterCountInput.each(function(i, el) {
          self.setCharacterCountRemaining($(el));
        });


        // After the project is in the DOM, show the project sections
        $(this.el).foundation();

        // Start letting the server know you have the project open.
        this.openNotification = window.setInterval(_.bind(this.notifyProjectOpen, this), 15000);

        // Show the plan welcome modal
        if(!this.model.id) {
          $('#planWelomeModal').foundation('reveal', 'open');
        }

      },

      onClose: function() {
        window.clearInterval(this.openNotification);
      },

      updateSectionMenu: function() {
        var $addTimelineButtons = this.$('.add-timeline-section'),
            $addShareaboutsButtons = this.$('.add-shareabouts-section'),
            counts = this.collection.countBy(function(obj) {
              return obj.get('type');
            });

        // Only one timeline allowed
        if (counts.timeline) {
          $addTimelineButtons.addClass('disabled');
        } else {
          $addTimelineButtons.removeClass('disabled');
        }

        // Only one shareabouts map allowed
        if (counts.shareabouts) {
          $addShareaboutsButtons.addClass('disabled');
        } else {
          $addShareaboutsButtons.removeClass('disabled');
        }
      },

      setImageOnContainer: function($el, url) {
        $el.addClass('has-image');
        if ($el.hasClass('image-as-background')) {
          $el.css('background-image', 'url("' + url + '")');
        } else {
          $el.find('img.image-target').attr('src', url);
        }
      },

      removeImageFromContainer: function($el) {
        if ($el.hasClass('image-as-background')) {
          $el.css('background-image', 'none');
        } else {
          $el.find('img.image-target').attr('src', '');
        }
        $el.removeClass('has-image');
      },

      handleRemoveImage: function(evt) {
        evt.preventDefault();
        var $target = $(evt.currentTarget),
            $imgContainer = $target.closest('.image-holder'),
            confirmMsg = $target.attr('data-confirm-msg'),
            attrName = $imgContainer.attr('data-attr');

        if (window.confirm(confirmMsg)) {
          this.removeImageFromContainer($imgContainer);
          this.model.set(attrName, '');
        }
      },

      handleCoverImageSwitch: function(evt) {
        var $coverImageSwitch = $(evt.currentTarget),
            $imageWrapper = this.$('.cover-image-container'),
            $imageHolder = this.$('.cover-image-container .image-holder'),
            confirmRemoveMsg = $coverImageSwitch.attr('data-confirm-remove-msg'),
            isOn = $coverImageSwitch.is(':checked');

        if (!isOn) {
          if (!this.model.get('cover_img_url') || window.confirm(confirmRemoveMsg)) {
            $imageWrapper.addClass('hide');
            $imageHolder.attr('src', $imageHolder.attr('data-empty-img'));
            this.model.set('cover_img_url', '');
          } else {
            $coverImageSwitch.prop('checked', true);
          }
        } else {
          this.$('.cover-image-container').removeClass('hide');
        }
      },

      handleLogoImageSwitch: function(evt) {
        var $logoImageSwitch = $(evt.currentTarget),
            $imageWrapper = this.$('.logo-image-container'),
            $imageHolder = this.$('.logo-image-container .image-holder'),
            confirmRemoveMsg = $logoImageSwitch.attr('data-confirm-remove-msg'),
            isOn = $logoImageSwitch.is(':checked');

        if (!isOn) {
          if (!this.model.get('logo_img_url') || window.confirm(confirmRemoveMsg)) {
            $imageWrapper.addClass('hide');
            $imageHolder.attr('src', $imageHolder.attr('data-empty-img'));
            this.model.set('logo_img_url', '');
          } else {
            $logoImageSwitch.prop('checked', true);
          }
        } else {
          this.$('.logo-image-container').removeClass('hide');
        }
      },

      handleHighlightLinkChange: function(evt) {
        evt.preventDefault();

        var $target = $(evt.currentTarget),
            $selected = $target.find('option:selected'),
            $externalLinkInput = $target.siblings('.highlight-external-link'),
            linkType = $selected.attr('data-link-type'),
            linkTypeModelProp = $target.attr('data-link-type-name');

        // Handle external link  visibility
        this.model.set(linkTypeModelProp, linkType);

        if (linkType === 'external') {
          $externalLinkInput.removeClass('hide');
          this.model.set($target.attr('name'), $externalLinkInput.val());
        } else {
          $externalLinkInput.addClass('hide');
          this.model.set($target.attr('name'), $selected.val());
        }
      },

      handleHighlightExternalLinkBlur: function(evt) {
        var $target = $(evt.currentTarget),
            attr = $target.attr('data-attr'),
            val = $target.val();

        evt.preventDefault();

        // Set the value of what was just blurred. Setting an event to the same
        // value does not trigger a change event.
        this.model.set(attr, val);
      },

      onSync: function() {
        // Mark the model as unchanged.
        this.model.isDirty = false;
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
      handleSettingsToggle: function(evt) {
        evt.preventDefault();
        // $(evt.currentTarget).parents('.section-settings-toggle-container').next('.section-settings').slideToggle(400);
        // TODO: Investigate when/why slideToggle stopped working. -AC
        $(evt.currentTarget).parents('.section-settings-toggle-container').next('.section-settings').toggleClass('hide');
      },
      save: function(data) {
        var self = this,
            _saveModel;

        _saveModel = function() {
          var isNew = self.model.isNew(),
              isPublishing = (data && data.public);

          self.model.clean();
          self.model.save(data, {
            success: function(model) {
              self.onSaveSuccess(model);
              NS.Utils.runHook(NS.app.plugins, 'postsave', {args: [self.model]});

              if (isNew) { NS.Utils.log('SUPPORT', 'saved-new-project', { project_url: model.pageUrl() }); }
              if (isPublishing) { NS.Utils.log('SUPPORT', 'made-project-public', { project_url: model.pageUrl() }); }
            },
            error: function(model, resp) {
              // Did we specifically change the public status? Put it back.
              if (data && data.public) {
                self.ui.publishCheckbox.prop('checked', !data.public);
              }

              self.onSaveError(model, resp);
            }
          });
        };

        this.ui.saveBtn.addClass('disabled');
        NS.Utils.runHook(NS.app.plugins, 'presave', {done: _saveModel, args: [self.model]});
      },
      handleSave: function(evt) {
        evt.preventDefault();
        var self = this,
            $target = $(evt.currentTarget);

        if (!$target.hasClass('disabled')) {
          this.save();
        }
      },
      handleKeypress: function(evt) {
        // This is to prevent the form submission on enter.
        var code = evt.keyCode || evt.which;
        // If enter key in an input field. Divs and textareas should allow enter.
        if(code === 13 && evt.target.nodeName === 'INPUT') {
          evt.preventDefault();
          return false;
        }
      },
      handlePublish: function(evt) {
        evt.preventDefault();
        var shouldPublish = this.ui.publishCheckbox.is(':checked');

        // Just save. Don't ask.
        if (shouldPublish) {
          this.save({public: shouldPublish});
        } else {
          // Set the property. We'll save only if they're are publishing, but
          // not unpublishing.
          this.model.set({public: shouldPublish});
        }
      },
      handleCustomDomainMessageBtn: function(evt) {
        evt.preventDefault();
        this.ui.customDomainMessage.toggleClass('is-open');
      },
      handleCharacterCountChange: function(evt) {
        evt.preventDefault();
        var $target = $(evt.currentTarget);

        this.setCharacterCountRemaining($target);
      },
      setCharacterCountRemaining: function($charCountInput) {
        var max = parseInt($charCountInput.attr('maxlength'), 10),
            val = $charCountInput.val(),
            $counter = $charCountInput.parents('.character-count-container')
              .find('.character-count-remaining');

        $counter.text(max - val.length);
      },
      getDefaultSectionAttributes: function(sectionType) {
        switch (sectionType) {
        case 'timeline':
          return {
            type: sectionType,
            menu_label: 'Timeline'
          };
        case 'shareabouts':
          return {
            type: sectionType,
            menu_label: 'Map',
            details: {
              "layers": [
                {
                  "url": "http://{s}.tiles.mapbox.com/v3/openplans.map-dmar86ym/{z}/{x}/{y}.png"
                }
              ],
              "map": {
                "center": [
                  38.993572,
                  -96.196289
                ],
                "scrollWheelZoom": false,
                "zoom": 4
              },
              "description": "Give us your input on the project. Your input will shape the plan. Anyone can post an idea."
            }
          };
        default:
          return {
            type: sectionType
          };
        }
      },
      handleAddSectionButtonClick: function(evt) {
        evt.preventDefault();

        var $btn = $(evt.currentTarget),
            sectionType = $btn.attr('data-section-type'),
            sectionCollection = this.model.get('sections'),
            $section = $btn.closest('.project-section'),
            // If we are adding a section at the top of the list then $section
            // will be empty and sectionIndex will be -1.
            sectionIndex = $('.project-section').index($section);

        // Ignore clicks on disabled links
        if ($btn.is('.disabled')) {
          return;
        }

        sectionCollection.add(this.getDefaultSectionAttributes(sectionType), {
          at: sectionIndex + 1
        });

        $('[data-dropdown-content]').foundation('dropdown', 'closeall');
      },
      updateProjectPreviewLink: function() {
        var template = Backbone.Marionette.TemplateCache.get('#project-preview-link-tpl'),
            content = template(this.model.toJSON());
        this.$('.project-preview-wrapper').html(content);
      },
      onSaveSuccess: function(model) {
        var path = '/' + NS.Data.owner.slug + '/' + model.get('slug') + '/edit/';

        if (window.location.pathname !== path) {
          if (Modernizr.history) {
            window.history.replaceState('', '', path);
          } else {
            window.location = path;
          }
        }

        // Disable the save button. We used to rerender the template,
        // but this is better (prevents page jumping) and pretty easy.
        this.ui.saveBtn.addClass('disabled');

        // Re-render the project preview link; the link should only show after
        // the project has been saved for the first time. Also, if the slug
        // changes, the link needs to change.
        this.updateProjectPreviewLink();
      },
      onSaveError: function(model, resp) {
        NS.showProjectSaveErrorModal(resp);
      },
      dataChanged: function() {
        // Show the save button
        this.ui.saveBtn.removeClass('disabled');

        this.model.isDirty = true;
      },
      sectionChanged: function(model, collection, options) {
        this.updateSectionMenu();
      },

    })
  );

}(Planbox, jQuery));