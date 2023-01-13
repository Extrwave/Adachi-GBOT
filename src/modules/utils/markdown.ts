/**
Author: Extrwave
CreateTime: 2023/1/13
 */

interface MessageMarkdownParam {
	key: string	//markdown 模版 key
	values: string[] //string类型的数组，长度只能为1
}

export class Markdown {
	template_id?: number;//markdown 官当模板 id
	custom_template_id?: string;	//markdown 自定义模板 id
	params?: MessageMarkdownParam[];	//markdown 模板模板参数
	content?: string; //原生 markdown 内容,与上面三个参数互斥,参数都传值将报错。现已不在开放
	
	constructor( id: string | number, params: MessageMarkdownParam[] ) {
		typeof id === 'string' ? this.custom_template_id = id
			: this.template_id = id;
		this.params = params;
	}
}