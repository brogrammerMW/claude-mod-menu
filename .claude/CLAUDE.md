# claude-mod-menu

Claude Code mod: a ◆ mods button in the prompt footer (SessionMode site) and `/mods` open a menu of every installed mod; clicking a command runs it. Pure logic in `hooks/menu.ts` (tested), drawing in `hooks/register.tsx`. Check with `claude plugin validate .` and `claude plugin test .`.

## Recent Changes

### feat: mods menu with a footer button that starts installed mods - 2026-10-07
- Branch: `minor/1-mods-menu`
- PR: https://github.com/brogrammerMW/claude-mod-menu/pull/2
- Summary: Footer button plus /mods. Mods are installed plugins whose hooks.json loads a module, from any marketplace; commands match by owning plugin (with or without @marketplace) or by name. A mod with no registered command still shows. Known issue: a mod's command can go missing after /reload-plugins; a new session restores it.
