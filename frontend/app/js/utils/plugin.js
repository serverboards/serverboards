var screens = {}
var widgets = {}

export function load(url, options){
  let full_url=`/static/${url}`
  if (localStorage.servername)
    full_url=`${localStorage.servername}${full_url}`

  options = $.extend( options || {}, {
    dataType: "script",
    cache: true,
    url: full_url
  });

  let p = new Promise(function(accept, reject){
    jQuery.ajax( options ).then(accept).fail((xhr, text, error) => reject(text))
  })

  return p
}

export function add_screen(id, fn){
  screens[id]=fn
}

export function do_screen(id, el, data){
  return screens[id](el, data)
}

// Allow to be added asynchronously
let waiting_for_widgets={}

export function add_widget(id, fn){
  widgets[id]=fn
  if (id in waiting_for_widgets)
    for (let {accept, el, data} of waiting_for_widgets[id])
      accept(fn(el, data))
  delete waiting_for_widgets[id]
}

export function do_widget(id, el, data){
  if (!(id in widgets)){
    let p = new Promise(function(accept, reject){
      waiting_for_widgets[id]=(waiting_for_widgets[id] || []).concat({accept, reject, el, data})
      setTimeout(function(){
        console.error("timeout waiting for widget %o", id)
        if (id in waiting_for_widgets)
          reject("Timeout")
      }, 1000)
    })
    return p
  }
  return Promise.resolve(widgets[id](el, data))
}

export default {load, add_screen, do_screen, add_widget, do_widget}
