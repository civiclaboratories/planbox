/*globals Pen jQuery */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ImageDropZonesMixin = {
    initDropZones: function() {
      var view = this;

      this.ui.imageDropZones.fileUpload({
        url: 'https://' + NS.Data.s3UploadBucket + '.s3.amazonaws.com/',
        data: _.clone(NS.Data.s3UploadData),
        dndOver: function(isOver) {
          $(this).toggleClass('file-dragging', isOver);
        },
        dndDrop: function(files) {
          var $this = $(this);
          $this.removeClass('file-dragging');
          $this.data('fileUpload').upload(files);
        },
        validate: function(files) {
          var i;
          // Make sure this is an image before continuing
          for (i=0; i<files.length; i++) {
            if (files[i].type.indexOf('image/') !== 0) {
              NS.showErrorModal(
                'Unable to save that file.',
                'This file doesn\'t seem to be an image file.',
                'Make sure the file you\'re trying to upload is a valid image file ' +
                'and try again.'
              );

              // Return false to prevent the upload from starting
              return false;
            }
          }
          return true;
        },
        start: function(xhr, options) {
          // When the upload starts
          var $this = $(this),
              $imageContainer = $this.siblings('.image-holder');

          // Apply the uploading class.
          $this.addClass('file-uploading');

          // Show a preview
          // TODO: file[0] is not great
          $this.data('fileUpload').previewImage(options.files.file[0], function(dataUrl) {
            $imageContainer.attr('src', dataUrl);
          });
        },
        complete: function(err, xhr, options) {
          // When the upload is complete
          var $this = $(this),
              $imageContainer = $this.siblings('.image-holder'),
              attrName = $imageContainer.attr('data-attr'),
              imageUrl = window.encodeURI(
                options.url + options.data.key.replace('${filename}',
                // TODO: file[0] is not great
                options.files.file[0].name)
              );

          // Remove the uploading class.
          $this.removeClass('file-uploading');

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
          $this.data('fileUpload').prefetchImage(imageUrl);

          // On success, apply the attribute to the project.
          view.model.set(attrName, imageUrl);
        }
      });
    }
  };

  NS.ContentEditableMixin = {
    handleEditableBlur: function(evt) {
      evt.preventDefault();

      var $target = $(evt.currentTarget),
          attr = $target.attr('data-attr'),
          val;

      if ($target.is('[contenteditable]')) {
        val = $target.html();
      } else if ($target.attr('type') === 'checkbox') {
        val = $target.is(':checked');
      } else {
        val = $target.val();
      }

      // Set the value of what was just blurred. Setting an event to the same
      // value does not trigger a change event.
      this.model.set(attr, val);
    },
    onRender: function() {
      this.initRichEditables();
    },
    initRichEditable: function(el) {
      this.pen = new Pen({
        editor: el,
        list: ['insertorderedlist', 'insertunorderedlist', 'bold', 'italic', 'createlink'],
        stay: false
      });
    },
    canUsePen: function() {
      // Pen requires access to the classList attribute on DOM elements (see
      // https://developer.mozilla.org/en-US/docs/Web/API/Element.classList).
      // Check whether this feature is available.
      return ('classList' in document.createElement('a'));
    },
    initRichEditables: function() {
      var self = this;
      if (this.canUsePen() && this.ui.richEditables) {
        // Init the Pen editor for each richEditable element
        this.ui.richEditables.each(function(i, el) {
          self.initRichEditable(el);
        });
      }
    }
  };

  NS.SectionMixin = {
    id: function() {
      return 'section-' + this.model.get('slug') + '-wrapper';
    }
  };

  NS.SectionAdminMixin = {
    className: function() {
      return [
        'project-section',
        'project-section-' + this.model.get('type'),
        this.model.get('active') ? 'active' : ''
      ].join(' ');
    },
    handleActivationChange: function(evt) {
      evt.preventDefault();
      // Expecting values of "on" (truthy) or "" (falsey)
      var isActive = !!$(evt.currentTarget).val();
      this.$el.toggleClass('active', isActive);
      this.model.set('active', isActive);
    },
    handleDeleteSectionClick: function(evt) {
      evt.preventDefault();

      if (window.confirm('Really delete this section?')) {
        // Can't destroy since this is a section collection which only exists
        // as a relational collection to the project.
        this.model.collection.remove(this.model);
      }
    },
    onRender: function() {
      // This is so any changes to the menu_label will be reflected in the
      // slug.
      this.model.set('slug', '', {silent: true});
    }
  };

  NS.OrderedCollectionMixin = {
    // https://github.com/marionettejs/backbone.marionette/wiki/Adding-support-for-sorted-collections
    // Inspired by the above link, but it doesn't work when you start with an
    // empty (or unsorted) list.
    appendHtml: function(collectionView, childView, index){
      var collection = collectionView.collection,
          childrenContainer = collectionView.childViewContainer ? collectionView.$(collectionView.childViewContainer) : collectionView.$el,
          children = childrenContainer.children(),
          indices = [],
          sortNumber = function(a,b) { return a - b; },
          goHereIndex, i;

      // Get the indices off of the child containers.
      children.each(function() {
        var $sibling = $(this),
            siblingCid = $sibling.data('item-cid'),
            siblingItem = collection.get({cid: siblingCid}),
            siblingIndex = collection.indexOf(siblingItem);
        indices.push(siblingIndex);
      });

      // There are two possibilites here. Either:
      //
      // 1) We are adding an item at an index that doesn't yet exist in the
      //    collection view. For example, this happens when the collection
      //    first gets loaded into view. Each model's item gets added to the
      //    view, but not necessarily in order.
      // 2) We are adding an item at an index currenly occupied by another
      //    item. This happens when we add a new item to the collection after
      //    the view has already been rendered.
      //
      // In the latter case, where the index is already used, we need to
      // update the indices list to reflect the added item.

      // console.log('before', indices);
      goHereIndex = indices.indexOf(index);
      if (goHereIndex === -1) {  // Case #1 above

        indices.push(index);
        indices.sort(sortNumber);
        goHereIndex = indices.indexOf(index);

      } else {  // Case #2 above

        indices.splice(goHereIndex, 0, index);
        for (i = goHereIndex + 1; i < indices.length; ++i) {
          indices[i]++;
        }

      }
      // console.log('after', indices);
      // console.log('at', goHereIndex);

      if(goHereIndex === 0) {
        childrenContainer.prepend(childView.el);
      } else {
        childrenContainer.children().eq(goHereIndex-1).after(childView.el);
      }

      childView.$el.data('item-cid', childView.model.cid);
    }
  };

  NS.FormErrorsMixin = {
    onRender: function() {
      this.initValidityMessages();
    },

    initValidityMessages: function() {
      var $validityFields = this.$('[data-validity-message]');
      $validityFields.each(function(i, element) {
        var message = element.getAttribute('data-validity-message');
        element.oninvalid = function() {
          element.setCustomValidity('');
          if (!element.validity.valid) {
            element.setCustomValidity(message);
          }
        };
        element.oninput = function() {
          element.setCustomValidity('');
        };
      });
    },
    showFormErrors: function(errors) {
      var attr,
          $errorField,
          $errorMessageWrapper,
          errorMessage;

      for (attr in errors) {
        $errorMessageWrapper = this.$('[data-error-attr="' + attr + '"]');
        $errorMessageWrapper.html(
          '<small class="error error-message">' +
          this.getErrorMessage($errorMessageWrapper, attr, errors) +
          '</small>');

        $errorField = this.$('[data-attr="' + attr + '"]');
        $errorField.addClass('error');
      }
    },
    getErrorMessage: function($wrapper, attr, errors) {
      return $wrapper.attr('data-error-message');
    },
    clearErrors: function() {
      this.$('.error-message').remove();
      this.$('.error').removeClass('error');
    },
    resetForm: function() {
      this.ui.form[0].reset();
      this.clearErrors();
    }
  };

  NS.MagellanMenuMixin = {
    buildArrivalMap: function() {
      var $arrivals = $('[data-magellan-arrival]'),
          $desinations = $('[data-magellan-destination]'),
          map = {}, arrivals = [], desinations = [], currentArrival;

      // Get the names of all the arrivals
      $arrivals.each(function(i, el) {
        var arrival = $(el).attr('data-magellan-arrival');
        arrivals.push(arrival);
      });

      if (arrivals.length === 0) {
        this.arrivalMap = map;
        return map;
      } else {
        currentArrival = arrivals[0];
      }

      // Map each destination to the closest preceding arrival
      $desinations.each(function(i, el) {
        var destination = $(el).attr('data-magellan-destination');
        if (_.contains(arrivals, destination)) {
          currentArrival = destination;
        }
        map[destination] = currentArrival;
      });

      this.arrivalMap = map;
      return map;
    },

    onDomRefresh: function() {
      var self = this,
          debouncedScrollHandler = _.debounce(function(evt) {
            var offsets = self.offsets(),
                item, i, dest, arr, path, isMenuItem;

            for(i=0; i<offsets.length; i++){
              item = offsets[i];
              if (item.viewport_offset >= item.top_offset) {
                dest = item.arrival.attr('data-magellan-destination');

                if (_.isUndefined(self.arrivalMap) ||
                    _.isUndefined(self.arrivalMap[dest])) {
                  self.buildArrivalMap();
                }

                arr = self.arrivalMap[dest];
                path = NS.Utils.rootPathJoin(arr);

                if (path !== self.currentPath) {
                  self.currentPath = path;
                  NS.Utils.log('ROUTE', path);
                }
                return true;
              }
            }
          }, 500);

      // Only bind the scroll event if a magellan widget exists. They don't if
      // there are not enough items to warrant it.
      if ($('[data-magellan-expedition]').length > 0 &&
          $('[data-magellan-arrival]').length > 0) {
        $(window).off('scroll', debouncedScrollHandler).on('scroll', debouncedScrollHandler);

        $(document).on('click', '[data-magellan-link]', function(evt) {
          // See line 3147 in foundation.js. This should be an accessible function.
          // TODO: Pull request to make this public.
          evt.preventDefault();
          var expedition = $('[data-magellan-expedition]'),
              settings = expedition.data('magellan-expedition-init'),
              hash = $(this).attr('href').split('#').join(''),
              target = $("a[name='"+hash+"']");

          if (target.length === 0) {
            target = $('#'+hash);
          }

          // Account for expedition height if fixed position
          var scroll_top = target.offset().top;
          scroll_top = scroll_top - expedition.outerHeight();

          $('html, body').stop().animate({
            'scrollTop': scroll_top
          }, 700, 'swing', function () {
            if(history.pushState) {
              history.pushState(null, null, '#'+hash);
            }
            else {
              location.hash = '#'+hash;
            }
          });
        });
      }
    },
    onClickMenuItem: function(evt) {
      var $target = $(evt.currentTarget),
          label = $target.attr('data-magellan-arrival');
      NS.Utils.log('USER', 'project-display', 'menu-click', label);
    },
    onClickHighlight: function(evt) {
      var $target = $(evt.currentTarget),
          label = $target.attr('data-highlight-type');
      NS.Utils.log('USER', 'project-display', 'highlight-click', label);
    },
    offsets: function() {
      var self = this,
          expedition = $('[data-magellan-expedition]'),
          settings = expedition.data('magellan-expedition-init') || {
            destination_threshold: 20
          },
          destination_threshold = settings.destination_threshold,
          viewport_offset = $(window).scrollTop();

      return $('[data-magellan-destination]').map(function(idx, el) {
        var dest = $(el),
            top_offset = dest.offset().top - destination_threshold - expedition.outerHeight();
        return {
          destination : dest,
          arrival : $(this),
          top_offset : top_offset,
          viewport_offset : viewport_offset
        };
      }).sort(function(a, b) {
        if (a.top_offset < b.top_offset) {return 1;}
        if (a.top_offset > b.top_offset) {return -1;}
        return 0;
      });
    }
  };

  NS.SnapshotGeneratorMixin = {
    disableSnapshotButton: function(label) {
      this.ui.generateSnapshot
          .attr('disabled', 'disabled')
          .addClass('generating')
          .html(label);
    },

    enableSnapshotButton: function(label) {
      this.ui.generateSnapshot
        .removeAttr('disabled')
        .removeClass('generating')
        .html(label);
    },

    generateSnapshot: function(options) {
      if (!this.ui.generateSnapshot.hasClass('generating')) {
        var self = this,
            getBeforeSend = self.plugin.getAjaxBeforeSendFunction,
            originalSnapshotButtonLabel = self.ui.generateSnapshot.html(),
            generatingSnapshotLabel = self.ui.generateSnapshot.attr('data-generating-label'),
            datasetUrl = options.datasetUrl,
            setName = options.setName || 'places',
            downloadTemplate = Backbone.Marionette.TemplateCache.get('#download-snapshot-button-tpl'),
            snapshots = new Shareabouts.SnapshotCollection(),
            snapshotOptions = {'include_private': true},
            snapshot;

        self.disableSnapshotButton(generatingSnapshotLabel);

        snapshots.url = datasetUrl + '/' + setName + '/snapshots';

        // Request a new snapshot
        snapshot = snapshots.create(snapshotOptions, {
          success: function() {

            // Listen until the snapshot has been generated
            snapshot.waitUntilReady({
              data: snapshotOptions,
              beforeSend: (getBeforeSend ? getBeforeSend.call(self.plugin) : null),
              success: function(url) {

                // Show a download button when the snapshot is ready
                self.ui.snapshotsWrapper
                  .html(downloadTemplate(snapshot.toJSON()));
                self.enableSnapshotButton(originalSnapshotButtonLabel);
              },
              error: function() {
                self.enableSnapshotButton(originalSnapshotButtonLabel);
                alert('There was a problem generating your\nsnapshot. Please try again later.');
              }
            });
          }
        });
      }
    }
  };

}(Planbox, jQuery));
