# 鬱英词典

玉林话-英语词典，数据库结构见 `index.d.ts`。

## 构建指南

1. [安装 Node](https://nodejs.org/zh-cn/download/package-manager)，如果你没有包管理器的使用经验，可以直接安装构建好的二进制版本。
2. [安装 pnpm](https://www.pnpm.cn/installation)。
3. 在终端中打开当前项目根目录，运行

    ```shell
    pnpm install
    npm install -g tsx
    ```

在前面的步骤中，你可能会遇到一些问题，下面给出了一些常见问题的解决方法。

- 如在前面的“1”或“2”中遇到 PowerShell 提示权限不足，则需要[设置执行策略](https://learn.microsoft.com/zh-cn/powershell/module/microsoft.powershell.security/set-executionpolicy?view=powershell-7.4)。
- 如果在第“3”步下载过程中网速过慢，可以更换下载源为淘宝镜像：

    ```shell
     npm config set registry https://registry.npm.taobao.org
    ```

## 实用命令

对`data/*.json`进行格式化：

```shell
pnpm lint:json
```

对`scripts/*.ts,js,jsm`进行格式化：

```shell
pnpm lint:script
```

运行`scripts/index.ts`以便执行某些任务：

```shell
pnpm runMain
```
