import { test, expect, mock } from 'claude-code/testing'

test('the footer button and the menu draw on terminal and desktop', async ($, on) => {
  mock.clock(on)
  mock.env(on, { HOME: '/nowhere' })
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e); return <Text>ENGINE</Text> })
  for (const surface of ['terminal', 'desktop'] as const) {
    const band = await $.ui.mount({
      plugin: 'mod-menu', surface, component: 'SessionMode',
      props: { modes: ['focus'] },
      viewport: { columns: 80, rows: 1 },
    } as never)
    expect(await band.find({ key: 'open-mods' })).toBeDefined()
    await band.unmount()
    const menu = await $.ui.mount({
      plugin: 'mod-menu', surface, component: 'Pane', requestId: 'mod-menu',
      props: { title: 'Mods', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { bodyRows: 30 } },
      viewport: { columns: 80, rows: 30 },
    } as never)
    expect(await menu.find({ type: 'Text', text: /MODS/ })).toBeDefined()
    await menu.unmount()
  }
})
