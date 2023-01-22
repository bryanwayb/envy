import { fstatSync, statSync } from "fs";
import path = require("path");

const rcedit = require('rcedit');

const exePath = path.resolve(__dirname, './dist/executables/envy.exe');

try {
    statSync(exePath);

    const packageJson = require('./package.json');
    const version = packageJson.version.replace(/[^\d\.]*/gm, '');

    console.log('applying windows executable details');
    rcedit(exePath, {
        'product-version': version,
        'file-version': version,
        'version-string': version,
        'requested-execution-level': 'requireAdministrator',
        //'icon': 'icon path'
    }).then(() => {
        console.log('done');
    }).catch(error => {
        console.log(`error: ${error}`);
    });
}
catch (ex) { }