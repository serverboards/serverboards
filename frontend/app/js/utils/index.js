import moment from 'moment'
import {i18n, i18n_c, i18n_nop} from 'app/utils/i18n'
import templates from './templates'

export {templates}

/// Convert a list of key,value into an object
export function to_map(l){
  let d={}
  for(let kv of l)
    d[kv[0]]=kv[1]
  return d
}
/// Convert an object to a list of [k,v]
export function to_list(d){
  let l=[]
  for (let k in d){
    l.push([k, d[k]])
  }
  return l
}
/// If passed a list, returns a list, if any other thing a list with that item
export function maybe_list(l){
  if (l.constructor === Array)
    return l
  return [l]
}

/// Convert a list to dict of keys to true, and a object to itself.
/// This unifies a list of items as ['nocss'] to be equal to {nocss: true}
export function to_keywordmap(data){
  if (!data)
    return {}
  if (data.length){
    let d = {}
    for (let k of data)
      d[k]=true
    return d
  }
  return data
}


export function dedup(l){
  let ret=[]
  for (let i of l){
    if (ret.indexOf(i)<0)
      ret.push(i)
  }
  return ret
}

export function flatmap( arr, fn ){
  let ret=[]
  for(let el of arr.map( fn ))
    ret = ret.concat(el)
  return ret
}

export function is_empty(l){
  return !l || (l.length==0)
}

/// Drops some keys from a map, and returns a copy without these keys
/// Its optimized for a small ammount of keys O(N²)
export function map_drop(map, keys){
  if (keys.length==0)
    return map

  let r={}
  for (let k in map){
    let v=map[k]
    let drop=false;
    for(let dk of keys){
      if (dk==k){
        drop=true;
        break;
      }
    }
    if (!drop)
      r[k]=v
  }
  return r
}

/// Gets a deep value from a map, following a path. If any if null/undefined, returns that, not continuing the path. Path is a list
export function map_get(obj, path, defval){
  let v = obj[path[0]]
  if (v == null || v == undefined)
    return defval
  if (path.length>1)
    return map_get(v, path.slice(1), defval)
  return v
}

/// Updates a dict path element with the given value. Path is a list of tranversal.
export function map_set(orig, path, value){
  if (path.length==0)
    return value
  const head = path[0]
  const rest = path.slice(1)
  return merge(orig, {[head]: map_set( orig[head] || {}, rest, value )})
}

/// Concatenates lists returning a new one
export function concat(/* arguments */){
  let ret = []
  for (let l of arguments){
    for (let x of l)
      ret.push(x)
  }
  return ret
}

export function sort_by_name(list){
  return list.slice().sort( (a,b) => (a.name || "").localeCompare(b.name || "") )
}

export const PALETTES = {
  blue: [
    "#22ABBE",
    "#A4C6ED",
    "#66A3E5",
    "#0A294D",
    "#008CD9",
    "#012D96",
  ],
  purple:[
    "#DD248C",
    "#EF8BAC",
    "#9013FE",
    "#EF8BAC",
    "#420269",
    "#D394E0",
  ],
  green: [
    "#1E8A6A",
    "#00C25E",
    "#50E3C2",
    "#57814E",
    "#A3F18B",
    "#173337",
  ],
  brown:[
    "#ED9445",
    "#B8703F",
    "#DB9C63",
    "#753D3D",
    "#725B5B",
    "#3D1F04",
  ],
  mix: [
    "#2185d0",
    "#b5cc18",
    "#e03997",
    "#a333c8",
    "#00b5ad",
  ]
}

const fixed_colors={
  "": "white",
  "stopped" : "lightgrey",
  "running" : "green",
  "unknown" : "grey",
  "error" : "red",
  "ok" : "green",
  "enabled": "green",
  "warning" : "orange",
  "up" : "green",
  "down" : "red",
  "timeout" : "red",
  "important" : "red",
  "new" : "green",
  "unread" : "yellow",
  "disabled" : "grey",
  "active" : "green",
  "broken" : "red",
  "updatable" : "yellow",
  "red": "red",
  "orange": "orange",
  "yellow": "yellow",
  "olive": "olive",
  "green": "green",
  "teal": "teal",
  "blue": "blue",
  "violet": "violet",
  "purple": "purple",
  "pink": "pink",
  "brown": "brown",
  "grey": "grey",
  "facebook": "blue",
  "instagram": "pink",
  "sem": "teal",
  "google": "red",
  "organic": "olive",
}

const COLOR_TO_HEX = {
  "red": "#db2828",
  "blue": "#2185d0",
  "teal": "#00b5ad",
  "olive": "#b5cc18",
  "green": "#21ba45",
  "purple": "#a333c8",
  "pink": "#e03997",
  "orange": "#f2711c",
  "yellow": "#fbbd08",
  "brown": "#a5673f",
  "grey": "#aaa",
  "black": "#000",
  "lightgrey": "#ddd",
  "white": "#fff",
}

export function colorize_hex(str, palette){
  const color = colorize(str, palette)
  if (!color.startsWith("#"))
    return COLOR_TO_HEX[color]
  return color
}

export function colorize(str, palette){
  if (typeof(str) == 'string'){
    if (str.startsWith('#'))
      return str
    if (str.startsWith('rgb('))
      return str
    if (str.startsWith('rgba('))
      return str
    if (str.indexOf("error")>=0)
      return "red"
    if (!str)
      return "white"
    str=str.toLowerCase()
    if (fixed_colors[str])
      return fixed_colors[str]
  }
  return random_color(str, palette)
}

export function colorize_list(list, palette, colorizef = colorize){
  let ret = []
  let used_colors = {}
  let i = 0
  const palette_size = (PALETTES[palette] || PALETTES.mix).length
  for (let l of list){
    l = `${l}` // to string
    if (Object.keys(used_colors).length == palette_size){
      used_colors = {}
      // console.log("Reset used_colors")
    }
    let nc = colorizef(l, palette)
    // console.log("try", nc)
    while (used_colors[nc]){
      nc = random_color(`${l} ${i}`, palette)
      // console.log("color collission, try:", used_colors, nc)
      i+=1

      if (i>1000)
        throw Error("Could not colorize list. Could not find acceptable color combination")
    }
    used_colors[nc] = true
    ret.push(nc)
  }
  return ret
}

export function colorize_list_hex(list, palette){
  return colorize_list(list, palette, colorize_hex)
}

function hash(str) {
  var hash = 0, i, chr, len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/// Returns a random nice color for the logo icon
export function random_color(str, palette){
  // From http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  const color_set=PALETTES[palette || 'mix']
  if (typeof(str) == 'string')
    return color_set[hash(str)%color_set.length]
  else
    return color_set[str%color_set.length]
}

// http://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
export function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/// Merges two or more dicts into a new one. Do not modify origins. B items have priority.
export function merge(){
  if (Array.isArray(arguments[0])){
    let args=[[], ...arguments]
    return Array.concat.apply(null, args)
  }
  else{
    let args=[{}, ...arguments]
    return Object.assign.apply(null, args)
  }
}

export function object_is_equal(a,b){
  if (a == b) // Fast comparison, for object always false
    return true
  if (a == undefined || b == undefined) // Only one, (see prev comparison), so !=
    return false
  for(let k in a){
    if (!b.hasOwnProperty(k))
      return false
    let v=a[k]
    switch(typeof(v)){
      case 'object':
        if (!object_is_equal(v, b[k]))
          return false
      break;
      case 'function': // Ignore fns
      break;
      default:
        if (v!=b[k])
          return false
      break;
    }
  }
  // Now check also all props of b are in a
  for(let k in b){
    if (!a.hasOwnProperty(k))
      return false
  }
  return true
}

const timeunits={
  millisecond: 1,
  second: 1000,
  minute: 1000 * 60,
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
  MAX: 1000 * 60 * 60 * 24 * 14
}
const one_day=(24*60*60)

i18n_nop("millisecond")
i18n_nop("second")
i18n_nop("minute")
i18n_nop("hour")
i18n_nop("day")

export function pretty_ago(t, now, minres="second"){
  now = moment.utc(now)
  let other = moment.utc(t)
  if (minres && typeof(minres)=="string")
    minres=timeunits[minres]

  let timediff = now.diff(other)

  if (timediff>timeunits.MAX){
    return pretty_date(other, minres)
  }

  let lastunit='millisecond'
  for (let d in timeunits){
    if (timediff >= timeunits[d])
      lastunit=d
  }
  if (timeunits[lastunit] < minres){
    if (minres >= (timeunits["day"]))
      return i18n("today")
    return i18n("now")
  }
  let units
  if (lastunit=="day"){
    // if days, must check on day boundaries, not 24h chunks;
    // 24h+1m ago could be 2 days ago, not yesterday
    units = Math.floor(now.unix() / one_day) - Math.floor(other.unix() / one_day)

    if (units==0)
      return i18n('today')
    if (units==1)
      return i18n('yesterday')
  }
  else{
    units=Math.floor(timediff / timeunits[lastunit])
  }
  const s=units > 1 ? 's' : ''
  let expr=i18n("{units} {timeunit} ago", {units, timeunit: `${i18n(lastunit)}${s}` })
  return expr
}

export function pretty_date(d, precission){
  if (precission >= timeunits.day )
    return moment(d).format("ddd, ll")
  return moment(d).format("llll")
}

const timeunits_abbr={
  ms: 1,
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
  mo: 1000 * 60 * 60 * 24 * 30.41,
  y: 1000 * 60 * 60 * 24 * 365
}

i18n_nop("ms")
i18n_nop("s")
i18n_nop("m")
i18n_nop("h")
i18n_nop("d")
i18n_nop("w")
i18n_nop("mo")


export function pretty_time(time){
  let lastunit='ms'
  for (let d in timeunits_abbr){
    if (time >= timeunits_abbr[d])
      lastunit=d
  }
  let units=Math.round(time / timeunits_abbr[lastunit])
  let expr=i18n("{units}{timeunit}", {units, timeunit: `${i18n(lastunit)}` })
  return expr
}


export const months = [
    i18n_nop("January"),
    i18n_nop("February"),
    i18n_nop("March"),
    i18n_nop("April"),
    i18n_nop("May"),
    i18n_nop("June"),
    i18n_nop("July"),
    i18n_nop("August"),
    i18n_nop("September"),
    i18n_nop("October"),
    i18n_nop("November"),
    i18n_nop("December")
  ]

export const days = [
  i18n_nop("Sunday"),
  i18n_nop("Monday"),
  i18n_nop("Tuesday"),
  i18n_nop("Wednesday"),
  i18n_nop("Thursday"),
  i18n_nop("Friday"),
  i18n_nop("Saturday"),
  i18n_nop("Sunday"),
]

export function unwrap(fn, arg1, arg2){ // If two args, use them, if one, use store.getState() and props, if none, use store.getState and this.props.
  if (!fn) // not existant is as an empty list
    return []
  if (typeof(fn) == "function"){
    return fn(arg1, arg2) || [] // May return undefined, null or falsy
  }
  return fn
}

export function match_traits({has, any, all}){
  has = has || []
  if (all){
    for (let a of all){
      if (has.indexOf(a)<0)
        return false
    }
  }
  if (any){
    for (let a of any){
      if (has.indexOf(a)>=0)
        return true
    }
    return false
  }
  else
    return true
}

/**
 * For each items uses the to_str_f function to extract a description text, and
 * all items at filters (a str list) must be in that description
 */
export function filter_items_str( items, filters, to_str_f = (s) => s){
  let ret = []
  let is_in = true
  for (let i of items){
    is_in = true
    let desc = to_str_f(i).toLocaleLowerCase()
    for (let f of filters){
      if (desc.indexOf(f)<0){
        is_in = false
        break;
      }
    }
    if (is_in)
      ret.push(i)
  }
  return ret
}

export function servername(){
  if (__DEV__)
    return (localStorage.servername || window.location.origin)
  else
    return window.location.origin
}

const RE_DOTCOMA = /^\d{1,3}(|\.\d{3})*(,\d+|)(?=$|[^\d\.,])/
const RE_ISO = /^\d*(\.\d+|)/
/**
 * @short Transforms from several string regex to a proper number
 *
 * Data from DB can come in spanish dotcoma format, just a number, just with a
 * dot, with trailing symbols..
 *
 * This tries hard to transform properly a string to a number
 */
export function to_number(n){
  if (typeof(n) == 'number')
    return n
  n = n.trim()
  if (n.match){
    let m = n.match(RE_DOTCOMA)
    if (m)
      return Number(m[0].replace('.','').replace(',','.'))

    m = n.match(RE_ISO)
    if (m)
      return Number(m[0])
  }
  console.error(`${n} is not a number`)
  throw "Not a number"
}

export default {
  to_map,
  to_list,
  dedup,
  flatmap,
  is_empty,
  map_drop,
  map_get,
  map_set,
  concat,
  sort_by_name,
  colorize,
  colorize_hex,
  colorize_list,
  colorize_list_hex,
  random_color,
  capitalize,
  merge,
  object_is_equal,
  pretty_ago,
  pretty_date,
  pretty_time,
  unwrap,
  match_traits,
  filter_items_str,
  servername,
  to_number,

  days,
  months,
  templates
}
