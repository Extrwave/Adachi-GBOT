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
    public readonly countThreshold: number;
    public readonly groupIntervalTime: number;
    public readonly privateIntervalTime: number;
    public readonly helpMessageStyle: string;
    public readonly logLevel: "trace" | "debug" | "info" | "warn" |
        "error" | "fatal" | "mark" | "off";

    public readonly webConsole: {
        readonly enable: boolean;
        readonly adminName: string;
        readonly adminPwd: string;
        readonly consolePort: number;
        readonly tcpLoggerPort: number;
        readonly jwtSecret: string;
    };

    static initObject = {
        tip: "前往 https://docs.adachi.top/config 查看配置详情",
        appID: "appID",
        token: "token",
        intents: [ "留空开启监听全部事件" ],
        sandbox: false,
        master: "8941463799030477083",
        header: "/",
        atUser: false,
        dbPort: 6379,
        dbPassword: "",
        countThreshold: 60,
        groupIntervalTime: 1500,
        privateIntervalTime: 2000,
        helpMessageStyle: "message",
        logLevel: "info",
        webConsole: {
            enable: false,
            adminName: "admin",
            adminPwd: "admin",
            consolePort: 80,
            tcpLoggerPort: 54921,
            jwtSecret: "Secret"
        }
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
        this.groupIntervalTime = config.groupIntervalTime;
        this.privateIntervalTime = config.privateIntervalTime;
        this.countThreshold = config.countThreshold;
        this.webConsole = {
            enable: config.webConsole.enable,
            adminName: config.webConsole.adminName,
            adminPwd: config.webConsole.adminPwd,
            consolePort: config.webConsole.consolePort,
            tcpLoggerPort: config.webConsole.tcpLoggerPort,
            jwtSecret: config.webConsole.jwtSecret
        }

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