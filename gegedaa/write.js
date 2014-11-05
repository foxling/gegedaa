define(function(require) {
  // var g = require('./global');
  var bg         = chrome.extension.getBackgroundPage();
  var gegedaa    = bg.gegedaa;
  var $          = require('$');
  var _          = require('_');
  var AlertView  = require('./view/alert-view');
  var WritePopup = require('./view/write-popup');
  var utils      = require('./util/utils');
  var UsersStatus= require('./users-status');

  require('./util/jquery-textarea-suggestion');

  $(function(){
    var currentUser = gegedaa.Users.getCurrentUser();

    if ( !currentUser ) {
      var alert = new AlertView();
      alert.show('请先添加微博帐号', function(){
        window.close();
      }, {
        hideBtnNo: true
      });
    }

    // var currentCollections = g.Collections.get(currentUser, 'Home');
    // var userSuggestion = new UserSuggestion({
    //   collection: currentCollections.FriendsSearcher
    // });

    var write = new WritePopup({
      // suggestion: userSuggestion
    });

    var UsersSuggestion = require('./view/users-suggestion');
    var usersSuggestion = new UsersSuggestion({
      collection: gegedaa.UsersCache
    });

    write.$text.textareaSuggestion({
      list: usersSuggestion
    });

    $('body').append(write.$el, usersSuggestion.$el);
    window.resizeTo(write.$el.outerWidth() + 10, write.$el.outerHeight() + 20);

    var hash  = window.location.hash.substr(1),
        param = JSON.parse(hash);

    var txt = write.$text.val(),
        shareText = '';

    var fromPostPanel;

    if ( param ) {

      fromPostPanel = !!param.from_post_panel;

      // 有带文字
      if ( param.txt ) {
        shareText = param.txt;
      }

      // 分享网页
      if (param.url) {
        utils.shortUrlFromTab({
          url: param.url,
          title: param.title
        }, function(tabInfo){
          write.$text.val( (txt ? txt + ' ' + tabInfo : tabInfo) + ( shareText ? ' ' + shareText : '' ) );
          utils.moveCursorToEnd(write.$text[0]);
        });
      } else {
        write.$text.val( txt ? txt + ' ' + shareText : shareText );
        utils.moveCursorToEnd(write.$text[0]);
      }

      // 图片链接
      if ( param.srcUrl ) {
        write.setPicUrl(param.srcUrl);
      }

      // 选中的用户
      if ( param.selectedUsers ) {
        write.setSelectedUsers(param.selectedUsers);
      }
    }

    write.on('update', function(message){
      updateStatus(message);
    });

    function updateStatus(message) {
      var users    = message.users || [],
          type     = message.type,
          formData = message.data;

      var queue = users.concat();

      $.each(users, update);

      var errorUpdate = [];

      function update(i, id){
        var user        = gegedaa.Users.get(id),
            client      = gegedaa.Clients.getClient(user),
            Home        = gegedaa.Collections.get(user, 'Home');

        if ( formData instanceof FormData ) {
          client.upload(formData, successCallback, errorCallback);
        } else if ( formData.url ) {
          client.update_url(formData, successCallback, errorCallback);
        } else {
          client.update(formData, successCallback, errorCallback);
        }

        // 逐条发送成功
        function successCallback(data){
          Home.add( data, {parse:true} );
          queue = _.without(queue, id);
          write.unSelectUser(id);
          if ( !queue.length && !errorUpdate.length ) {
            var alert = new AlertView();
            alert.show('发送成功，2秒后自动关闭', function(){
              // 从主窗口的发送面板过来的，清空未发送文字
              if ( fromPostPanel ) UsersStatus.set(null, 'statusText', '');
              var that = this, time = 1, h;
              h = setInterval(function(){
                if ( time <= 0) {
                  clearInterval(h);
                  window.close();
                }
                that.setMessage('发送成功，' + time + '秒后自动关闭');
                time--;
              }, 1000);
            }, {
              hideBtnNo: true,
              hideBtnYes: true
            });
          }
        };

        function errorCallback(data){
          errorUpdate.push({
            uid: user.id,
            error: data.error_cn || data.error
          });
          queue = _.without(queue, id);

          if ( queue.length == 0 && errorUpdate.length > 0 ) {
            onStatusUpdateError(errorUpdate);
          }
        }
      }

    }

    function onStatusUpdateError(errorArr){
      if ( errorArr && errorArr.length ) {
        var error = errorArr.shift();
        var user = bge.Users.get(error.uid);
        if ( error.error ) {
          var alert = new AlertView();
          alert.show('帐号 <strong>' + user.get('screen_name') + '</strong> 发送错误：' + error.error, function(){
            setTimeout(function(){
              onStatusUpdateError(errorArr);
            }, 200);
          }, {
            hideBtnNo: true
          });
        }
      }
      // 发送面板可点击状态，方便重试
      write.enable();
    }

  });

});
