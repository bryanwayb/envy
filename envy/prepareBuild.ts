import { copyFileSync, readdirSync, statSync } from 'fs';
import { join as joinPath, relative as relativePath } from 'path';
import { writeFileSync } from 'fs';

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
            ret.push(`./${relativePath(__dirname, entryRelativePath)}`);
        }
    }

    return ret;
}

function writeRequires(path: string, expressions: RegExp[]): void {
    const files = buildDirectoryListing(path, expressions);
    const windowsSepCharacterRegex = /\\/gm;
    let src = '';
    for (const i in files) {
        try {
            src += 'require(\'' + files[i].replace(windowsSepCharacterRegex, '/') + '\');\n';
        }
        catch (ex) {
            console.error(`Error while loading ${files[i]}`);
            throw ex;
        }
    }
    writeFileSync(joinPath(__dirname, './preloader.js'), src);
}

writeRequires(joinPath(__dirname, './src'), [/^.*?\.js$/]);
copyFileSync(joinPath(process.cwd(), './config.yml'), joinPath(__dirname, './config.yml'));