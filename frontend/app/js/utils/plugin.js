var screens = {}
var widgets = {}

export function load(url, options){
  let full_url=`/static/${url}`
  if (localStorage.servername)
    full_url=`${localStorage.servername}/${url}`

  options = $.extend( options || {}, {
    dataType: "script",
    cache: true,
    url: full_url
  });

  return jQuery.ajax( options );
}

export function add_screen(id, fn){
  screens[id]=fn
}

export function do_screen(id, el, data){
  return screens[id](el, data)
}

export function add_widget(id, fn){
  widgets[id]=fn
}

export function do_widget(id, el, data){
  return widgets[id](el, data)
}

export default {load, add_screen, do_screen, add_widget, do_widget}
