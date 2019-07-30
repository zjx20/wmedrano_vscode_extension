import * as vscode from 'vscode';
import * as quick_search from './quick_search';
import * as config_generator from './config_generator';

let quick_searcher: quick_search.QuickSearcher | null = null;

export function activate(context: vscode.ExtensionContext) {
	quick_searcher = new quick_search.QuickSearcher();
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.wmedrano.quickSearch', quick_searcher.show.bind(quick_searcher)),
		vscode.commands.registerCommand('extension.wmedrano.writeConfig', config_generator.writeToEditor),
	);
}

export function deactivate() {
	if (quick_searcher !== null) {
		quick_searcher.hide();
		quick_searcher = null;
	}
}
