# 要更新的翻譯

中文原文改過、譯文還是舊的。由 `npm run i18n:export` 產生，不要手改。

## en

- `city.pick`：「你現在在哪個縣市」→「{scope, select, many {你現在在哪裡} other {你現在在哪個縣市}}」
- `compose.cityOnly`：「只會顯示縣市」→「{region, select, hk {只會顯示地區} many {只會顯示所在的地方} other {只會顯示縣市}}」
- `compose.share.hint`：「卡片上不會有你的名字和縣市；分享出去的圖收不回來」→「{region, select, hk {卡片上不會有你的名字和地區；分享出去的圖收不回來} many {卡片上不會有你的名字和所在的地方；分享出去的圖收不回來} other {卡片上不會有你的名字和縣市；分享出去的圖收不回來}}」
- `firework.fire`：「選一個縣市放」→「{scope, select, many {選一個地方放} other {選一個縣市放}}」
- `firework.pick`：「點一個縣市放煙火」→「{scope, select, many {點一個地方放煙火} other {點一個縣市放煙火}}」
- `map.collectedLabel`：「{count, plural, =0 {還沒收到其他縣市的燈} other {已收到這些縣市的燈：{cityNames}}}」→「{scope, select, many {{count, plural, =0 {還沒收到其他地方的燈} other {已收到這些地方的燈：{cityNames}}}} other {{count, plural, =0 {還沒收到其他縣市的燈} other {已收到這些縣市的燈：{cityNames}}}}}」
- `me.cityLabel`：「你的縣市」→「{region, select, hk {你的地區} many {你所在的地方} other {你的縣市}}」

## zh-HK

- `city.pick`：「你現在在哪個縣市」→「{scope, select, many {你現在在哪裡} other {你現在在哪個縣市}}」
- `compose.cityOnly`：「只會顯示縣市」→「{region, select, hk {只會顯示地區} many {只會顯示所在的地方} other {只會顯示縣市}}」
- `compose.share.hint`：「卡片上不會有你的名字和縣市；分享出去的圖收不回來」→「{region, select, hk {卡片上不會有你的名字和地區；分享出去的圖收不回來} many {卡片上不會有你的名字和所在的地方；分享出去的圖收不回來} other {卡片上不會有你的名字和縣市；分享出去的圖收不回來}}」
- `firework.fire`：「選一個縣市放」→「{scope, select, many {選一個地方放} other {選一個縣市放}}」
- `firework.pick`：「點一個縣市放煙火」→「{scope, select, many {點一個地方放煙火} other {點一個縣市放煙火}}」
- `map.collectedLabel`：「{count, plural, =0 {還沒收到其他縣市的燈} other {已收到這些縣市的燈：{cityNames}}}」→「{scope, select, many {{count, plural, =0 {還沒收到其他地方的燈} other {已收到這些地方的燈：{cityNames}}}} other {{count, plural, =0 {還沒收到其他縣市的燈} other {已收到這些縣市的燈：{cityNames}}}}}」
- `me.cityLabel`：「你的縣市」→「{region, select, hk {你的地區} many {你所在的地方} other {你的縣市}}」
