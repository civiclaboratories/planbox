/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.ProjectListEmptyView = Backbone.Marionette.ItemView.extend({
    template: '#project-list-empty-tpl',
    tagName: 'div'
  });

  NS.ProjectListItemView = Backbone.Marionette.ItemView.extend({
    template: '#project-list-item-tpl',
    tagName: 'div'
  });

  NS.ProjectListView = Backbone.Marionette.CompositeView.extend({
    template: '#project-list-tpl',
    childView: NS.ProjectListItemView,
    childViewContainer: '.project-list',
    emptyView: NS.ProjectListEmptyView,
    emptyViewOptions: function() { return {model: this.model}; }
  });

}(Planbox, jQuery));