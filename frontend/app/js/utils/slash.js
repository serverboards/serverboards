export function factory(dict){
  return function(command, args, context){
    const f=dict[command]
    if (f)
      return f(args, context) || ""
    return undefined
  }
}

export function parse(txt, slashfs, context){
  let lines = txt.split('\n')
  lines = lines.map( (l) => {
    if (l[0] != "/")
      return l
    const spl = l.trim().split(' ')
    const slashc=spl[0].slice(1)
    const args=spl.slice(1)
    if (typeof(slashfs)=="function") // convert to list if its not
      slashfs=[slashfs]
    for(const f of slashfs){
      const r=f(slashc, args, context)
      if (r == "")
        return null
      if (r != undefined)
        return r
    }
    return l
  } ).filter( (l) => l!=null )
  return lines.join('\n')
}

export default {factory, parse}
