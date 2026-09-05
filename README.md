# Investment Data Dashboard

一个浅色管理报告风格的静态融资数据看板，使用 HTML、CSS 和 JavaScript 制作。

数据来源为 `具身公司融资看板.xlsx` 中的 `【作图】具身公司融资明细` 工作表，并转换为静态 `data.js` 文件供网页读取。

## 功能

- 顶部核心融资指标
- 估值区间公司数量
- 累计融资额区间公司数量
- 分类平均融资额与估值
- 最新融资额 Top20
- 浏览器内数据编辑页
- 导出 `data.js` 或 CSV

## 使用方式

直接打开 `index.html` 即可查看，也可以通过 GitHub Pages 发布。

打开 `editor.html` 可以直接编辑公司数据，新增或删除公司，并导出新的 `data.js` 或 CSV。

后续如果数据更新，只需要替换 `data.js`，网页图表会自动按新数据计算。
