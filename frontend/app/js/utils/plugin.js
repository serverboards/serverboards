var screens = {}

export function load(url, options){
  options = $.extend( options || {}, {
    dataType: "script",
    cache: true,
    url: url
  });

  return jQuery.ajax( options );
}

export function add_screen(id, fn){
  screens[id]=fn
}

export function do_screen(id, data){
  screens[id](data)
}

export default {load, add_screen, do_screen}
