define(function(require, exports, module) {

  var bg       = chrome.extension.getBackgroundPage();
  var gegedaa  = bg.gegedaa;

  var $              = require('$');
  var Backbone       = require('backbone');
  var StatusWrapper  = require('./status-wrapper');
  var constance      = require('../util/constance');
  var _              = require('_');

  var Notification   = require('../notification');
  var GroupTimeLine  = require('../collection/group-timeline');
  var Timeline       = require('./timeline');

  var UsersStatus    = require('../users-status');
  var App            = require('../ggd-app');

  var Home = Timeline.extend({
    initialize: function GVHome(options){

      var that = this;
      that.unreadKey = 'status';

      Timeline.prototype.initialize.call(that, options);

      that.showsBookmark = true;
      that.autoSetCollection = false;
      that.collectionKey = 'Home';
      // that.showsNewsHandler = true;

      that.groupStatusesCollection = {};

      Notification.on('switch_user', function(user){
        that.storeScrollTop();
        that.setUser(user);
      }, that);
    },

    remove: function(){
      this.storeScrollTop();
      if ( this.groupList ) {
        this.groupList.off(null, null, this);
      }
      Timeline.prototype.remove.call(this);
    },

    // override
    setCollection: function(c){

      var that = this;

      if ( that.collection == c ) return that;

      Timeline.prototype.setCollection.call(that, c);

      // 分组信息
      var user = this.model;
      var needUpdateGroups;

      if ( that.groupList  ) {
        if ( that.groupList.client.user.get('idstr') != user.get('idstr') ) { // 切换用户
          that.groupList.off(null, null, that);
          that.groupList = gegedaa.Collections.get(user, 'Groups').on('updated', function(){
            that.updateGroups();
          }, that);
          needUpdateGroups = true;
        }
      } else {
        that.groupList = gegedaa.Collections.get(user, 'Groups').on('updated', function(){
          that.updateGroups();
        }, that);
        needUpdateGroups = true;
      }

      if ( needUpdateGroups ) {
        that.updateGroups();
      }

      return that;
    },

// ==================== 更新分组 ===================================================
    updateGroups: function(){
      var that = this;
      if ( !this.groupList || !this.$tabMenu ) return this;

      var $select = this.$tabMenu.find('select');

      if ( this.groupList.length > 0 ) {
        var html = '<option value="all">全部</option>';
        this.groupList.each(function(group){
          html += '<option value="' + group.get('idstr') + '">' + group.get('name') + '</option>';
        });
        $select.html(html);
        var groupId = UsersStatus.get(this.model, 'group') || 'all';
        $select.val(groupId);
      } else {
        this.groupList.fetch();
      }

      return this;
    },

    selectGroup: function(groupId, refresh){
      var that = this;

      if ( !refresh && that.groupId == groupId ) return that;

      that.groupId = groupId;

      var user = that.model;
      UsersStatus.set(user, 'group', that.groupId);

      if ( groupId == 'all' ) {
        that.unreadKey = 'status';
        var homeCollection = gegedaa.Collections.get(user, 'Home');
        that.setCollection(homeCollection);
      } else {
        var id = 'g' + groupId;
        that.unreadKey = null;
        if ( !that.groupStatusesCollection[id] ) {
          var client = bg.gegedaa.Clients.getClient(user);
          that.groupStatusesCollection[id] = new GroupTimeLine(null, {
            id: groupId,
            client: client
          });
        }
        that.setCollection(that.groupStatusesCollection[id]);
      }

      return that;
    },

    setUser: function(user){
      if ( user ) {
        this.model = user;
        var groupId = UsersStatus.get(user, 'group') || 'all';
        this.selectGroup(groupId, true);
      }
      return this;
    },

    storeScrollTop: function(){
      if ( App.windowMode == 'popup' && this.model ) {
        var top = this.$view.scrollTop();
        UsersStatus.set(this.model, 'homeScrollTop', top);
      }
      return this;
    },

    recoverScrollTop: function(){
      if ( App.windowMode == 'popup' && this.model ) {
        var top = UsersStatus.get(this.model, 'homeScrollTop');
        this.$view.scrollTop(top);
      }
    },

    renderStatuses: function(){
      Timeline.prototype.renderStatuses.call(this);

      var that = this;
      setTimeout(function(){
        that.recoverScrollTop();
      }, 0);
    },

    render: function(){

      var that = this;

      // 子菜单
      if ( !that.$tabMenu ) {
        that.$tabMenu = $($('#_tpl_tab_menu').html());
        that.$el.append( that.$tabMenu );

        that.$tabMenu.find('select').on('change', function(){
          that.selectGroup($(this).val());
        });
      }

      if ( !that.rendered ) {
        that.layout();
      }

      Timeline.prototype.render.call(that);

      if ( !that.collection ) {
        this.setUser(that.model);
      }

      return that;
    },

    layout: function(){
      // debugger;
      var height = this.$tabMenu.outerHeight();
      this.$view.css({
        top: height,
        height: '-webkit-calc(100% - ' + height + 'px)'
      });
    }
  });

  module.exports = Home;
});
