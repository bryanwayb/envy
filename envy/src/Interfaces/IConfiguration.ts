import { ConfigurationModel } from "../Configuration/Models/ConfigurationModel";

export interface IConfiguration {
    GetConfiguration(): Promise<ConfigurationModel>;
};