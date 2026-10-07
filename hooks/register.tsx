import type { EngineInterface as Engine, Register } from 'claude-code'

import { buildMenu, descriptionOf, isModHooks, parseInstalled } from './menu'
import type { CommandInfo, ModEntry } from './menu'

const SELF = 'mod-menu'
const PANE = 'mod-menu'
// Theme color names, so the menu follows the person's light, dark or color-blind theme.
const C = { accent: 'claude', text: 'text', dim: 'inactive', faint: 'subtle', run: 'success' }

// Every installed plugin that loads a hooks module is a mod, from any marketplace.
async function readMods($: Engine): Promise<ModEntry[]> {
  const home = (await $.env.get('HOME')) ?? ''
  const readText = (path: string) => $.fs.read(path).catch(() => '')
  const installed = parseInstalled(await readText(`${home}/.claude/plugins/installed_plugins.json`))
  const mods: { name: string; description: string }[] = []
  for (const p of installed) {
    if (!isModHooks(await readText(`${p.installPath}/hooks/hooks.json`))) continue
    mods.push({ name: p.name, description: descriptionOf(await readText(`${p.installPath}/.claude-plugin/plugin.json`)) })
  }
  let commands: CommandInfo[] = []
  try {
    commands = (await $.command.list()) as CommandInfo[]
  } catch (err) {
    $.ui.log(`mod-menu: could not list commands: ${String(err)}`, { to: 'debug' })
  }
  return buildMenu(mods, commands, SELF)
}

async function openMenu($: Engine) {
  await $.ui.open({ id: PANE, title: 'Mods', focus: true, closeOnEscape: true, rows: 16 })
}

// Close the menu first so the mod's own pane gets the room, then run its command.
async function launch($: Engine, command: string) {
  await $.ui.close({ id: PANE })
  try {
    await $.command.run({ command })
  } catch (err) {
    $.ui.toast(`Couldn't start /${command}: ${String(err)}`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'mods', description: 'Open the menu of your mods' })
    return next(e)
  })

  on('command.run', { command: 'mods' }, async $ => {
    await openMenu($)
    return { text: 'Mods menu opened.' }
  })

  // The button: in the prompt footer's lower-right corner, after Claude Code's own mode labels.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const modes = await next(e)
    return (
      <Box gap={1}>
        {modes}
        {e.props.modes.length > 0 && <Text color={C.faint}>·</Text>}
        <Button key="open-mods" plain label="◆ mods" onPress={() => void openMenu($)} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const mods = await readMods($)
    const width = Math.max(30, e.props.bodyColumns - 2)
    return (
      <Box flexDirection="column" gap={1}>
        <Box justifyContent="space-between">
          <Text color={C.accent} bold>◆ MODS</Text>
          <Text color={C.faint}>tab to move · enter to start · esc to close</Text>
        </Box>
        {mods.length === 0 && (
          <Text color={C.dim}>No mods found: no installed plugin loads a hooks module.</Text>
        )}
        {mods.map(m => (
          <Box key={`mod-${m.name}`} flexDirection="column" borderStyle="round" borderColor={C.faint} paddingX={1} width={width}>
            <Text bold>{m.name}</Text>
            {m.description && <Text color={C.dim} wrap="truncate-end">{m.description}</Text>}
            {m.commands.length === 0 && <Text color={C.faint}>no slash command to start it</Text>}
            {m.commands.map(c => (
              <Box key={`cmd-${c.name}`} gap={1}>
                <Text color={C.run}>▶</Text>
                <Button key={`run-${c.name}`} plain label={`/${c.name}`} onPress={() => void launch($, c.name)} />
                <Text color={C.faint} wrap="truncate-end">{c.description}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    )
  })
}
