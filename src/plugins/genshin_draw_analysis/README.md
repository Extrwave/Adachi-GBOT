本项目为[Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT)衍生插件，用于原神抽卡记录分析！

# 1.使用方法

进入 `Adachi-GBOT/src/plugins` 目录下，执行如下命令

```bash
git clone -b genshin_draw_analysis https://github.com/Extrwave/Adachi-Plugin.git genshin_draw_analysis
```

或通过本项目仓库左上角 `code -> Download.zip` 下载压缩包，解压至 `Adachi-GBOT/src/plugins` 目录内，注意删除文件夹末尾-master

# 2.命令触发

分析前需先私聊bot（header+draw_url_set+抽卡记录URL）设置抽卡记录URL；关于抽卡记录URL获取，许多抽卡记录分析工具都有说明了，这里就不再描述；实在不知道的可以提交issue；

设置完成后发送header+draw_analysis查询即可（使用设置的抽卡记录URL重新拉取数据并合并历史数据分析）

header+draw_analysis_history使用历史数据分析

# 3.常见问题

## 3.1返回图片出现字体乱码

出现问题原因为linux中文字体缺失， 可参考 [此文章](https://www.cnblogs.com/helios-fz/p/13706157.html)安装字体后  重启bot

docker部署可参考[此issue](https://github.com/wickedll/genshin_draw_analysis/issues/5) 安装字体

## 3.2提示visit too frequently

此为mhy接口限制 某一时间内请求次数超过最大限制，此时只需将draw_analysis.ts里面的sleep延时数值调高一点即可（49行 调500-700 不行就再调大一点） [issue](https://github.com/wickedll/genshin_draw_analysis/issues/4)

## 3.3提示authkey timeout或authkey error

authkey过期或有误，重新获取url设置。

# 4.更新日志

- 修复分析指令单个参数未生效的问题; 解决`login_ticket`频繁过期需要经常换`Cookie`的问题。2022/09/22
- 抽卡分析指令增加指定私人服务序号的功能（之前与样式公用值，算是个小 bug ）。2022/09/22
- 修复缓存中的过期链接导致无法自动生成新的 AuthKey 的问题 2022/09/21
- 增加根据 `Cookie` 生成抽卡链接功能，此 `Cookie` 必须包含 `login_ticket`，`login_uid` 字段（可从 [米哈游通行证](https://user.mihoyo.com/)
  ）获取。2022/09/21
- linux不再需要另外安装字体已内嵌引入字体；浏览器调整为使用公共浏览器 2022/05/19
- 新增返回卡片样式选择 2022/04/24
- 调整抽卡记录保存方式 支持合并历史记录分析（此版本之前数据不做处理） 2022/03/19
- 增加颜色 修复抽卡记录过多出现死循环问题 2022/03/19
- URL支持web页与api 2022/03/04
- 修复5星平均出货次数计算错误问题 2022/03/04

# 5.LICENSE

[LICENSE](https://github.com/wickedll/genshin_draw_analysis/blob/master/LICENSE)