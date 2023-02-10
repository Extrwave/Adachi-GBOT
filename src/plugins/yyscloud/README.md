<p align="center" >
    <a href="https://github.com/Extrwave/Adachi-GBOT-Plugin/tree/coser-image">
        <img src="http://cdn.ethreal.cn/img/QAvatar2-1663831654.png" width="128" height="128" alt="Mari">
    </a>
</p>
<h2 align="center">云原神签到</h2>

# 简介

yyscloud 是 [Adachi-GBOT](https://github.com/Extrwave/Adachi-GBOT) 的衍生插件，用于实现每日自动云原神签到功能。

# 安装插件

进入 `Adachi-GBOT/src/plugins` 目录下，执行如下命令

```bash
git clone -b yyscloud https://github.com/Extrwave/Adachi-Plugin.git yyscloud
```

或通过本项目仓库左上角 `code -> Download.zip` 下载压缩包，解压至 `Adachi-GBOT/src/plugins` 目录内

> 注意：若使用下载压缩包方式，请务必删除解压后目录名字中的 `-master`，否则插件无法启动

## 更新方法

进入 `Adachi-GBOT/src/plugins/yyscloud` 目录下，执行以下命令即可

```bash
git pull
```

当然你也可以直接 下载本项目压缩包 整包替换。

## token获取方法

> 如果您没有基础的 IT 知识和 /
> 或利用搜索引擎的能力甚至不懂[提问的艺术](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md)
>
> 请现在放弃使用的想法并关闭此文档，不用浪费时间
>
> 仅供学习交流使用，严禁用于非法活动，请在24小时内删除
>
> 如有侵犯您的合法权益，请联系我立即删除~~

## Android

手机安装**云原神**客户端

安装一个手机上的抓包软件（例如HttpCanary）

下载地址先放这儿：https://www.123pan.com/s/laLDVv-prkw3

### HttpCanary

> 安卓7以下的手机抓包非常简单，安卓7以上的自行百度（比较麻烦（需要root））
>
> 没有root 我的建议是放弃，不值得冒风险去root手机

安装小黄鸟后要安装小黄鸟的证书，安卓7以上的手机需要**root**后移动到系统证书目录

* 打开小黄鸟
* 根据提示开启VPN，安装小黄鸟证书，跳过移动至系统证书目录（安卓7默认信任用户证书）

![](http://cdn.ethreal.cn/img/Snipaste_2022-05-27_01-06-1654016422.png)

* 目标应用

![](http://cdn.ethreal.cn/img/Snipaste_2022-05-27_01-07-1654016423.png)

* 添加应用，选中云原神

![](http://cdn.ethreal.cn/img/Snipaste_2022-05-27_01-08-1654016425.png)

* 先直接进入云原神登录好，然后返回小黄鸟开启抓包，点击云原神账户界面一下
* 返回小黄鸟找到如图所示链接

![](http://cdn.ethreal.cn/img/Snipaste_2022-05-27_01-09-1654016427.png)

* 点击去token就能看见了

![](http://cdn.ethreal.cn/img/1654048872487-1654048873.png)

## IOS

苹果用户应用商店下载Stream

然后操作类似上面