import * as vscode from 'vscode';

function generate(): { [key: string]: any } {
    let config: { [key: string]: any } = {
        'workbench.colorTheme': 'One Monokai',

        // TODO: This should be detected based on the screen size or not
        // overwritten at all.
        'window.zoomLevel': 2,

        'editor.fontFamily': 'Fira Mono',

        'zenMode.fullScreen': false,
        'zenMode.hideStatusBar': false,
        'zenMode.hideLineNumbers': false,

        'git.enableSmartCommit': true,

        'typescript.preferences.quoteStyle': 'single',
        'javascript.preferences.quoteStyle': 'single',

        'rust.clippy_preference': 'on',

        'vim.useSystemClipboard': true,
        'vim.visualModeKeyBindings': [
            { before: ['g', 's'], commands: ['editor.action.sortLinesAscending'] },
        ],
        'vim.normalModeKeyBindings': [
            { before: ['<C-d>'], commands: ['editor.action.joinLines'] },
            { before: ['g', 'e'], commands: ['editor.action.marker.nextInFiles'] },
        ],
        'vim.insertModeKeyBindingsNonRecursive': [
            { before: ['j', 'j'], after: ['Escape'] },
        ],
    };
    const vim_visual_and_normal_shared_bindings = [
        { before: ['g', '/'], commands: ['extension.wmedrano.quickSearch'] },
        { before: ['g', 'p'], commands: ['workbench.action.quickOpen'] },
        { before: ['g', 'z'], commands: ['workbench.action.toggleZenMode'] },
        { before: ['J'], after: ['3', '0', 'j', 'z', 'z'] },
        { before: ['K'], after: ['3', '0', 'k', 'z', 'z'] },
    ];
    for (let binding of vim_visual_and_normal_shared_bindings) {
        config['vim.visualModeKeyBindings'].push(binding);
        config['vim.normalModeKeyBindings'].push(binding);
    }
    return config;
}

// Write the JSON text configuration to a editor. If no editor is specified,
// then the currently active editor is used.
export function writeToEditor(editor: vscode.TextEditor | undefined) {
    if (!editor) {
        editor = vscode.window.activeTextEditor;
    }
    if (!editor) {
        console.error('No editor could be picked for writeToEditor.');
        return;
    }
    const range = editor.document.validateRange(new vscode.Range(0, 0, editor.document.lineCount, 0));
    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        let config = generate();
        // TODO: Sort the config to improve readability.
        let text = JSON.stringify(config, undefined, 4);
        editBuilder.delete(range);
        editBuilder.insert(range.start, text);
    });
}