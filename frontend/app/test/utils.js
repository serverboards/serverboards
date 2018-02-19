import {pretty_ago, object_is_equal, map_get, match_traits} from 'app/utils'
import assert from 'assert'

describe("Pretty print", () => {
  it("should print now if time is too close", () => {
    const now="2016-12-28"
    assert.equal(pretty_ago(now, now), "now")
  })

  it("should print sec, min, hour, day as further", () => {
    const now="2016-12-28T12:00:30"
    assert.equal(pretty_ago("2016-12-28T12:00:29", now, "second"), "1 second ago")
    assert.equal(pretty_ago("2016-12-28T11:59:31", now, "second"), "59 seconds ago")

    assert.equal(pretty_ago("2016-12-28T11:59:30", now, "second"), "1 minute ago")
    assert.equal(pretty_ago("2016-12-28T11:00:31", now, "second"), "59 minutes ago")

    assert.equal(pretty_ago("2016-12-28T11:00:30", now, "second"), "1 hour ago")
    assert.equal(pretty_ago("2016-12-27T12:00:31", now, "second"), "23 hours ago")

    assert.equal(pretty_ago("2016-12-26T00:00:00", "2016-12-27T00:00:00", "second"), "yesterday")
    assert.equal(pretty_ago("2016-12-25T23:59:59", "2016-12-27T00:00:00", "second"), "2 days ago")

    assert.equal(pretty_ago("2016-12-27T11:00:30", now, "second"), "yesterday")
    assert.equal(pretty_ago("2016-12-27T00:00:00", now, "second"), "yesterday")
    assert.equal(pretty_ago("2016-12-26T23:59:59", now, "second"), "2 days ago")
    assert.equal(pretty_ago("2016-12-26T00:00:00", now, "second"), "2 days ago")
    assert.equal(pretty_ago("2016-12-25T23:59:59", now, "second"), "3 days ago")

  })

  it("Should be able to know if objects are equal", () => {
    assert.ok( object_is_equal({}, {}), '{}, {}' )
    assert.ok( !object_is_equal({alias:"1234"}, {}), "{alias:'1234'}, {}" )
    assert.ok( !object_is_equal({}, {alias:"1234"}), "{}, {alias:'1234'}" )
  })

  it("Should do the map_get", () => {
    assert.equal( map_get({a: 1}, ["a"]), 1 )
    assert.equal( map_get({a: 1}, ["b"]), undefined )
    assert.equal( map_get({a: 1, b: {c: 2}}, ["b", "c"]), 2 )
  })

  it("Should match traits in several cases", () => {
    assert.equal( match_traits({has: [], any: []}),  false,
      "It does not match any, as there is none to match")
    assert.equal( match_traits({has: ["test"], any: []}), false,
      "It does not match any, as there is none to match (2)")
    assert.equal( match_traits({has: ["test"], any: ["one", "two"]}), false,
      "No match coincidence")
    assert.equal( match_traits({has: ["test"], any: ["one", "two", "test"]}), true,
      "Match coincidence")
    assert.equal( match_traits({has: [], any: ["one", "two", "test"]}), false,
      "No match coincidence on empty has")


    assert.equal( match_traits({has: [], all: []}), true,
      "Nothing to match at all, matches")
    assert.equal( match_traits({has: ["test"], all: []}), true,
      "Nothing to match at all, and have some, matches")
    assert.equal( match_traits({has: ["one", "test"], all: ["test", "one"]}), true,
      "Matches all")
    assert.equal( match_traits({has: ["one", "two", "test"], all: ["test", "one"]}), true,
      "Matches all, and even has more")

  })
})
