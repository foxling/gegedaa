var m = {
  name: 'auth_callback',
  url: window.location.href
};

if ( chrome.runtime && chrome.runtime.sendMessage ) {
  chrome.runtime.sendMessage(m);
} else if ( chrome.extension.sendMessage ) {
  chrome.extension.sendMessage(m);
} else if (chrome.extension.sendRequest) {
  chrome.extension.sendRequest(m);
}
