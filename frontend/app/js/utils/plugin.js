var screens = {}
var widgets = {}
var already_loaded = {}

export function load(url, options){
  if (already_loaded[url]){
    return Promise.resolve()
  }
  let promise = new Promise(function(accept, reject){
    let full_url=`/static/${url}`
    if (localStorage.servername)
    full_url=`${localStorage.servername}${full_url}`

    options = $.extend( options || {}, {
      dataType: "script",
      cache: true,
      url: full_url
    });

    return jQuery.ajax( options ).done( accept ).fail( reject )
  })
  promise = promise.then( () => {
    already_loaded[url]=true
    console.log("Loaded JS %o", url)
  })
  return promise
}

let waiting_for_screen={}

function when_screen_added(id){
  return new Promise(function(accept, reject){
    waiting_for_screen[id] = (waiting_for_screen[id] || []).concat({accept, reject})
    setTimeout(30000, () => { // Will always fire, but maybe empty
      for (let {reject} of (waiting_for_screen[id] || []))
        reject(id)
    })
  })
}

export function add_screen(id, fn){
  screens[id]=fn
  for (let {accept} of (waiting_for_screen[id] || [])){
    accept(fn)
  }
  delete waiting_for_screen[id]
}

export function do_screen(id, el, data){

  if (id in screens){
    let cleanf=screens[id](el, data)
    return Promise.resolve(cleanf)
  }
  return when_screen_added(id).then( (screen) => {
    return screen(el,data)
  })
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
