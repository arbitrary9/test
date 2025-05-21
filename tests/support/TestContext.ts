import {ITestContextParameters} from "./ITestContextParameters";
import {IWorldOptions, World} from "@cucumber/cucumber";
import {env} from "@config/env";

export class TestContext extends World<ITestContextParameters> {
    constructor(options: IWorldOptions<ITestContextParameters>) {
        super(options);
        options.parameters.webSiteUrl = env.ENVIRONMENT.WEB_SITE_URL;
    }
}