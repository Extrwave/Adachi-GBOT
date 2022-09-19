/* 从@消息中获取@的用户 */
export default function idParser( id: string ): { code: string, targetID: string } {
	const result = id.match( /<@!(.*)>/ );
	let targetID;
	if ( result === null ) {
		return { code: "error", targetID: "用户匹配出错." };
	} else {
		targetID = result[1];
		return { code: "ok", targetID: targetID };
	}
}