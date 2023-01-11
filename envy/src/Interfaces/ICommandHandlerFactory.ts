import { ICommandHandler } from "./ICommandHandler";

export interface ICommandHandlerFactory {
    GetInstance(): ICommandHandler;
};