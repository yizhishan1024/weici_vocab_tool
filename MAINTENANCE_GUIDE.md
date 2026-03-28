# 项目使用与更改清单

这份文档是这个项目的日常操作手册，适合以后自己维护时直接照着做。

---

## 1. 项目当前结构

核心文件：

- [app.py](/Users/andy/Documents/weici_vocab_tool/app.py)
  Flask 后端，负责词库接口、导出接口、页面入口。
- [wsgi.py](/Users/andy/Documents/weici_vocab_tool/wsgi.py)
  生产环境入口，给 PythonAnywhere / Gunicorn 使用。
- [templates/index.html](/Users/andy/Documents/weici_vocab_tool/templates/index.html)
  网页结构。
- [static/app.js](/Users/andy/Documents/weici_vocab_tool/static/app.js)
  前端交互逻辑。
- [static/style.css](/Users/andy/Documents/weici_vocab_tool/static/style.css)
  页面样式。
- [data/words_cache.json](/Users/andy/Documents/weici_vocab_tool/data/words_cache.json)
  本地缓存词库。
- [start.sh](/Users/andy/Documents/weici_vocab_tool/start.sh)
  本机一键启动脚本。
- [requirements.txt](/Users/andy/Documents/weici_vocab_tool/requirements.txt)
  Python 依赖。

说明文档：

- [README.md](/Users/andy/Documents/weici_vocab_tool/README.md)
- [STARTUP_PRINCIPLE.md](/Users/andy/Documents/weici_vocab_tool/STARTUP_PRINCIPLE.md)
- [DEPLOYMENT.md](/Users/andy/Documents/weici_vocab_tool/DEPLOYMENT.md)
- [MAINTENANCE_GUIDE.md](/Users/andy/Documents/weici_vocab_tool/MAINTENANCE_GUIDE.md)

---

## 2. 平时如何使用项目

### 本机运行

在你自己的 Mac 上：

```bash
cd /Users/andy/Documents/weici_vocab_tool
./start.sh
```

这会：

- 自动进入项目目录
- 自动启用虚拟环境
- 自动安装依赖
- 启动 Flask
- 自动打开浏览器

默认访问地址：

```text
http://127.0.0.1:5050
```

### 网页使用流程

1. 打开网页
2. 选择筛词范围
3. 用中央卡片浏览单词
4. 点击“加入生词本”或“跳过”
5. 右侧导出词汇本

快捷键：

- `A` 或 `Enter`
  加入生词本
- `S` 或空格
  跳过

---

## 3. 以后如果要修改网页或功能，应该怎么做

推荐原则：

- 永远优先在你自己的电脑本地修改
- 本地测试通过后再推到 GitHub
- 最后再到 PythonAnywhere 拉取更新

不要长期直接在 PythonAnywhere 网页里改代码，否则本地和线上会越来越不一致。

---

## 4. 标准修改流程

### 第一步：本地修改文件

先进入项目目录：

```bash
cd /Users/andy/Documents/weici_vocab_tool
```

然后修改你需要的文件。

常见修改位置：

- 改页面结构：
  [templates/index.html](/Users/andy/Documents/weici_vocab_tool/templates/index.html)
- 改交互逻辑：
  [static/app.js](/Users/andy/Documents/weici_vocab_tool/static/app.js)
- 改样式：
  [static/style.css](/Users/andy/Documents/weici_vocab_tool/static/style.css)
- 改后端接口：
  [app.py](/Users/andy/Documents/weici_vocab_tool/app.py)

### 第二步：本地测试

运行：

```bash
cd /Users/andy/Documents/weici_vocab_tool
./start.sh
```

检查：

- 页面能否打开
- 新功能是否正常
- 生词本是否正常
- 导出是否正常

如果你改了 Python 文件，也可以做一个基础检查：

```bash
source .venv/bin/activate
python -m py_compile app.py wsgi.py
```

### 第三步：提交到 GitHub

本地测试没问题后：

```bash
cd /Users/andy/Documents/weici_vocab_tool
git add .
git commit -m "描述本次修改"
git push
```

示例：

```bash
git commit -m "Improve flashcard filtering UI"
```

---

## 5. 修改后如何更新线上 PythonAnywhere 网站

登录 PythonAnywhere，打开 Bash console，然后执行：

```bash
cd ~/weici_vocab_tool
git pull
```

如果你改了依赖文件 [requirements.txt](/Users/andy/Documents/weici_vocab_tool/requirements.txt)，还要执行：

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

然后去 PythonAnywhere 的 `Web` 页面，点击：

```text
Reload yizhishan.pythonanywhere.com
```

这样线上网站就会更新。

---

## 6. 不同类型修改，对应要做什么

### 只改前端文件

比如改了：

- [templates/index.html](/Users/andy/Documents/weici_vocab_tool/templates/index.html)
- [static/app.js](/Users/andy/Documents/weici_vocab_tool/static/app.js)
- [static/style.css](/Users/andy/Documents/weici_vocab_tool/static/style.css)

操作：

```bash
git add .
git commit -m "..."
git push
```

然后线上：

```bash
cd ~/weici_vocab_tool
git pull
```

最后 `Reload` 网站。

### 改了后端逻辑

比如改了：

- [app.py](/Users/andy/Documents/weici_vocab_tool/app.py)
- [wsgi.py](/Users/andy/Documents/weici_vocab_tool/wsgi.py)

操作：

1. 本地先测试
2. `git push`
3. PythonAnywhere 上 `git pull`
4. `Reload`

### 改了依赖

比如改了：

- [requirements.txt](/Users/andy/Documents/weici_vocab_tool/requirements.txt)

操作：

PythonAnywhere 上除了 `git pull`，还要执行：

```bash
cd ~/weici_vocab_tool
source .venv/bin/activate
pip install -r requirements.txt
```

然后再 `Reload`。

---

## 7. 如何刷新词库

项目词库来自远端 Markdown 源。

正常刷新方式：

1. 打开网页
2. 点击“强制刷新词库”

如果刷新失败，说明可能是：

- 远端源暂时不可访问
- PythonAnywhere 免费账户外网访问有限制

这种情况下，网站仍然可以继续使用已有缓存：

- [data/words_cache.json](/Users/andy/Documents/weici_vocab_tool/data/words_cache.json)

---

## 8. 如何备份项目

最重要的备份有两份：

### 代码备份

代码已经可以通过 GitHub 备份。

只要你做完修改后执行：

```bash
git push
```

GitHub 上就有完整备份。

### 词库缓存备份

如果你担心缓存丢失，可以额外备份：

- [data/words_cache.json](/Users/andy/Documents/weici_vocab_tool/data/words_cache.json)

---

## 9. 常用命令清单

### 本机启动项目

```bash
cd /Users/andy/Documents/weici_vocab_tool
./start.sh
```

### 本机安装依赖

```bash
cd /Users/andy/Documents/weici_vocab_tool
source .venv/bin/activate
pip install -r requirements.txt
```

### 本地检查 Python 语法

```bash
cd /Users/andy/Documents/weici_vocab_tool
source .venv/bin/activate
python -m py_compile app.py wsgi.py
```

### 提交并推送到 GitHub

```bash
cd /Users/andy/Documents/weici_vocab_tool
git add .
git commit -m "描述本次修改"
git push
```

### PythonAnywhere 拉取更新

```bash
cd ~/weici_vocab_tool
git pull
```

### PythonAnywhere 更新依赖

```bash
cd ~/weici_vocab_tool
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 10. 常见问题处理

### 网页打不开

先检查：

- 本机是不是已经运行 `./start.sh`
- PythonAnywhere 上是否点了 `Reload`
- PythonAnywhere 的 error log 里有没有报错

### 改了代码但线上没变化

通常是漏了某一步：

1. 没有 `git push`
2. PythonAnywhere 没有 `git pull`
3. 忘记点 `Reload`

### 依赖报错

重新安装：

本机：

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

PythonAnywhere：

```bash
cd ~/weici_vocab_tool
source .venv/bin/activate
pip install -r requirements.txt
```

### GitHub 推送失败

常见原因：

- 没登录 GitHub
- Token 权限不对
- 远程仓库地址写错

先检查：

```bash
git remote -v
```

### PythonAnywhere 更新后报错

优先检查：

- WSGI 文件配置
- 虚拟环境路径
- 是否忘记安装新的依赖

---

## 11. 以后维护时最推荐的固定流程

每次改功能，建议永远按这个顺序：

1. 本地改代码
2. 本地测试
3. `git add .`
4. `git commit -m "..."`
5. `git push`
6. PythonAnywhere 上 `git pull`
7. 如果依赖变了就 `pip install -r requirements.txt`
8. 点击 `Reload`
9. 打开线上网址复查

---

## 12. 当前线上网址

你当前的公开网址是：

```text
https://yizhishan.pythonanywhere.com
```

---

## 13. 如果以后要做更大改动

下面这些改动，建议先问我或先做本地测试：

- 改抓词逻辑
- 改导出逻辑
- 新增数据库
- 改部署平台
- 改 Python 版本
- 改 WSGI 配置

因为这些改动更容易影响线上可用性。
