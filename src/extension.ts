import * as vscode from 'vscode';
import * as quick_search from './quick_search';
import * as console from './console';
import * as fs from 'fs';
const rg = require('../lib/rg');

let quick_searcher: quick_search.QuickSearcher | null = null;

function checkDownloadRg(context: vscode.ExtensionContext) {
	if (fs.existsSync(rg.rgPath())) {
		return;
	}
    vscode.window.showInformationMessage("miss rg command, download it from github.com?", "Download").then((value?: string) => {
        if (value === "Download") {
			try {
				quick_searcher?.console.console.show();
				rg.downloadRg(function(err: any) {
					quick_searcher?.console.info("downloadRg done ", err)
					if (err) {
						vscode.window.showInformationMessage("download rg failed, " + err);
					} else {
						vscode.window.showInformationMessage("download rg succeeded!");
					}
				});
			} catch (e) {
				quick_searcher?.console.error("rg.downloadRg", e);
            }
        }
    });
}

export function activate(context: vscode.ExtensionContext) {
	let ch = vscode.window.createOutputChannel("xgrep");
	let con = new console.Console(ch);
	rg.setConsole(con);
	rg.tryExtractRg(function(){
		quick_searcher?.retryLastCmd();
		checkDownloadRg(context);
	});

	quick_searcher = new quick_search.QuickSearcher(con);
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.xgrep.quickSearch', quick_searcher.show.bind(quick_searcher)),
		vscode.commands.registerCommand('extension.xgrep.quickSearchPeek', quick_searcher.quickPeek.bind(quick_searcher)),
	);
}

export function deactivate() {
	if (quick_searcher !== null) {
		quick_searcher.dispose();
		quick_searcher = null;
	}
}
