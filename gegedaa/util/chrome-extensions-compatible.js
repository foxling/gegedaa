define(function(require, exports, module) {
  module.exports = {
    chrome_extension_sendMessage: function(message){
      if ( chrome.extension.sendMessage ) {
        chrome.extension.sendMessage(message);
      } else if (chrome.extension.sendRequest) {
        chrome.extension.sendRequest(message);
      }
    }
  };
});