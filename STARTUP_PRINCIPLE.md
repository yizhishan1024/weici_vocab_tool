# 启动原理说明

这个项目的一键启动脚本是 [start.sh](/Users/andy/Documents/weici_vocab_tool/start.sh)。

它做的事情可以理解成 5 步：

## 1. 进入项目目录

脚本里的这一行：

```bash
cd "$(dirname "$0")"
```

作用是无论你从哪个终端路径执行脚本，它都会先切换到脚本所在目录，也就是项目根目录。

这样后面的 `.venv`、`requirements.txt`、`app.py` 都能用相对路径找到。

## 2. 准备 Python 虚拟环境

脚本会先检查 `.venv` 是否存在：

```bash
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
```

这里的目的，是把项目需要的 Python 依赖隔离在当前目录里，避免污染系统环境，也避免和别的项目冲突。

接着执行：

```bash
source .venv/bin/activate
python -m pip install -r requirements.txt >/dev/null
```

含义是：

- `source .venv/bin/activate`：让当前 shell 临时优先使用这个项目自己的 Python 和 pip
- `python -m pip install -r requirements.txt`：安装 Flask、requests、python-docx 等依赖

所以你看到的是“先打开终端，再运行 Python 服务”，本质上是因为 Flask 服务本来就是一个本地进程，必须由某个 shell 或脚本先把它启动起来。

## 3. 在本机启动 Flask 服务器

脚本里真正启动网站的核心是：

```bash
WEICI_DEBUG=0 python app.py &
SERVER_PID=$!
```

这里有两个关键点：

- `WEICI_DEBUG=0`：给 Python 进程传入一个环境变量，告诉 `app.py` 不要启用调试重载模式
- `&`：让这个 Flask 进程在后台运行，而不是占住当前脚本

为什么要关掉调试重载？

因为 Flask 的 debug/reloader 模式通常会再派生一个子进程。对“脚本自动打开浏览器”这种场景来说，这会让进程管理更复杂，脚本也不容易判断该等哪个进程结束。

`SERVER_PID=$!` 的意思是把“刚刚后台启动的那个 Flask 进程的 PID”记下来，后面脚本需要用它做清理和等待。

## 4. 自动用浏览器打开本地网址

脚本接着执行：

```bash
sleep 2
open http://127.0.0.1:5050
```

这里的逻辑是：

- `sleep 2`：给 Flask 一点启动时间，避免浏览器比服务更早打开
- `open ...`：这是 macOS 的系统命令，会把这个地址交给默认浏览器打开

所以它不是“浏览器自己发现了网址”，而是脚本在确认服务已经开始启动后，主动调用系统命令把本地地址打开。

这个地址为什么是 `127.0.0.1:5050`？

- `127.0.0.1` 是本机回环地址，意思是“访问我自己的电脑”
- `5050` 是 `app.py` 里 Flask 监听的端口

所以浏览器访问的是你自己电脑上的 Web 服务，不是外网服务器。

## 5. 保持服务运行，并在退出时清理

脚本最后还有这两部分：

```bash
trap cleanup EXIT INT TERM
wait "$SERVER_PID"
```

以及：

```bash
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
```

作用是：

- `wait "$SERVER_PID"`：让脚本一直挂着，直到 Flask 进程结束
- `trap ...`：当你按 `Ctrl + C`、关闭终端、或脚本退出时，自动执行 `cleanup`
- `kill "$SERVER_PID"`：把后台 Flask 服务一起关掉，避免残留僵尸进程

这也是为什么你运行 `./start.sh` 后，终端窗口需要保持开着。因为这个终端本身就是 Flask 服务的宿主进程之一。

## 整个过程的直观理解

你可以把它想成：

1. 终端先把运行环境准备好
2. 终端在本机启动一个 Python Web 服务
3. 脚本让默认浏览器去访问这个本机服务
4. 终端继续守着这个服务
5. 你停止脚本时，服务一起关闭

## 对应到这个项目里的文件

- 启动脚本：[start.sh](/Users/andy/Documents/weici_vocab_tool/start.sh)
- Flask 服务入口：[app.py](/Users/andy/Documents/weici_vocab_tool/app.py)
- 页面模板：[templates/index.html](/Users/andy/Documents/weici_vocab_tool/templates/index.html)
- 前端交互：[static/app.js](/Users/andy/Documents/weici_vocab_tool/static/app.js)

## 如果不用脚本，会发生什么

你也可以手动做同样的事：

```bash
cd /Users/andy/Documents/weici_vocab_tool
source .venv/bin/activate
python app.py
```

然后再自己打开浏览器访问：

```text
http://127.0.0.1:5050
```

`start.sh` 只是把这几个步骤自动化了。
