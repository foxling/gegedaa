define(function(require, exports, module) {

  var Backbone = require('backbone');
  var User     = require('./user');

  var Users = Backbone.Collection.extend({

    model: User,

    constructor: function GCUsers(models, options){
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      try {
        var usersData = localStorage['Users'];
        this.add( JSON.parse(usersData) );
      } catch(e) {}

      this._findDefaultUser();
    },

    getUsers: function(){
      return this.models.concat();
    },

    setCurrentUser: function(id){
      var that    = this,
          user    = this.get(id);

      if ( user ) {
        that._currentUser = user;
        that.forEach(function(user){
          if (user.get('id') == id) {
            user.set('defaultUser', true);
            that.trigger('user_switched');
          } else {
            user.set('defaultUser', false);
          }
        });

        that.save();
      }
    },

    getCurrentUser: function(){
      return this._currentUser;
    },

    save: function(){
      var json = this.toJSON();
      localStorage['Users'] = JSON.stringify( json );
    },

    _findDefaultUser: function(){
      var that = this, len = that.length;
      if ( len == 0 ) return;

      if ( that.length == 1 ) {
        that._currentUser = that.at(0);
      } else {
        var found = false;
        that.forEach(function(user){
          if ( user.get('defaultUser') ) {
            that._currentUser = user;
            found = true;
            return false;
          }
        });
        if ( !found ){
          that._currentUser = that.at(0);
        }
      }
    },

    deleteUser: function(id){
      var user = this.get(id);
      if ( !user ) { return; }

      this._currentUser = null;
      this.remove(user);
      this.save();

      this._findDefaultUser();
      this.trigger('user_delete', user);
    },

    addUser: function(user){
      var u      = new this.model(user),
          result = true; // false 用户已存在

      if ( this.length == 0 ) {
        u.set('defaultUser', true);
        this.add(u);
        this._currentUser = u;
        this.trigger('user_add', u.id);
      } else {
        if ( !this.get(u.get('id')) ) {
          this.add(u);
          this.trigger('user_add', u.id);
        } else {
          result = false;
          this.updateUser(user);
          this.trigger('user_update', u.id);
        }
      }

      this.save();
      return result ? u : false;
    },

    updateUser: function(obj){
      if (obj.id) {
        var user = this.get(obj.id);
        user.set(obj);
        this.save();
      }
    }
  });

  module.exports = new Users();

});
