import { readdirSync, statSync } from 'fs';
import { join as joinPath, relative as relativePath, sep as pathSeparator } from 'path';

function matchesAnyRegExp(input: string, expressions: RegExp[]) {
    for (const i in expressions) {
        if (expressions[i].test(input)) {
            return true;
        }
    }
    return false;
}

function buildDirectoryListing(path: string, expressions: RegExp[]): Array<string> {
    const entries = readdirSync(path);

    const ret = new Array<string>();

    for (const i in entries) {
        const entryRelativePath = joinPath(path, entries[i]);

        if (statSync(entryRelativePath).isDirectory()) {
            const subdirectories = buildDirectoryListing(entryRelativePath, expressions);
            ret.push(...subdirectories);
        }
        else if (matchesAnyRegExp(entryRelativePath, expressions)) {
            ret.push(`.${pathSeparator}${relativePath(__dirname, entryRelativePath) }`);
        }
    }

    return ret;
}

function load(path: string, expressions: RegExp[]): void {
    const files = buildDirectoryListing(path, expressions);
    for (const i in files) {
        try {
            require(files[i]);
        }
        catch (ex) {
            console.error(`Error while loading ${files[i]}`);
            throw ex;
        }
    }
}

load('./src', [ /^.*?\.js$/ ]);