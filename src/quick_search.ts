import * as vscode from 'vscode';
import * as child_process from 'child_process';

export class QuickSearcher {
    private query: string;
    private process: child_process.ChildProcess | null;
    private quick_pick: vscode.QuickPick<QuickSearchItem>;

    // Create a new QuickSearcher that can be activated with the show method.
    constructor() {
        this.query = "";
        this.quick_pick = vscode.window.createQuickPick();
        this.process = null;
        this.quick_pick.title = 'Quick Search';
        this.quick_pick.onDidChangeValue(this.onDidChangeValue.bind(this));
        this.quick_pick.onDidAccept(this.onDidAccept.bind(this));
        this.quick_pick.onDidHide(this.hide.bind(this));
    }

    // Show the text input to the user.
    show() {
        this.quick_pick.show();
    }

    // Hide the text input from the user. This kills any search that may be in
    // flight.
    hide() {
        this.maybeKillProcess();
        this.quick_pick.hide();
        this.quick_pick.busy = false;
        this.quick_pick.items = [];
    }

    // Frees up all resources used by `QuickSearcher`. After this call, the
    // instance is no longer useable.
    dispose() {
        this.hide();
        this.quick_pick.dispose();
    }

    // Kill the search process if it exists.
    private maybeKillProcess() {
        if (this.process !== null && !this.process.killed) {
            this.process.kill();
        }
    }

    // Call when there is an accepteable input. It opens the text documents
    // and hids the input.
    private onDidAccept() {
        this.hide();
        for (const item of this.quick_pick.selectedItems) {
            const file = vscode.Uri.file(item.file);
            const options: vscode.TextDocumentShowOptions = {
                selection: new vscode.Range(item.line, item.column, item.line, item.column),
            };
            vscode.window.showTextDocument(file, options);
        }
    }

    // Call when there is a change in the input. A new search for query will
    // commence, canceling any previous searches.
    private onDidChangeValue(query: string) {
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
        const command = this.makeRgCommand();
        this.quick_pick.busy = true;
        this.process = child_process.exec(command, this.onRgFinished.bind(this));
    }

    // Call when ripgrep has finished searching. `stdout` is expected to be
    // ripgrep's JSON output invoked with the --json flag.
    private onRgFinished(err: child_process.ExecException | null, stdout: string, stderr: string): void {
        let matches = [];
        for (const line of stdout.split("\n")) {
            if (line.length === 0) {
                continue;
            }
            // TODO: Use an explicit type for the parsed output from ripgrep.
            const entry = JSON.parse(line);
            if (entry["type"] !== "match") {
                continue;
            }
            const data = entry["data"];
            // TODO: Handle the cases where the "text" field is not present.
            // This happens when the value is not valid UTF-8, in which case,
            // the "bytes" field is populated instead.
            const file: string = data["path"]["text"];
            const text: string = data["lines"]["text"];
            const line_number: any = data["line_number"];
            const match: QuickSearchItem = {
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
        // TODO: Implement a strategy for handling when there are too many
        // matches. This includes defining how many matches is too many.
        this.quick_pick.items = matches;
    }

    // Make a command for the current query by using ripgrep.
    private makeRgCommand(): string {
        let paths: string[] = [];
        /// TODO: The files should be obtained using the workspace API rather than recursively searching the
        // directories. This is to ensure that the same files are being filtered.
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                paths.push(folder.uri.fsPath);
            }
        }
        // Avoid running the command when no path was specified. Running without any specified files may be dangerous
        // as ripgrep will check all files in whatever the current working directory is.
        if (paths.length === 0) {
            console.error("QuickSearcher found no paths in workspace.");
            return "echo";
        }
        // TODO: Support more backends.
        return `rg --json -e '${this.query}' ${paths.join(' ')}`;
    }


}

interface QuickSearchItem extends vscode.QuickPickItem {
    file: string;
    line: number;
    column: number;
}
