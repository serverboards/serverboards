/// Convert a list of key,value into an object
function to_map(l){
  let d={}
  for(let kv of l)
    d[kv[0]]=kv[1]
  return d
}

/// Drops some keys from a map, and returns a copy without these keys
/// Its optimized for a small ammount of keys O(N²)
function map_drop(map, keys){
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

export {to_map, map_drop}
