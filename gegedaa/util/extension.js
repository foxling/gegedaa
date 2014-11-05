define(function(require, exports, module) {
  module.exports = {
    onMessage: function(listener){
      if ( chrome.runtime && chrome.runtime.onMessage ) {
        chrome.runtime.onMessage.addListener(listener)
      } else if ( chrome.extension.onMessage ) {
        chrome.extension.onMessage.addListener(listener);
      } else if (chrome.extension.onRequest) {
        chrome.extension.onRequest.addListener(listener);
      }
    },

    // sendMessage 原来有两个参数，第一个参数指定扩展ID
    // 默认是本扩展，由于不需要和其它扩展通讯
    // 并且老版的sendRequest第一个参数不能为null，全省略
    // ver 22 以后使用 runtime
    sendMessage: function(message){
      if ( chrome.runtime && chrome.runtime.sendMessage ) {
        chrome.runtime.sendMessage(message);
      } else if ( chrome.extension.sendMessage ) {
        chrome.extension.sendMessage(message);
      } else if (chrome.extension.sendRequest) {
        chrome.extension.sendRequest(message);
      }
    }
  };
});
