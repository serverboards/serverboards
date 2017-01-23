import moment from 'moment'

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

const color_set=["red","orange","yellow","olive","green","teal","blue","violet","purple","pink","brown","grey"]
const fixed_colors={
  "stopped" : "_grey",
  "running" : "green",
  "unknown" : "grey",
  "error" : "red",
  "ok" : "green",
  "warning" : "orange",
  "up" : "green",
  "down" : "red",
  "important" : "red",
  "new" : "green",
  "unread" : "yellow",
  "disabled" : "grey",
  "active" : "green",
  "broken" : "red",
  "updatable" : "yellow",
  "": "grey"
}

export function colorize(str){
  str=str.toLowerCase()
  if (fixed_colors[str])
    return fixed_colors[str]
  return random_color(str)
}

/// Returns a random nice color for the logo icon
export function random_color(str){
  // From http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
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

  return color_set[hash(str)%color_set.length]
}

/// Merges two dicts into a new one. Do not modify origins. B items have priority.
export function merge(a,b){
  return Object.assign({}, a, b)
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

export function pretty_ago(t, now, minres="second"){
  now = moment.utc(now)
  let other = moment.utc(t)
  if (minres && typeof(minres)=="string")
    minres=timeunits[minres]

  let timediff = now.diff(other)

  if (timediff>timeunits.MAX){
    return pretty_date(other)
  }

  let lastunit='millisecond'
  for (let d in timeunits){
    if (timediff >= timeunits[d])
      lastunit=d
  }
  if (timeunits[lastunit] < minres){
    if (minres >= (timeunits["day"]))
      return "today"
    return "now"
  }
  let units
  if (lastunit=="day"){
    // if days, must check on day boundaries, not 24h chunks;
    // 24h+1m ago could be 2 days ago, not yesterday
    units = Math.floor(now.unix() / one_day) - Math.floor(other.unix() / one_day)

    if (units==0)
      return 'today'
    if (units==1)
      return 'yesterday'
  }
  else{
    units=Math.floor(timediff / timeunits[lastunit])
  }
  const s=units > 1 ? 's' : ''
  let expr=String(units)+' '+lastunit+s+' ago'
  return expr
}

export function pretty_date(d){
  return moment(d).format("llll")
}

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export function unwrap(fn, arg1, arg2){ // If two args, use them, if one, use store.getState() and props, if none, use store.getState and this.props.
  if (!fn) // not existant is as an empty list
    return []
  if (typeof(fn) == "function"){
    return fn(arg1, arg2) || [] // May return undefined, null or falsy
  }
  return fn
}
