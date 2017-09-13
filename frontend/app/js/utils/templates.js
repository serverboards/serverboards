export function render_promise(template, future_vars){
  return future_vars.then( (vars) => {
    render(template, vars)
  })
}

const HANDLEBARS_RE=/(\\{{[^}]*}}|{{([^}]*)}})/g

export function render(template, vars){
  if (!template)
    return ""
  if (vars == undefined)
    return ""
  function find_var(v, vars){
    if (v.length==0)
      return vars
    //console.log("Find: %o in %o", v, vars)
    return find_var(v.slice(1), vars[v[0]])
  }
  function vars_replacer(total, _, name){
    console.log("Find and replace: %s in %s", total, JSON.stringify(vars))
    if (total[0]=='\\')
      return total.slice(1)
    const ret = find_var(name.split('.'), vars)
    if (ret == undefined)
      return `{{${name}}}`
    return ret
  }
  return template.replace(HANDLEBARS_RE, vars_replacer)
}
