import * as vscode from 'vscode';

export class Console {
    public console: vscode.OutputChannel;

    constructor(ch: vscode.OutputChannel) {
        this.console = ch;
    }

    public log(...args: any[]) {
        this.console.appendLine(args.join(" "));
    }

    public debug(...args: any[]) {
        this.console.appendLine("[DBG] " + args.join(" "));
    }

    public info(...args: any[]) {
        this.console.appendLine("[INF] " + args.join(" "));
    }

    public warn(...args: any[]) {
        this.console.appendLine("[WAR] " + args.join(" "));
    }

    public error(...args: any[]) {
        this.console.appendLine("[ERR] " + args.join(" "));
    }

    public append(...args: any[]) {
        this.console.append(args.join(" "));
    }
}