# 维词抓取与词汇本生成器

## 功能
- 抓取 `https://1299172402.github.io/weici/#/` 对应仓库 `docs/2` 下全部词汇。
- 提取字段：单词拼写、词性、英/美音标、第一项中文释义、第一项英文释义。
- 前端筛词（英文拼写 / 中文释义 / 英文释义 / 音标）。
- 前端分类筛词（A-Z 首字母 / 短语 / 特殊词汇）。
- 生词本管理（添加、移除、清空）。
- 生成词汇本文件：
  - 仅中文释义
  - 中英双释义
  - 纯英文
  - 支持 `DOCX` 或 `TXT` 导出

## 运行
```bash
cd /Users/andy/Documents/weici_vocab_tool
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

或者直接一键启动：
```bash
cd /Users/andy/Documents/weici_vocab_tool
bash start.sh
```

`start.sh` 会自动打开浏览器访问本地页面。

启动脚本的工作原理见：
- [STARTUP_PRINCIPLE.md](/Users/andy/Documents/weici_vocab_tool/STARTUP_PRINCIPLE.md)

打开浏览器访问：
- `http://127.0.0.1:5050`

首次加载词库会自动下载并解析，之后走本地缓存 `data/words_cache.json`。

部署准备说明见：
- [DEPLOYMENT.md](/Users/andy/Documents/weici_vocab_tool/DEPLOYMENT.md)

Render 配置文件：
- [render.yaml](/Users/andy/Documents/weici_vocab_tool/render.yaml)
