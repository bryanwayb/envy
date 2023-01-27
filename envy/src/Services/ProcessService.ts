import { exec, ExecException } from 'child_process';
import { lstat } from 'fs/promises';
import { platform } from 'os';
import Container, { Service } from 'typedi';
import LoggerService, { LogLevel } from './LoggerService';

export enum EnumOperatingSystem {
    Windows,
    Linux
};

export class ProcessServiceEnvironment {
    public readonly Environment: { [key: string]: string } = Object.assign({}, process.env);
    public readonly OS: EnumOperatingSystem;

    constructor(os: EnumOperatingSystem = null) {
        if (os) {
            this.OS = os;
        }
        else {
            switch (platform().toLowerCase()) {
                case 'win32':
                    this.OS = EnumOperatingSystem.Windows
                    break;
                default:
                    this.OS = EnumOperatingSystem.Linux;
                    break;
            }
        }
    }

    private GetEnvironmentVariableName(key: string) {
        key = key.toLowerCase().trim();
        const envKeys = Object.keys(this.Environment);
        for (const i in envKeys) {
            const envKey = envKeys[i];
            if (envKey.toLowerCase().trim() === key) {
                return envKey;
            }
        }
        return null;
    }

    public GetEnvironmentVariable(key: string): string {
        const envKey = this.GetEnvironmentVariableName(key);
        if (!envKey) {
            return null;
        }

        return this.Environment[envKey];
    }

    public SetEnvironmentVariable(key: string, value: string): void {
        let envKey = this.GetEnvironmentVariableName(key);
        if (!envKey) {
            envKey = key;
        }

        this.Environment[envKey] = value;
    }

    GetPath(): string[] {
        if (this.OS === EnumOperatingSystem.Windows) {
            return this.GetEnvironmentVariable('path').split(';');
        }
        return this.GetEnvironmentVariable('path').split(':');
    }

    SetPath(path: string[]): void {
        if (this.OS === EnumOperatingSystem.Windows) {
            this.SetEnvironmentVariable('path', path.join(';'));
        }
        else {
            this.SetEnvironmentVariable('path', path.join(':'));
        }
    }

    RemovePath(path: string[]): void {
        const currentPath = this.GetPath();

        for (const i in path) {
            const pathToRemove = path[i];

            for (let o = 0; o < currentPath.length; o++) {
                const currentPathToCheck = currentPath[o];

                if (pathToRemove.toLowerCase().trim() === currentPathToCheck.toLowerCase().trim()) {
                    currentPath.splice(o, 1);
                    break;
                }
            }
        }

        this.SetPath(currentPath);
    }

    AddPath(path: string[]): void {
        const currentPath = this.GetPath();

        for (const i in path) {
            const pathToAdd = path[i];
            currentPath.push(pathToAdd);
        }

        this.SetPath(currentPath);
    }

    async FindAllInPath(executable: string): Promise<string[]> {
        const paths = this.GetPath();
        const results: string[] = [];

        let pathExtensions = null;
        if (this.OS === EnumOperatingSystem.Windows) {
            pathExtensions = (this.GetEnvironmentVariable('pathext') || '').split(';');
        }
        else {
            pathExtensions = [];
        }

        for (const i in paths) {
            try {
                const search = `${paths[i]}/${executable}`;
                await lstat(search);
                results.push(search);
            }
            catch (ex) {
                for (const o in pathExtensions) {
                    try {
                        const extensionSearch = `${paths[i]}/${executable}${pathExtensions[o]}`;
                        await lstat(extensionSearch);
                        results.push(extensionSearch);
                    }
                    catch (ex) { continue; }
                }
            }
        }

        return results;
    }

    async FindInPath(executable: string): Promise<string> {
        const results = await this.FindAllInPath(executable);

        if (results.length) {
            return results[0];
        }

        return null;
    }

    get UserHome(): string {
        if (this.OS === EnumOperatingSystem.Windows) {
            return this.GetEnvironmentVariable('userprofile');
        }
        else {
            // TODO: Implement this
            throw new Error('Not implemented, get user profile in linux');
        }
    }

    get WorkingDirectory(): string {
        return process.cwd();
    }
}

@Service()
export default class ProcessService {
    private readonly _logger = Container.get(LoggerService).ScopeByType(ProcessService);

    private _processEnvironment: ProcessServiceEnvironment = new ProcessServiceEnvironment();
    WithEnvironment(options: ProcessServiceEnvironment): ProcessService {
        const instance = new ProcessService();
        instance.SetOptions(options);
        return instance;
    }
    protected SetOptions(options: ProcessServiceEnvironment): void {
        this._processEnvironment = options;
    }

    GetOS(): EnumOperatingSystem {
        return this._processEnvironment.OS;
    }

    GetDistribution(): string {
        // TODO: Get OS distro
        return '';
    }

    private _isAdmin: boolean = null;
    async IsAdmin(): Promise<boolean> {
        if (this._isAdmin === null) {
            this._logger.LogTrace('checking if running as admin');
            switch (this.GetOS()) {
                case EnumOperatingSystem.Windows:
                    try {
                        await this.Execute('net session');
                        this._logger.LogTrace('process running as admin');
                        this._isAdmin = true;
                    }
                    catch (ex) {
                        this._logger.LogTrace('process not running as admin');
                        this._isAdmin = false;
                    }
                    break;
                default:
                    this._isAdmin = true;
                    break;
            }
        }

        return this._isAdmin;
    }

    FindInPath(executable: string): Promise<string> {
        return this._processEnvironment.FindInPath(executable);
    }

    async ExecutePowerShell(command: string): Promise<string> {
        this._logger.LogTrace(`attempting to find the powershell executable in path`);
        const powerShellExecutable = await this.FindInPath('pwsh') || await this.FindInPath('powershell');

        if (powerShellExecutable === null) {
            throw new Error('Unable to find the powershell binary');
        }

        this._logger.LogTrace(`powershell binary found: ${powerShellExecutable}`);

        command = command.split('\n').join(' ');

        return await this.Execute(`"${powerShellExecutable}" -ExecutionPolicy Bypass -NoLogo -c ${command}`);
    }

    Execute(command: string, interactiveHandler?: (data: string) => string): Promise<string> {
        return new Promise((resolve, reject) => {
            this._logger.LogTrace(`executing command: ${command}\nenvironment: ${this._logger.Serialize(this._processEnvironment.Environment)}`);
            const childProcess = exec(command, {
                env: this._processEnvironment.Environment
                }, (error: ExecException, stdout: string, stderr: string) => {
                this._logger.LogTrace(`command results: ${command}
Error: ${error}
stderr: ${stderr}
stdout: ${stdout}`);
                if (error) {
                    reject(error);
                }
                else {
                    // TODO: Allow stderr response
                    resolve(stdout);
                }
            });

            function streamHandler(chunk) {
                const result = interactiveHandler(chunk.toString());

                if (result) {
                    childProcess.stdin.write(result);
                }
            }

            if (interactiveHandler) {
                childProcess.stdout.on('data', streamHandler);
                childProcess.stderr.on('data', streamHandler);
            }

            if (this._logger.IsEnabled(LogLevel.Trace)) {
                childProcess.stdout.pipe(process.stdout);
                childProcess.stderr.pipe(process.stderr);
            }
        });
    }
};