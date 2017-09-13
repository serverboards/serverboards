import {render} from 'app/utils/templates'
import assert from 'assert'

describe("Templates", () => {
  it("No marks, returns same text", () => {
    assert.equal( render("Text",{}), "Text" )
  })
  it("Some marks, returns marked text", () => {
    assert.equal( render("Hello {{world}}", {world: "world!"}), "Hello world!")
    assert.equal(
      render("Hello {{a.world}}", {world: "world!", a:{world:"world A!"}}),
      "Hello world A!"
    )
    assert.equal(
      render("Hello {{b.world}}", {world: "world!", a:{world:"world A!"}, b:{world:"world B!"}}),
      "Hello world B!"
    )
  })
  it("Unknown marks leave as is", () => {
    assert.equal( render("Hello {{world}}", {}), "Hello {{world}}")
    assert.equal( render("Hello {{a.world}}", {a:10}), "Hello {{a.world}}")
  })
  it("Can scape {{ }} with \\", () => {
    assert.equal( render("Hello \\{{world}}", {world: "world!"}), "Hello {{world}}")
  })
})
