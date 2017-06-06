let assert = require('assert')

describe("Login", () => {

  it("Must be able to log in", function(done){
    browser.url('http://localhost:8080/')
    browser.setViewportSize({
        width: 1000,
        height: 700
    });


    let title = browser.getTitle()
    assert.equal(title, "Serverboards")

    browser.saveScreenshot("./shots/001-login.png")

    $("input[name=email]").waitForExist()

    $('input[name=email]').setValue("test@serverboards.io")
    $('input[name=password]').setValue("asdfasdf")
    $('button.login').click()

    browser.waitUntil(() => $('body').getText().includes("This is how Serverboards works."))

    browser.saveScreenshot("./shots/002-logged-in.png")

    })

    it("Once logged in, can go to user profile", function(){
      $("#profile img").waitForExist()

      $("#profile img").click()
      $('#profile_menu #settings').click()

      browser.saveScreenshot("./shots/003-profile.png")

    })


    it("Logs out", function(){
      $('#profile img').click()
      $('#profile_menu #logout').click()

      $("input[name=email]").waitForExist()

      browser.saveScreenshot("./shots/999-logged-out.png")
    })
})
