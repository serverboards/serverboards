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
    if (total[0]=='\\')
      return total.slice(1)
    try{
      const ret = find_var(name.split('.'), vars)
      if (ret == undefined)
        return `{{${name}}}`
      return ret
    }
    catch(e){
      return `{{${name}}}`
    }
  }
  return template.replace(HANDLEBARS_RE, vars_replacer)
}

export default {render, render_promise}
