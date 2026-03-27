# 部署准备说明

这个项目现在已经整理成可部署结构，既可以继续本机开发，也可以直接部署到支持 Python Web 服务的平台。

## 关键文件

- [app.py](/Users/andy/Documents/weici_vocab_tool/app.py)
  Flask 应用主体。
- [wsgi.py](/Users/andy/Documents/weici_vocab_tool/wsgi.py)
  生产环境入口，给 Gunicorn 使用。
- [Procfile](/Users/andy/Documents/weici_vocab_tool/Procfile)
  平台型部署时的启动命令示例。
- [requirements.txt](/Users/andy/Documents/weici_vocab_tool/requirements.txt)
  依赖列表，已包含 `gunicorn`。

## 本机开发

```bash
cd /Users/andy/Documents/weici_vocab_tool
./start.sh
```

或者：

```bash
cd /Users/andy/Documents/weici_vocab_tool
source .venv/bin/activate
python app.py
```

默认只监听：

```text
127.0.0.1:5050
```

这表示只有你这台电脑本机可以访问。

## 生产环境启动方式

上线时不要再用 Flask 自带开发服务器，而是用 Gunicorn：

```bash
gunicorn wsgi:app --bind 0.0.0.0:$PORT
```

原因：

- Flask 自带服务器只适合开发测试
- Gunicorn 更适合部署
- 云平台通常会通过环境变量 `PORT` 指定监听端口

## 环境变量

[app.py](/Users/andy/Documents/weici_vocab_tool/app.py) 现在支持：

- `PORT`
  默认 `5050`
- `WEICI_HOST`
  默认 `127.0.0.1`
- `WEICI_DEBUG`
  默认 `1`

举例：

```bash
WEICI_HOST=0.0.0.0 PORT=8000 WEICI_DEBUG=0 python app.py
```

这适合你在局域网或容器里手动测试部署形态。

## 部署前建议

- 把项目放到 Git 仓库
- 首次部署前确认 `data/words_cache.json` 是否要随仓库提交
- 如果你希望首次打开更快，可以保留缓存文件
- 如果你希望部署体积更小，也可以不提交缓存，让服务首次启动时再抓取

## 平台兼容性

这套结构适合：

- Render
- Railway
- Fly.io
- 自己的 Linux 服务器

## Render 快速部署

项目里已经加入了 [render.yaml](/Users/andy/Documents/weici_vocab_tool/render.yaml)，可以直接给 Render 识别。

### 1. 先把项目推到 GitHub

如果你还没建仓库，可以先在项目目录执行：

```bash
cd /Users/andy/Documents/weici_vocab_tool
git init
git add .
git commit -m "Initial commit"
```

然后把它推到你自己的 GitHub 仓库。

### 2. 在 Render 新建服务

去 Render 后：

1. 选择 `New +`
2. 选择 `Blueprint` 或 `Web Service`
3. 连接你的 GitHub 仓库

如果 Render 识别到了 [render.yaml](/Users/andy/Documents/weici_vocab_tool/render.yaml)，一般会直接按里面的配置创建服务。

### 3. Render 使用的配置

当前项目给 Render 的配置是：

- Build Command
  `pip install -r requirements.txt`
- Start Command
  `gunicorn wsgi:app --bind 0.0.0.0:$PORT`
- 环境变量
  `WEICI_DEBUG=0`

### 4. 部署完成后

Render 会给你一个公开网址，通常像：

```text
https://your-service-name.onrender.com
```

把这个地址发给朋友，他们就能直接访问。

### 5. 关于首次加载

这个项目会在首次请求词库时抓取远端 Markdown 并写入本地缓存文件 `data/words_cache.json`。

这意味着：

- 首次打开可能稍慢
- 后续访问通常会更快

### 6. 关于 Render 免费实例

如果你使用免费实例，服务在长时间无访问后可能会休眠。再次打开时可能需要等待十几秒到几十秒恢复。

这对“先给朋友看看”通常是可以接受的。
