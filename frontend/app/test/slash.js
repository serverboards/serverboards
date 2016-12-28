import slash from 'app/utils/slash'
import assert from 'assert'

describe("Parse", () => {
  it("Should not change if no slash commands", () => {
    assert.equal( slash.parse("Hello world"), "Hello world")
  })
  it("Should change if any slash command in a single line", () => {
    const slashc=slash.factory({test: (args) => `[TEST ${args.join(" ")}]`})

    assert.equal(slash.parse("Hello world.\n/test hola mundo\n", [slashc]), "Hello world.\n[TEST hola mundo]\n")
  })
  it("Unknown slash stay as is", () => {
    assert.equal(slash.parse("Hello world.\n/test hola mundo\n", []), "Hello world.\n/test hola mundo\n")
  })
  it("Could have side effects on the context", () => {
    const slashc=slash.factory({test: (args, context) => { context.push(args); return null }})
    let context=[]
    assert.equal(slash.parse("Hello world.\n/test hola mundo\n", [slashc], context), "Hello world.\n")
      assert.deepEqual(context, [["hola","mundo"]])
  })
})
