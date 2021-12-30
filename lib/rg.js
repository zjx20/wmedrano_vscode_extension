// @ts-check
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const child_process = require('child_process');

const download = require('./download');

const fsExists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const exec = util.promisify(child_process.exec);
let myconsole = console;

const forceInstall = process.argv.includes('--force');
if (forceInstall) {
    myconsole.log('--force, ignoring caches');
}

const VERSION = 'v13.0.0-2';
const BIN_PATH = path.join(__dirname, '../bin');

process.on('unhandledRejection', (reason, promise) => {
    myconsole.log('Unhandled rejection: ', promise, 'reason:', reason);
});

async function isMusl() {
    let stderr;
    try {
        stderr = (await exec('ldd --version')).stderr;
    } catch (err) {
        stderr = err.stderr;
    }
    if(stderr.indexOf('musl') > -1) {
        return true;
    }
    return false;
}

async function getTarget() {
    const arch = process.env.npm_config_arch || os.arch();

    switch (os.platform()) {
        case 'darwin':
            return arch === 'arm64' ? 'aarch64-apple-darwin' :
                'x86_64-apple-darwin';
        case 'win32':
            return arch === 'x64' ? 'x86_64-pc-windows-msvc' :
                arch === 'arm' ? 'aarch64-pc-windows-msvc' :
                'i686-pc-windows-msvc';
        case 'linux':
            return arch === 'x64' ? 'x86_64-unknown-linux-musl' :
                arch === 'arm' ? 'arm-unknown-linux-gnueabihf' :
                arch === 'armv7l' ? 'arm-unknown-linux-gnueabihf' :
                arch === 'arm64' ? await isMusl() ? 'aarch64-unknown-linux-musl' : 'aarch64-unknown-linux-gnu' :
                arch === 'ppc64' ? 'powerpc64le-unknown-linux-gnu' :
                arch === 's390x' ? 's390x-unknown-linux-gnu' :
                    'i686-unknown-linux-musl'
        default: throw new Error('Unknown platform: ' + os.platform());
    }
}

async function _downloadRg(done, quick_try) {
    const binExists = await fsExists(_rgPath());
    if (!forceInstall && binExists) {
        myconsole.log('bin/ folder already exists, exiting');
        return;
    }

    if (!binExists) {
        await mkdir(BIN_PATH, {recursive: true});
    }

    const opts = {
        version: VERSION,
        token: process.env['GITHUB_TOKEN'],
        target: await getTarget(),
        destDir: BIN_PATH,
        force: forceInstall,
        console: myconsole,
        quick_try: quick_try,
    };
    try {
        myconsole.info(`Start download ripgrep`);
        myconsole.info(`Tips: if you have any trouble about the automatic downloading, you can download ripgrep manually from https://github.com/microsoft/ripgrep-prebuilt/releases (${await getTarget()}) and then place the extracted file to ${_rgPath()}`)
        await download(opts);
        myconsole.info(`Download ripgrep succeeded`);
        done();
    } catch (err) {
        myconsole.error(`Downloading ripgrep failed: ${err.stack}`);
        done(err);
    }
}

function _rgPath() {
    return path.join(__dirname, `../bin/rg${process.platform === 'win32' ? '.exe' : ''}`);
}

module.exports.tryExtractRg = function(cb) {
    _downloadRg(cb, true);
};

module.exports.downloadRg = function(cb) {
    _downloadRg(cb);
};

module.exports.setConsole = function(c) {
    myconsole = c;
};

module.exports.rgPath = function() {
    return _rgPath();
};
