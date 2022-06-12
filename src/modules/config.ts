import FileManagement from "@modules/file";

export default class BotConfig {
    public readonly appID: string;
    public readonly token: string;
    public readonly intents: string[];
    public readonly sandbox: boolean;
    public readonly master: string;
    public readonly header: string;
    public readonly atUser: boolean;
    public readonly dbPort: number;
    public readonly dbPassword: string;
    public readonly helpMessageStyle: string;
    public readonly logLevel: "trace" | "debug" | "info" | "warn" |
        "error" | "fatal" | "mark" | "off";

    static initObject = {
        appID: "appID",
        token: "token",
        intents: [ "type1", "type2", "留空开启监听全部事件" ],
        sandbox: false,
        master: "master",
        header: "\/",
        atUser: false,
        dbPort: 56379,
        dbPassword: "",
        helpMessageStyle: "message",
        logLevel: "info",
    };

    constructor( file: FileManagement ) {
        const config: any = file.loadYAML("setting");
        const checkFields: Array<keyof BotConfig> = [ "appID", "token", "dbPassword" ];

        for ( let key of checkFields ) {
            if ( config[ key ] === undefined ) {
                config[ key ] = BotConfig.initObject[ key ];
            }
        }
        file.writeYAML("setting", config);

        this.appID = config.appID;
        this.token = config.token;
        this.intents = config.intents;
        this.sandbox = config.sandbox;
        this.master = config.master;
        this.header = config.header;
        this.dbPort = config.dbPort;
        this.dbPassword = config.dbPassword;
        this.atUser = config.atUser;

        const helpList: string[] = [ "message", "forward", "xml" ];
        this.helpMessageStyle = helpList.includes(config.helpMessageStyle)
            ? config.helpMessageStyle : "message";

        const logLevelList: string[] = [
            "trace", "debug", "info", "warn",
            "error", "fatal", "mark", "off"
        ];
        this.logLevel = logLevelList.includes(config.logLevel)
            ? config.logLevel : "info";
    }
}