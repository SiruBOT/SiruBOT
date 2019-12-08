function setLocale (locale) {
  setCookie('locale', locale)
  window.location.reload()
}

function setCookie (cname, cvalue, exdays) {
  var d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
  var expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

function getCookie (cookieName) {
  var x, y
  var val = document.cookie.split(';')

  for (var i = 0; i < val.length; i++) {
    x = val[i].substr(0, val[i].indexOf('='))
    y = val[i].substr(val[i].indexOf('=') + 1)
    x = x.replace(/^\s+|\s+$/g, '')
    if (x === cookieName) {
      return unescape(y)
    }
  }
}

function hideWithAnimation (id, name = '') {
  document.getElementById(id).className = name + ' hide'
  setTimeout(() => {
    document.getElementById(id).style = 'display:none'
  }, 600)
}
function displayWithAnimation (id, name = '') {
  document.getElementById(id).className = name + ' show'
  document.getElementById(id).style = 'display:show'
}
setTimeout(() => {
  hideWithAnimation('spinner', 'uk-position-center')
  setTimeout(() => {
    displayWithAnimation('show', 'content')
  }, 500)
}, 1000)
