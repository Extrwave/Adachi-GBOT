/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */
import {
    createOpenAPI,
    createWebsocket,
    IOpenAPI,
} from "qq-guild-bot";
import * as log from 'log4js';
import BotConfig from "@modules/config";
import FileManagement from "@modules/file";
import MsgManagement, * as msg from "@modules/message";
import Database from "@modules/database";
import MsgManager from '@modules/message'
import Authorization from '@modules/management/auth'
import Command, { BasicConfig, MatchResult } from '@modules/command/main'
import { trim } from "lodash";


export interface BOT {
    readonly redis: Database;
    readonly config: BotConfig;
    readonly client: IOpenAPI;
    readonly ws;
    readonly logger: log.Logger;
    readonly file: FileManagement;
    readonly auth: Authorization;
    readonly message: MsgManagement;
    readonly command: Command;
    // readonly refresh: RefreshConfig;
    // readonly renderer: BasicRenderer;
}

export class APAS {
    public readonly bot: BOT;

    constructor( root: string ) {
        /* 初始化运行环境 */
        const file = new FileManagement(root);
        APAS.setEnv(file);

        /* 初始化应用模块 */
        const config = new BotConfig(file);
        /* 创建client实例*/
        const client = createOpenAPI({
            appID: config.appID,
            token: config.token,
            sandbox: config.sandbox
        });
        // 创建 websocket 连接
        const ws = createWebsocket({
            appID: config.appID,
            token: config.token,
            sandbox: config.sandbox
        });
        // 实例化logger
        const logger = log.getLogger();
        logger.level = config.logLevel;
        process.on("unhandledRejection", reason => {
            logger.error(( <Error>reason ).stack);
        });

        const redis = new Database(config.dbPort, config.dbPassword, logger, file);
        const message = new MsgManager(config, client);
        const auth = new Authorization(config, redis);
        const command = new Command(file);
        // const refresh = new RefreshConfig( file, command );
        // const renderer = new BasicRenderer();

        this.bot = {
            client, ws, file, redis,
            logger, message, auth, command,
            config,
            // command, refresh, renderer
        };
        // refresh.registerRefreshableFunc(renderer);
    }

    public run(): BOT {
        const logger = this.bot.logger;
        logger.info("BOT启动成功")
        /* 事件监听 */
        this.bot.ws.on("GUILD_MESSAGES", ( data ) => {
            this.parseGroupMsg(data);
        });
        this.bot.ws.on("DIRECT_MESSAGE", ( data ) => {
            this.parsePrivateMsg(data);
        });
        this.bot.ws.on("READY", ( data ) => {
            this.botOnline(data);
        });
        this.bot.logger.info("事件监听启动成功");
        return this.bot;
    }

    private static setEnv( file: FileManagement ): void {
        file.createDir("config", "root");
        const exist: boolean = file.createYAML("setting", BotConfig.initObject);
        if ( exist ) {
            return;
        }

        /* Created by http://patorjk.com/software/taag  */
        /* Font Name: Big                               */
        const greet =
            `   _____ __________  _____    _________        __________ ___________________
  /  _  \\\\______   \\/  _  \\  /   _____/        \\______   \\\\_____  \\__    ___/
 /  /_\\  \\|     ___/  /_\\  \\ \\_____  \\   ______ |    |  _/ /   |   \\|    |   
/    |    \\    |  /    |    \\/        \\ /_____/ |    |   \\/    |    \\    |   
\\____|__  /____|  \\____|__  /_______  /         |______  /\\_______  /____|   
        \\/                \\/        \\/                 \\/         \\/         `
        console.log(greet);

        file.createDir("database", "root");
        file.createDir("logs", "root");

        file.createYAML(
            "cookies",
            { cookies: [ "米游社Cookies(允许设置多个)" ] }
        );
        file.createYAML(
            "commands",
            { tips: "此文件修改后需重启应用" }
        );

        console.log("环境初始化完成，请在 /config 文件夹中配置信息");
        process.exit(0);
    }

    /* 正则检测处理消息 */
    private async execute(
        messageData: msg.Message,
        sendMessage: msg.SendFunc,
        cmdSet: BasicConfig[],
        limits: string[],
        unionRegExp: RegExp,
        isPrivate: boolean
    ): Promise<void> {
        const content: string = messageData.msg.content;


        const usable: BasicConfig[] = cmdSet.filter(el => !limits.includes(el.cmdKey));
        for ( let cmd of usable ) {
            const res: MatchResult = cmd.match(content);
            if ( res.type === "unmatch" ) {
                continue;
            }
            if ( res.type === "order" ) {
                const text: string = cmd.ignoreCase
                    ? content.toLowerCase() : content;
                messageData.msg.content = trim(
                    msg.removeStringPrefix(text, res.header.toLowerCase())
                        .replace(/ +/g, " ")
                );
            }
            cmd.run({
                sendMessage, ...this.bot,
                messageData, matchResult: res
            });

            /* 数据统计与收集 */
            const userID: string = messageData.msg.id;
            const groupID: string = msg.isGroupMessage(messageData) ? messageData.msg.channel_id : "-1";
            await this.bot.redis.addSetMember(`adachi.user-used-groups-${ userID }`, groupID);
            await this.bot.redis.incHash("adachi.hour-stat", userID.toString(), 1);
            await this.bot.redis.incHash("adachi.command-stat", cmd.cmdKey, 1);
            return;
        }
    }


    private async parseGroupMsg( param ) {
        this.bot.logger.info(param);
        await this.bot.client.messageApi.postMessage(param.msg.guild_id, {
            content: param.msg.content,
            msg_id: param.msg.id
        });
    }

    private async parsePrivateMsg( param ) {
        this.bot.logger.info(param);
        await this.bot.client.directMessageApi.postDirectMessage(param.msg.guild_id, {
            content: param.msg.content,
            msg_id: param.msg.id
        });
    }


    private botOnline( param ) {
        if ( param.msg.user.status === 1 ) {
            this.bot.logger.info("BOT启动成功")
        }
    }
}