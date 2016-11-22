import {merge} from 'app/utils'
import rpc from 'app/rpc'

var screens = {}
var widgets = {}
var already_loaded = {}

export function join_path(url){
  let full_url=`/static/${url}`
  if (localStorage.servername)
    full_url=`${localStorage.servername}${full_url}`
  return full_url
}

export function load_js(url, options){
  if (already_loaded[url]){
    return Promise.resolve()
  }
  let promise = new Promise(function(accept, reject){
    let full_url=join_path(url)

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

export function load_css(url, options={}){
  if (already_loaded[url]){
    return Promise.resolve()
  }
  let full_url=join_path(url)

  options = merge(options, { type: "text/css", rel: "stylesheet", href: full_url })
  $('<link>')
    .appendTo("head")
    .attr(options)
  console.log("Loaded CSS %o", url)
  already_loaded[url]=true
}

export function load_html(url, options={}){
  let p = new Promise((accept, reject) => {
    url = join_path(url)
    $.get(url, function(html){
      if (options.base_url)
        html = html.replace(/(src=")([^/])/g, `$1${join_path(options.base_url)}/$2`)
      accept(html)
    }).error( (e) => {
      reject(e)
    })
  })
  return p
}

export function load(url, options={}){
  if (url.endsWith(".css"))
    return load_css(url, options)
  if (url.endsWith(".js"))
    return load_js(url, options)
  if (url.endsWith(".html"))
    return load_html(url, options)
  throw ("Dont know how to load based on URL extension: "+url)
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

export function do_screen(id, el, data, context){
  if (id in screens){
    let cleanf=screens[id](el, data, context)
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
    for (let {accept, el, data, context} of waiting_for_widgets[id])
      accept(fn(el, data, context))
  delete waiting_for_widgets[id]
}

export function do_widget(id, el, data, context){
  if (!(id in widgets)){
    let p = new Promise(function(accept, reject){
      waiting_for_widgets[id]=(waiting_for_widgets[id] || []).concat({accept, reject, el, data, context})
      setTimeout(function(){
        console.error("timeout waiting for widget %o", id)
        if (id in waiting_for_widgets)
          reject("Timeout")
      }, 1000)
    })
    return p
  }
  return Promise.resolve(widgets[id](el, data, context))
}

class PluginCaller{
  constructor(pluginid, options = {}){
    this.pluginid = pluginid
    this.uuid = undefined
    this.options = { restart: true }
  }
  start(method, params){
    return rpc.call("plugin.start", [this.pluginid]).then( (uuid_) => {
      this.uuid = uuid_
      return this
    })
  }
  call(method, params){
    return rpc.call(`${this.uuid}.${method}`, params).catch( (e) => {
      if (e=='unknown_method')
        return this.maybe_reconnect(e).then( () => this.call(method, params) )
      throw(e)
    })
  }
  maybe_reconnect(e){
    if (!this.options.restart)
      throw(e)
    return rpc.call("plugin.is_running", [this.uuid]).then( (is_running) => {
      if (is_running)
        throw(e)
      else{
        return this.start()
      }
    })
  }
  stop(){
    return rpc.call("plugin.stop", [this.uuid])
  }
}

export function start(pluginid, options={}){
  const pc = new PluginCaller(pluginid, options)
  return pc.start()
}

export function start_call_stop(pluginid, method, args){
  return start(pluginid).then( (pl) => (
    pl
      .call(method, args)
      .then( (res) => {pl.stop(); return res; })
      .catch( (e) => {pl.stop(); throw e; })
      .catch( (e) => { if (e!="cant_stop") throw e; })
  ))
}


export default {load, add_screen, do_screen, add_widget, do_widget, join_path, start, start_call_stop}
