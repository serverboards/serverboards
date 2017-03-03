
import {i18n, i18n_nop, unknown, update} from 'app/utils/i18n'
import assert from 'assert'

describe("I18N", () => {
  it("Must passtrough unknown texts", () => {
    assert.equal( i18n("untranslatable"), "untranslatable" )
  })
  it("Must set internal data, even on unknown texts", () => {
    assert.equal( i18n("untranslatable %s", "me"), "untranslatable me" )
    assert.equal( i18n("untranslatable %s %s %d", "me", 1), "untranslatable me 1 %d" )
  })
  it("Unknown sentences must be stored for later translation", () => {
    i18n("untranslatable")
    assert( unknown.indexOf("untranslatable") >= 0)
  })
  it("Unknown sentences must be stored for later translation, only once", () => {
    i18n("untranslatable")
    i18n("untranslatable")
    assert.equal( i18n.unknown.reduce( ((acc, val) => (val=="untranslatable") ? acc+1 : acc), 0), 1)
  })

  it("Can add sentences to the i18n store, and will be translated", () => {
    update({"hello": "hola"})
    assert( i18n("hello") == "hola" )
    update({"hello %s": "hola %s"})
    assert( i18n("hello %s", "David") == "hola David" )
    // not removed
    assert( i18n("hello") == "hola" )
  })
  it("Can start an empty store", () => {
    update({"hello": "hola"})
    assert( i18n("hello") == "hola" )
    update({"hello %s": "hola %s"}, {clean: true})
    assert( i18n("hello %s", "David") == "hola David" )
    // not removed
    assert( i18n("hello") == "hello" )
  })
  it("Can use {} as placeholders", () => {
    update({"hello {name}": "hola {name}", "hello {name} <{email}>": "hola {name} <{email}>"}, {clean: true})
    assert.equal( i18n("hello {name}", {name: "David"}), "hola David" )
    assert.equal( i18n("hello {name} <{email}>", {name: "David", email: "dmoreno@localhost"}), "hola David <dmoreno@localhost>" )

  })
})

describe("I18N_NOP", () => {
  it("Just pass data through", () => {
      assert.equal(i18n_nop("test do nothing"), "test do nothing")
  })
})
