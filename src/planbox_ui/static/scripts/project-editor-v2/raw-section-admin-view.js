/*globals Backbone jQuery Handlebars Modernizr _ Pen FileAPI chrono L */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.RawHtmlSectionAdminView = Backbone.Marionette.ItemView.extend(
    _.extend({}, NS.ContentEditableMixin, NS.SectionAdminMixin, {
      template: '#raw-section-admin-tpl',
      tagName: 'section',
      id: NS.SectionMixin.id,

      ui: {
        editables: '[data-attr]',
        rawEditables: '.raw-editable',
        deleteSection: '.delete-section'
      },
      events: {
        'blur @ui.editables': 'handleEditableBlur',
        'input @ui.editables': 'handleEditableBlur',
        'click @ui.deleteSection': 'handleDeleteSectionClick'
      },
      initRawEditables: function() {
        var editor, editable;
        editable = this.ui.rawEditables[0];

        editor = ace.edit(editable);
        editor.getSession().setMode('ace/mode/html');
        editor.getSession().setUseWorker(false);  // Disable HTML validation

        editor.on('change', _.bind(this.handleRawEditableBlur, this));
        editor.on('blur', _.bind(this.handleRawEditableBlur, this));

        this.editor = editor;
        return editor;
      },
      handleRawEditableBlur: function(evt, editor) {
        var attr = editor.container.getAttribute('data-raw-attr'),
            val = editor.getValue();
        this.model.set(attr, val);
      },
      onRender: function() {
        this.initRawEditables();
        NS.SectionAdminMixin.onRender.call(this);
      }
    })
  );

}(Planbox, jQuery));