import { MessageType } from "@modules/message";

export default function idParser( id: string ): [ MessageType, string ] {
    const char: string = id[ 0 ].toLowerCase();
    const num: string = id.slice(1);
    const type = char === "u" ? MessageType.Private : MessageType.Group;
    return [ type, num ];
}