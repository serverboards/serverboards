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
  "unread" : "yellow"
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

export function pretty_ago(t, now, minres){
  if (!now)
    now = new Date()
  let other = new Date(t)
  let timediff = now-other

  if (timediff>timeunits.MAX){
    return pretty_date(other)
  }

  let lastunit='millisecond'
  for (let d in timeunits){
    if (timediff > timeunits[d])
      lastunit=d
  }
  if (timeunits[lastunit] < minres)
    return "now"
  const units=Math.round(timediff / timeunits[lastunit])
  const s=units > 1 ? 's' : ''
  let expr=String(units)+' '+lastunit+s+' ago'
  if (expr=="1 day ago")
    expr="yesterday"
  return expr
}

export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
export function pretty_date(d){
  return weekdays[d.getDay()] + ", " + months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}
