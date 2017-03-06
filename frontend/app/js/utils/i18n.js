const s_re = /%s/g
const pl_re = /{(.*?)}/g

let trans = {}
let unknown = []

/**
 * @short Checks into the translation store for the translation of this sentence
 *
 * It may have more arguments which will be replaced into each "%s" (and ONLY %s)
 */
export function i18n(txt, ...args){
  let tr = trans[txt]
  if (!tr){
    if (unknown.indexOf(txt)<0)
      unknown.push(txt)
    tr=txt
  }
  return printf(tr, ...args)
}

/**
 * @short Same as i18n but a context is provided.
 *
 * This allows two sentences that in english may be translated as diferent
 * things in another language, to state in which context this is used.
 */
export function i18n_c(ctx, txt, ...args){
  let tr = trans[`${ctx}|${txt}`]
  if (!tr){
    if (unknown.indexOf(txt)<0)
      unknown.push(txt)
    tr=txt
  }
  return printf(tr, ...args)
}

/**
 * @short Formats a string using %s and {name} placeholders
 */
export function printf(tr, ...args){
  // Do replacements
  if (args.length==0){
    return tr
  }
  let placeholders_s=false
  let narg=0

  tr = tr.replace(s_re, (m) => {
    placeholders_s=true
    return args[narg++]
  })
  if (!placeholders_s){
    const context = args[0]
    if (context){
      tr = tr.replace(pl_re, (_, m) => {
        return context[m]
      })
    }
  }
  return tr
}

/**
 * @short Sets some texts to the translation store.
 *
 * Options:
 *   clean: If true, sets only the passed translation strings, else merges them
 */
export function update(newtrans, options={clean: false}){
  if (options.clean){
    trans={}
  }
  // remove new known
  Object.keys(newtrans).map( (o) => {
    unknown = unknown.filter( (u) => u != o)
  })
  const merge = require('app/utils').merge

  trans = merge(trans, newtrans)
}

/**
 * @short Do nothing, returns the same text
 *
 * This is used to mark some text for future translation, but not at this point,
 * for example static data that until rendered would not know to what to
 * translate.
 *
 * Later at render() pass this constant variable through a simple i18n:
 *
 * ```js
 *  const EMPTY=i18n_nop("empty")
 *
 *  render(){
 *    return <span>{i18n(EMPTY)}</span>
 *  }
 * ```
 */
export function i18n_nop(txt){
  return txt
}

export { unknown }

i18n.unknown=unknown
i18n.i18n_nop=i18n_nop
i18n.update=update
i18n.i18n_c=i18n_c

export default i18n
