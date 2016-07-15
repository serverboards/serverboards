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
