export function create_error($el, e){
  let error=$('<div class="plugin error"><div><i class="ui huge warning sign red icon"></i></div><div class="ui text red bold">Error loading widget</div></div>')
  error.append($('<div>').text(e))
  $el.html(error)
}
