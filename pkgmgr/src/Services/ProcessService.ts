import { exec, ExecException } from 'child_process';
import { Service } from 'typedi';

@Service()
export default class ProcessService {
    Execute(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error: ExecException, stdout: string, stderr: string) => {
                if (error) {
                    reject(new Error(error.toString()));
                }
                else {
                    // TODO: Allow stderr response
                    resolve(stdout);
                }
            });
        });
    }
};