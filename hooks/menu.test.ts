import { test, expect } from 'claude-code/testing'
import { baseName, buildMenu, descriptionOf, isModHooks, parseInstalled } from './menu'

test('installed plugins: names without the marketplace, with their folders', () => {
  const text = '{"version":2,"plugins":{"youtube@my-mods":[{"installPath":"/c/yt"}],"flightdeck@claude-flightdeck":[{"installPath":"/c/fd"}],"broken@x":[{}]}}'
  expect(parseInstalled(text)).toEqual([{ name: 'youtube', installPath: '/c/yt' }, { name: 'flightdeck', installPath: '/c/fd' }])
  expect(parseInstalled('nope')).toEqual([])
  expect(baseName('mission@my-mods')).toBe('mission')
})

test('a mod is a plugin whose hooks.json loads a module', () => {
  expect(isModHooks('{ "modules": ["./register.tsx"] }')).toBe(true)
  expect(isModHooks('{ "hooks": { "PreToolUse": [] } }')).toBe(false)
  expect(isModHooks('')).toBe(false)
  expect(descriptionOf('{"name":"x","description":"Live dashboard"}')).toBe('Live dashboard')
  expect(descriptionOf('{')).toBe('')
})

test('menu: every mod alphabetical, commands matched with or without @marketplace, self left out', () => {
  const mods = [
    { name: 'youtube', description: 'YouTube in a pane' }, { name: 'flightdeck', description: 'Dashboard' },
    { name: 'mission', description: 'Missions' }, { name: 'mod-menu', description: 'Menu' }, { name: 'quiet', description: '' },
  ]
  const commands = [
    { name: 'youtube', description: 'Search YouTube', source: 'plugin', plugin: 'youtube@my-mods' },
    { name: 'flightdeck', description: 'Open the dashboard', source: 'plugin', plugin: 'flightdeck' },
    { name: 'mission', description: 'Mission pane', source: 'user' }, // hook-registered: any source
    { name: 'mods', description: 'Menu', source: 'plugin', plugin: 'mod-menu@my-mods' },
    { name: 'compact', description: 'Built in', source: 'builtin' },
  ]
  const menu = buildMenu(mods, commands, 'mod-menu')
  expect(menu.map(m => m.name)).toEqual(['flightdeck', 'mission', 'quiet', 'youtube'])
  expect(menu.map(m => m.commands.map(c => c.name))).toEqual([['flightdeck'], ['mission'], [], ['youtube']])
})
