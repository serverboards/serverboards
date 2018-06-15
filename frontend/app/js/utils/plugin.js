import {merge, servername} from 'app/utils'
import rpc from 'app/rpc'
import cache from 'app/utils/cache'

export var screens = {}
export var widgets = {}
var already_loaded = {}

export function join_path(url){
  return `${servername()}/static/${url}`
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
  console.log("Loading CSS %o", url)
  already_loaded[url]=true
}

export function load_html(url, options={}){
  let p = new Promise((accept, reject) => {
    url = join_path(url)
    $.get(url, function(html){
      if (options.base_url){
        const base_static = join_path(options.base_url)
        html = html.replace(/(src="|href=")([^/])/g, `$1/$2`) // maybe relative, convert to absolute
        html = html.replace(/(src="|href=")/g, `$1${base_static}/`) // Add the prefixes
        // and undo duplicate paths, because user already had them
        html = html.replace(RegExp(`/static/${options.base_url}//static/${options.base_url}/`,'g'), `/static/${options.base_url}/`)
      }
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

export function add_screen(id, fn, options={}){
  screens[id]={fn, options}
  for (let {accept} of (waiting_for_screen[id] || [])){
    if (options.react){
      accept({component: fn})
    }
    else{
      accept({umount: fn(el, data, context)})
    }
  }
  delete waiting_for_screen[id]
}

export function do_screen(id, el, data, context){
  if (id in screens){
    let screen=screens[id]
    if (screen.options.react){
      return Promise.resolve({component: screen.fn})
    }
    return Promise.resolve({umount: screen.fn(el, data, context)})
  }
  return when_screen_added(id).then( (screen) => {
    if (screen.options.react){
      return {component: screen.fn}
    }
    return {umount: screen.fn(el, data, context)}
  })
}

// Allow to be added asynchronously
let waiting_for_widgets={}

export function add_widget(id, fn, options = {}){
  widgets[id]={fn, options}
  if (id in waiting_for_widgets)
    for (let {accept, el, data, context, to} of waiting_for_widgets[id]){
      clearTimeout(to)
      if (options.react){
        accept({component: fn})
      }
      else{
        accept({umount: fn(el, data, context)})
      }
    }
  delete waiting_for_widgets[id]
}

export function do_widget(id, el, data, context){
  let widget = widgets[id]
  if (!widget){
    let p = new Promise(function(accept, reject){
      let to = setTimeout(function(){
        console.error("timeout waiting for widget %o", id)
        if (id in waiting_for_widgets)
          reject("Timeout")
      }, 1000)
      waiting_for_widgets[id]=(waiting_for_widgets[id] || []).concat({accept, reject, el, data, context, to})
    })
    return p
  }
  try{
    if (widget.options.react){
      return Promise.resolve({component: widget.fn})
    }
    return Promise.resolve({umount: widget.fn(el, data, context)})
  } catch (e){
    return Promise.reject(e)
  }
}

class PluginCaller{
  constructor(pluginid, options = {}){
    this.pluginid = pluginid
    this.uuid = undefined
    this.options = { restart: true }
  }
  start(){
    return rpc.call("plugin.start", [this.pluginid]).then( (uuid_) => {
      this.uuid = uuid_
      return this
    })
  }
  call(method, params={}){
    if (!this.uuid){
      return this.start().then(() => this.call(method, params))
    }
    return rpc.call("plugin.call", [this.uuid, method, params]).catch( (e) => {
      console.log(e, e == 'exit')
      if (e=='unknown_method' || e=="exit" || e == "timeout") // try again... maybe
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
      .then( (res) => { pl.stop().catch( () => false); return res; })
      .catch( (e) => { pl.stop().catch( () => false); throw e; })
      .catch( (e) => { if (e!="cant_stop") throw e; })
  ))
}

export function install(giturl){
  console.log("Install plugin from %s", giturl)
  return rpc.call("plugin.install", [giturl])
    .then(res => {
      cache.invalidate_all()
      return res
    })
}

export function call(pl, method, args){
  return rpc.call("plugin.call", [pl, method, args])
}

export default {
  load, add_screen, do_screen, add_widget, do_widget, join_path,
  start, call, start_call_stop,
  install, PluginCaller,
  screens, widgets,
}
