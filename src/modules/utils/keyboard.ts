/**
Author: Extrwave
CreateTime: 2023/1/13
 */

type PermissionType = {
	0,  //指定用户可操作
	1,	//仅管理者可操作
	2,	//所有人可操作
	3,  //指定身份组可操作
}

interface Permission {
	type: PermissionType    //权限类型，参考 PermissionType
	specify_role_ids?: string[]     //有权限的身份组id的列表
	specify_user_ids?: string[]  //有权限的用户id的列表
}

interface RenderData {
	label: string    //按纽上的文字
	visited_label: string   //点击后按纽上文字
	style: number   //按钮样式 0 灰色线框，1 蓝色线框
}

interface Action {
	type: number     //操作类型，参考 ActionType
	permission: Permission //用于设定操作按钮所需的权限
	click_limit: number	//可点击的次数, 默认不限
	data: string	//操作相关数据
	at_bot_show_channel_list: boolean	//false:不弹出子频道选择器 true:弹出子频道选择器
}

interface Button {
	id: string	//按钮 id
	render_data: RenderData //按纽渲染展示对象	用于设定按钮的显示效果
	action: Action //该按纽操作相关字段	用于设定按钮点击后的操作
}

interface InlineKeyboardRow {
	buttons: Button[];
}

interface InlineKeyboard {
	rows: InlineKeyboardRow[];
}

export class Keyboard {
	id?: string;	//keyboard 模板 id
	content?: InlineKeyboard; //自定义Keyboard内容
	
	constructor( id?: string, content?: InlineKeyboard ) {
		this.id = id;
		this.content = content;
	}
}