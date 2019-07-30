import * as vscode from 'vscode';
import * as child_process from 'child_process';

interface RipgrepperItem extends vscode.QuickPickItem {
	file: string;
	line: number;
	column: number;
}

class Ripgrepper {
	query: string;
	process: child_process.ChildProcess | null;
	quick_pick: vscode.QuickPick<RipgrepperItem>;

	constructor() {
		this.query = "";
		this.quick_pick = vscode.window.createQuickPick();
		this.process = null;
		this.quick_pick.onDidChangeValue(this.onDidChangeValue.bind(this));
		this.quick_pick.onDidAccept(this.onDidAccept.bind(this));
		this.quick_pick.onDidHide(this.hide.bind(this));
	}

	show() {
		this.quick_pick.show();
	}

	hide() {
		this.quick_pick.hide();
		this.maybeKillProcess();
	}

	maybeKillProcess() {
		if (this.process !== null && !this.process.killed) {
			this.process.kill();
		}
	}

	onDidAccept() {
		this.hide();
		for (let item of this.quick_pick.selectedItems) {
			let file = vscode.Uri.file(item.file);
			let options: vscode.TextDocumentShowOptions = {
				selection: new vscode.Range(item.line, item.column, item.line, item.column),
			};
			vscode.window.showTextDocument(file, options);
		}
	}

	onDidChangeValue(query: string) {
		// TODO: Make the query interpretation configurable. This particular
		// formatting causes all spaces to match anything.
		query = query.split(" ").map((s) => s.trim()).filter((s) => s.length > 0).join('.*');
		// Avoid doing any work if the query hasn't changed.
		if (query === this.query) {
			return;
		}
		this.query = query;
		this.maybeKillProcess();
		// TODO: Make configurable.
		const MINIMUM_REQUIRED_LENGTH = 3;
		if (query.length < MINIMUM_REQUIRED_LENGTH) {
			return;
		}
		let command = this.makeCommand();
		this.quick_pick.busy = true;
		this.process = child_process.exec(command, this.onRgFinished.bind(this));
	}

	onRgFinished(err: child_process.ExecException | null, stdout: string, stderr: string): void {
		let matches = [];
		for (let line of stdout.split("\n")) {
			if (line.length === 0) {
				continue;
			}
			// TODO: Use an explicit type for the parsed output from ripgrep.
			let entry = JSON.parse(line);
			if (entry["type"] !== "match") {
				continue;
			}
			let data = entry["data"];
			// TODO: Handle the cases where the "text" field is not present.
			// This happens when the value is not valid UTF-8, in which case,
			// the "bytes" field is populated instead.
			let file: string = data["path"]["text"];
			let text: string = data["lines"]["text"];
			let line_number: any = data["line_number"];
			let match: RipgrepperItem = {
				file: file,
				// ripgrep uses 1 based line number while vscode usually takes
				// 0 based line indices.
				line: line_number - 1,
				column: data["submatches"][0]["start"],
				label: `$(file) ${vscode.workspace.asRelativePath(file, false)}`,
				description: `${line_number}: ${text}`,
				alwaysShow: true,
			};
			matches.push(match);
		}
		this.quick_pick.busy = false;
		this.quick_pick.items = matches;
	}

	makeCommand(): string {
		let paths: string[] = [];
		/// TODO: The files should be obtained using the workspace API rather than recursively searching the
		// directories. This is to ensure that the same files are being filtered.
		if (vscode.workspace.workspaceFolders) {
			for (let folder of vscode.workspace.workspaceFolders) {
				paths.push(folder.uri.fsPath);
			}
		}
		// Avoid running the command when no path was specified. Running without any specified files may be dangerous
		// as ripgrep will check all files in whatever the current working directory is.
		if (paths.length === 0) {
			console.error("Ripgrepper found no paths in workspace.");
			return "echo";
		}
		return `rg --json -e '${this.query}' ${paths.join(' ')}`;
	}
}

let rg: Ripgrepper | null = null;

export function activate(context: vscode.ExtensionContext) {
	rg = new Ripgrepper();
	let disposable = vscode.commands.registerCommand('extension.wmedrano.quickGrep', rg.show.bind(rg));

	context.subscriptions.push(disposable);
}

export function deactivate() {
	if (rg !== null) {
		rg.hide();
		rg = null;
	}
}
