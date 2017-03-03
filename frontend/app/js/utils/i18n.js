import {merge} from 'app/utils'
const s_re = /%s/g
const pl_re = /{(.*?)}/g

let lang = 'es'
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
  console.log("Updated translations %o", options)
  if (options.clean){
    trans={}
  }
  // remove new known
  Object.keys(newtrans).map( (o) => {
    unknown = unknown.filter( (u) => u != o)
  })
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

export { unknown, lang }

i18n.unknown=unknown
i18n.lang=lang
i18n.i18n_nop=i18n_nop
i18n.update=update

export default i18n
