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

    browser.waitUntil(() => $('body').getText().includes("Start by creating your first project"))

    browser.saveScreenshot("./shots/002-logged-in.png")

    })

  it("Once logged in, can go to user profile", function(){
    browser.saveScreenshot("./shots/003-A.png")
    $("#top-menu #profile").waitForExist()

    browser.saveScreenshot("./shots/003-B.png")
    $("#profile").click()
    $("#top-menu #profile_menu #user").waitForVisible()
    browser.saveScreenshot("./shots/003-C.png")
    $('#top-menu #profile_menu #user').click()

    browser.saveScreenshot("./shots/003-profile.png")

  })

  it("Can navigate to top level sections, data is shown", function(){
    $('#top-menu #settings').click()
    browser.waitForText('.ui.top.header.secondary')
    browser.saveScreenshot("./shots/004-settings.png")
    assert( $('.ui.top.header.secondary').getText().includes("General information") )

    $('#top-menu #actions').click()
    browser.waitForText('.ui.top.menu.secondary')
    browser.saveScreenshot("./shots/005-processes.png")
    assert( $('.ui.top.menu.secondary').getText().includes("Process history") )

    $('#top-menu #notifications').click()
    browser.waitForText('.ui.top.menu.secondary')
    browser.saveScreenshot("./shots/006-notifications.png")
    assert( $('.ui.top.menu.secondary').getText().includes("All Notifications") )

    $('#top-menu #issues').click()
    browser.waitForText('.ui.top.menu.secondary')
    browser.saveScreenshot("./shots/007-issues.png")
    assert( $('.ui.top.menu.secondary').getText().includes("Issues") )

    $('#top-menu #projects').click()
    browser.waitForText('.ui.main.area .ui.container.centered')
    browser.saveScreenshot("./shots/008-projects.png")
    assert( $('.ui.main.area .ui.container.centered').getText().includes("This is how Serverboards works.") )

  })


  it("Logs out", function(){
    browser.saveScreenshot("./shots/009-A.png")
    $('#profile img').click()
    $('#profile_menu #logout').waitForExist()
    browser.saveScreenshot("./shots/009-B.png")
    $('#profile_menu #logout').click()

    $("input[name=email]").waitForExist()
    browser.saveScreenshot("./shots/009-logged-out.png")
  })
})
