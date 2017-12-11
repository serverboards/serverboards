import marked from 'marked'

export function create_error($el, e){
  let error=$('<div class="plugin error"><div><i class="ui huge warning sign red icon"></i></div><div class="ui text red bold">Error loading widget</div></div>')
  error.append($('<div>').html(marked(e)))
  console.log(marked, e)
  $el.html(error)
}

export const COLORS = [
  "#6435c9",
  "#e03997",
  "#2185d0",
  "#a333c8",
  "#21ba45",
  "#00b5ad",
  "#b5cc18",
  "#fbbd08",
]
