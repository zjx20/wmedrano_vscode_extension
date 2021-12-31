# xgrep

Grep the whole workspace and show results in the peek view instead of the file search view.

`xgrep` was inherited from [wmedrano_vscode_extension](https://github.com/wmedrano/wmedrano_vscode_extension) , all credit goes to it.

## Requirements

* [ripgrep](https://github.com/BurntSushi/ripgrep)
* PowerShell (on Windows)

## Features

### Quick Search

`Quick Search` allows using the Quick Input to grep as you type and jump to
file without having to go to the Search pane.
`Quick Search` can be invoked by calling `Quick Search` title command or
binding the "extension.xgrep.quickSearch" command.

Default key binding:
* mac: `cmd + shift + i`
* win: `ctrl + shift + i`

### Quick Search Peek

Almost same as `Quick Search`, except it automatically search for the selected
text or the word at the cursor.

Default key binding:
* mac: `cmd + shift + j`
* win: `ctrl + shift + j`

![preview](https://github.com/zjx20/xgrep/raw/master/preview.gif)

## Extension Settings

There are currently no customizable settings.

## Known Issues

* Search keyword contains special characters (such as ``"'`\.*``) might not work.

## How To Build

```bash
cd <extension folder>
npm install

vsce package
code --install-extension <the .vsix>
```

