// Pure menu logic: which installed plugins are mods, and which commands start them.

export type CommandInfo = { name: string; description: string; source: string; plugin?: string }
export type ModEntry = { name: string; description: string; commands: { name: string; description: string }[] }
export type InstalledPlugin = { name: string; installPath: string }

// "youtube@my-mods" → "youtube"
export const baseName = (id: string) => id.split('@')[0] ?? id

// ~/.claude/plugins/installed_plugins.json: { plugins: { "name@market": [{ installPath, ... }] } }
export function parseInstalled(text: string): InstalledPlugin[] {
  try {
    const j = JSON.parse(text) as { plugins?: Record<string, unknown> }
    return Object.entries(j.plugins ?? {}).flatMap(([id, v]) => {
      const entry = (Array.isArray(v) ? v[0] : v) as { installPath?: unknown } | undefined
      return typeof entry?.installPath === 'string' ? [{ name: baseName(id), installPath: entry.installPath }] : []
    })
  } catch {
    return []
  }
}

// A plugin is a mod when its hooks.json loads a hooks module ("modules"), not just shell hooks.
export function isModHooks(hooksJson: string): boolean {
  try {
    const j = JSON.parse(hooksJson) as { modules?: unknown }
    return Array.isArray(j.modules) && j.modules.length > 0
  } catch {
    return false
  }
}

export function descriptionOf(pluginJson: string): string {
  try {
    const d = (JSON.parse(pluginJson) as { description?: unknown }).description
    return typeof d === 'string' ? d : ''
  } catch {
    return ''
  }
}

// One card per mod, alphabetical, the menu itself left out. A command belongs to a mod when the
// engine says that plugin added it (with or without "@marketplace"), or its name is the mod's
// name or "mod:…", whatever source the engine reports for it. A mod with no command still shows, so a missing one is visible.
export function buildMenu(mods: { name: string; description: string }[], commands: CommandInfo[], self: string): ModEntry[] {
  return mods
    .filter(m => m.name !== self)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(m => ({
      ...m,
      commands: commands
        // By name whatever the source says (a hook-registered command may not report 'plugin'),
        // or by the plugin the engine names.
        .filter(c => c.name === m.name || c.name.startsWith(`${m.name}:`)
          || (c.plugin !== undefined && baseName(c.plugin) === m.name))
        .map(c => ({ name: c.name, description: c.description }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
}
