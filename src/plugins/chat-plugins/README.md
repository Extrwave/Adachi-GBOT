# chat-plugins V2.0

## 简介

本项目为 [Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT) 的衍生插件，实现聊天功能

`Adachi-BOT`版本兼容性未知，推荐使用最新版本

## API
「[腾讯智能对话平台](https://console.cloud.tencent.com/tbp)」( 需要配置，麻烦，返回快 )
「[青云客API](http://api.qingyunke.com/)」（免费接口有可能挂掉，不太稳定）

~~~
命令：#echo <句子>
~~~
建议改前缀为@BOT，
~~~
 __[CQ:at,qq=QQ号,text=@昵称]
~~~

## 安装文档
代码下载到`Adachi-BOT/src/plugins/`目录下
~~~
cd src/plugins
git clone https://github.com/Extrwave/chat-plugins.git
~~~


腾讯智能对话平台API配置请查看 tencentapi 分支

## 测试

![](https://cdn.jsdelivr.net/gh/Extrwave/IMAGE@master/blogclick/16482214420011648221441330.png)
## 更新
~~~
git pull
如果遇到合并conflict，手动解决，或者删除chat-plugins文件夹，重新
git clone https://github.com/Extrwave/chat-plugins.git
~~~
