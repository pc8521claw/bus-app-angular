# 🚌 KMB Bus App (Angular)

九龍巴士（KMB）及城巴（Citybus）路線查詢系統，使用 Angular 21 開發。

## 功能概覽

### 路線搜尋
- 輸入路線號碼即可搜尋 KMB / CTB 巴士路線
- 支援「出市區 (Outbound)」及「入郊區 (Inbound)」兩種方向
- 當同一路線同時存在於兩間公司時，自動顯示選擇介面
- 空白輸入時顯示友好錯誤提示

### 路線結果頁
- 顯示路線起點 → 終點（中英文名稱）
- 公司標籤區分（KMB 橙底 / CTB 藍底）
- 全程車費、服務時間（首班車 → 尾班車）
- 平日/假日班次表
- 一鍵切換方向，快速查看反向路線

### 巴士站列表 + 到站時間 (ETA)
- 按順序顯示路線所有巴士站（中英文）
- 每站可獨立點擊查詢到站時間
- 每 30 秒自動更新到站時間
- 手動更新按鈕，隨時刷新數據
- 車站位置連結至 Google Maps
- 非服務時間提示「而家冇班車」

### 收藏功能
- ⭐ 一鍵收藏常用路線
- 收藏路線顯示於首頁，方便快速訪問
- 數據本地存儲（localStorage），關閉瀏覽器後依然保留

### 最近搜尋
- 自動記錄最近搜索過的路線
- 顯示公司顏色標記（橙點 = KMB，藍點 = CTB）
- 顯示行駛方向（出/入）

---

## 目錄架構

```
bus-app-angular/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── stop-list/              # 巴士站列表 + ETA 組件
│   │   │       └── stop-list.component.ts
│   │   ├── models/
│   │   │   └── types.ts                # TypeScript 介面定義
│   │   ├── pages/
│   │   │   ├── home/                   # 首頁：搜尋表單 + 結果 + 收藏 + 最近
│   │   │   │   └── home.component.ts
│   │   │   └── route/                  #路線結果頁
│   │   │       └── route.component.ts
│   │   ├── services/
│   │   │   ├── kmb-api.service.ts      # KMB / CTB API 服務
│   │   │   ├── fare-data.service.ts    # 車費數據服務
│   │   │   └── storage.service.ts      # localStorage 存取服務
│   │   ├── app.ts                      # 根組件
│   │   ├── app.config.ts               # 應用配置
│   │   │   └── app.routes.ts           # 路由配置
│   ├── assets/
│   │   └── data/
│   │       └── routeFareList.min.json  # 車費資料
│   ├── styles.css                      # 全域樣式 + Tailwind CSS v4
│   └── index.html
├── angular.json
├── proxy.conf.json                     # API 代理配置（解決 CORS）
└── package.json
```

---

## 技術特色

| 特色 | 說明 |
|------|------|
| Angular 21 Standalone | 最新 Standalone Components 架構，無需 NgModule |
| Proxy 解決 CORS | 開發階段透過 Angular Proxy 代理 API 請求 |
| RxJS Observables | 使用 forkJoin 並行請求 KMB + CTB 數據 |
| Change Detection | 使用 ChangeDetectorRef 確保 UI 及時更新 |
| Tailwind CSS v4 | 與 React 版本一致的顏色系統 |
| 響應式設計 | 支援手機、平板、電腦各種屏幕尺寸 |
| localStorage | 本地持久化收藏及搜索記錄 |
| TypeScript 強類型 | 完整的介面定義及類型安全 |

---

## API 數據來源

| 公司 | API 端點 | 用途 |
|------|----------|------|
| KMB 九龍巴士 | `data.etabus.gov.hk` |路線、站點、ETA |
| CTB 城巴 | `rt.data.gov.hk` | 路線、站點、ETA |
| 車費資料 | `src/assets/data/routeFareList.min.json` | 本地 JSON |

---

## 開發

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
ng serve --host 0.0.0.0
# 訪問 http://localhost:4200
```

### 建構生產版本

```bash
ng build
```

---

## 相關專案

| 版本 | 框架 | 用途 |
|------|------|------|
| [bus-app-angular](https://github.com/pc8521claw/bus-app-angular) | Angular 21 | ERB 功課提交 |
| [kmb-bus-app](https://github.com/pc8521claw/kmb-bus-app) | Next.js (React) | 生產展示版本 |

---

## 📝 License

MIT License

Copyright (c) 2026 Raymond Lam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
