# 留燈 · 翻譯

[留燈](https://porchlamps.app) 是給孤單的人的匿名網站：晚上回到家留一句心情，別人不能回覆，只能為你點一盞燈。
燈亮在台灣的夜晚地圖上 24 小時，房子會記得每一晚。

這個 repo 只放網站上的文字，讓大家幫忙翻成其他語言。現在最需要的是：

- **香港（`zh-HK`）**：香港書面語與香港用詞，不是把繁體字轉一轉。
- **給海外的人看的語言**（例如 `en`、`ja`）：海外的人可以看留言、為人點燈，不能留言。

## 怎麼參與

### 在 Crowdin 上翻（不用寫程式）

到 **https://crowdin.com/project/porchlamps** ，用 Google 或 GitHub 帳號登入，選語言之後一句一句翻就好。
你也可以替別人的譯文投票。翻好的字會自動送回這裡，作者看過後才會上線。

翻譯前請先讀 [CONTRIBUTING.md](CONTRIBUTING.md) 的語氣與安全文字的部分。

### 會用 GitHub 的話

1. Fork 這個 repo，在 `messages/<語言>/ui.json` 翻一部分就可以發 PR，不用一次翻完；沒翻的字會顯示中文。
3. PR 會自動檢查格式（`npm install && npm run validate`）。
4. `STALE.md` 列出中文改過、譯文需要更新的地方。

中文原文在 `messages/zh-TW/`，由網站自動匯出，請不要改那裡。

## 授權

這裡的中文原文與所有譯文採 [CC BY 4.0](LICENSE)。在 Crowdin 或用 PR 貢獻翻譯，即表示你同意以 CC BY 4.0 授權你的譯文。
