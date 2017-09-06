let assert = require('assert')

describe("Dashboard", () => {
  it("logs in", function(){
    browser.url('http://localhost:8080/')
    browser.setViewportSize({
        width: 1000,
        height: 700
    });

    $("input[name=email]").waitForExist()
    $('input[name=email]').setValue("test@serverboards.io")
    $('input[name=password]').setValue("asdfasdf")
    $('button.login').click()

    browser.waitUntil(() => $('body').getText().includes("This is how Serverboards works."))
  })

  it("Creates a project", function(){
    $('#add_project').waitForExist()
    $('#add_project').click()
    $('input[name=name]').waitForExist()

    browser.saveScreenshot("./shots/010-add-project.png")


    $('input[name=name]').setValue("TEST-01")
    $('textarea[name=description]').setValue("This is the TEST nr 01")
    $('button[type=submit]').click()
    browser.waitUntil(() => $('body').getText().includes("Start adding Widgets into your project's Dashboard"))
    $$('.message .close.icon').map( f => f.click() ) // Close messages

    browser.saveScreenshot("./shots/011-add-project-ok.png")

    $('#project_selector').click()
    $('=TEST-01').waitForExist()

    browser.saveScreenshot("./shots/017-dashboard-list-1.png")

  })

  it("Adds a widget", function(){
    $('.ui.floating.bottom.right.add a').click()
    $('.ui.mid.massive.button.add.area.chart.yellow.icon').waitForExist()
    $('.ui.mid.massive.button.add.area.chart.yellow.icon').click()

    browser.saveScreenshot("./shots/012-add-widget.png")
    $('div.selection.ui.dropdown').click()
    $('div[data-value="serverboards.core.widgets/markdown"]').waitForExist()
    $('div[data-value="serverboards.core.widgets/markdown"]').click()

    $('textarea[name=text]').waitForExist()
    $('textarea[name=text]').setValue("# This is a widget test")
    $('.ui.modal button.ui.button.yellow').click()

    $('.board .card h1').waitForExist()
    browser.saveScreenshot("./shots/013-markdown-widget.png")
  })

  it("Adds another board", function(){
    $('a#add_dashboard').click()
    $('.ui.modal .ui.field input[type=text]').waitForExist()
    browser.saveScreenshot("./shots/014-add-dashboard.png")
    $('.ui.modal .ui.field input[type=text]').setValue("test")
    $('.ui.modal button').click()

    $('.ui.attached.tabular.menu').$('=test').waitForExist()
    $('.ui.attached.tabular.menu').$('=test').click()
    // now has not
    $('.board .card h1').waitForExist(500, true) // not exists. May fail if previous test failed.

    $('.ui.attached.tabular.menu').$('=Monitoring').click()
    // now has it
    $('.board .card h1').waitForExist(500)
    browser.saveScreenshot("./shots/015-at-new-dashboard.png")
  })

  it("Another project, change of widgets", function(){
    $('#side_menu_toggle').click()

    browser.saveScreenshot("./shots/016-A.png")

    $('#add_project').waitForExist()
    $('#add_project').click()
    browser.saveScreenshot("./shots/016-B.png")
    $('input[name=name]').waitForExist()
    $('input[name=name]').setValue("TEST-02")
    browser.saveScreenshot("./shots/016-C.png")
    $('textarea[name=description]').setValue("This is the TEST nr 02")
    $('button[type=submit]').click()
    browser.saveScreenshot("./shots/016-D.png")
    $$('.message .close.icon').map( f => f.click() ) // Close messages

    browser.saveScreenshot("./shots/016-E.png")

    $('#project_selector').click()
    browser.saveScreenshot("./shots/016-F.png")
    $('=TEST-01').waitForExist()

    browser.saveScreenshot("./shots/016-dashboard-list.png")

    $('=TEST-01').click()
    $('.board .card h1').waitForExist()

    $('#project_selector').click()
    $('=TEST-02').waitForExist()
    $('=TEST-02').click()
    $('.board .card h1').waitForExist(500, true) // not exists
  })
})
