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
  // 2017-12-12 -- Use standard mustache, this feature disapears. Mustache is used to use conditionals.
  xit("Unknown marks leave as is", () => {
    assert.equal( render("Hello {{world}}", {}), "Hello {{world}}")
    assert.equal( render("Hello {{a.world}}", {a:10}), "Hello {{a.world}}")
    assert.equal(
      render("Hello {{b.world}}", {}),
      "Hello {{b.world}}"
    )
  })
  // 2017-12-12 -- Use standard mustache, no escaping, use &#123;{var}}
  xit("Can scape {{ }} with \\", () => {
    assert.equal( render("Hello \\{{world}}", {world: "world!"}), "Hello {{world}}")
  })
  // 2017-12-12 -- Use standard mustache, this feature disapears. Mustache is used to use conditionals.
  xit("No vars, return the same template", () => {
    assert.equal( render("Hello {{world}}", undefined),  "Hello {{world}}")
  })
})
