/*globals Backbone, jQuery, Modernizr, Handlebars */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

  NS.MemberListItemAdminView = Backbone.Marionette.ItemView.extend({
    template: '#member-list-item-admin-tpl',
    tagName: 'li'
  });

  NS.MemberListAdminView = Backbone.Marionette.CompositeView.extend({
    template: '#member-list-admin-tpl',
    childView: NS.MemberListItemAdminView,
    childViewContainer: '.member-list'
  });

}(Planbox, jQuery));