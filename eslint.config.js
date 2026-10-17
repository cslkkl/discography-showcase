import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  {
    /* dist/ 是 pack-public 生成的发布包（原始檔的複本），不重複檢查 */
    ignores: [
      'node_modules/**',
      'assets/**',
      'screenshots/**',
      'dist/**',
      'js/data.js',
      /* 本機態的歌詞內聯 payload：生成物，且不進版本庫 */
      'js/lyrics/**',
      '_data/TS*.js',
      /* Task 04 的舞台模組：獨立的子專案，有自己的建置與規則。
         vendored/ 是 Folia 上游原始碼（逐字複本，AGPL-3.0，我們不改它），
         dist/ 是 Vite 產物，兩者都不該由本站的 ESLint 規則檢查。
         stage/src/ 是本站自己的適配層，在下面的區塊單獨設規則。 */
      'stage/vendored/**',
      'stage/dist/**',
      'stage/node_modules/**',
      'stage/dev/**'
    ]
  },

  js.configs.recommended,

  /* 站点脚本：浏览器经典脚本（<script src> 直接加载），不是 ES 模块。
     JC 由 js/data.js 建立，是跨文件全局，在此显式声明。 */
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        JC: 'readonly'
      }
    }
  },

  /* 生成器与本地服务器：Node ESM（.mjs） */
  {
    files: ['_data/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    }
  },

  /* 本機工具（Task 04 的兩層分析）：Node ESM。analyze-audio.mjs 會在 Playwright
     頁面內 evaluate 一小段瀏覽器程式碼，所以 browser 全域也要給；其餘檔案用不到，
     多給只是為了讓同一批檔案共用一個區塊，與 stage/src 的處理方式一致。 */
  {
    files: ['tools/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    }
  },

  /* 关闭所有与 Prettier 冲突的格式类规则；格式交给 prettier --check */
  prettier,

  /* Task 04 舞台模組：本站自己的適配層（stage/src/、stage/*.mjs）。
     上游 vendored 原始碼不在這裡——它是別人的專案，本站不對它排版或設規則。
     用 ESM + 瀏覽器全域；React JSX 由子專案的建置處理，不在此處展開。 */
  {
    files: ['stage/src/**/*.{js,mjs,jsx}', 'stage/*.mjs', 'stage/dev/**/*.mjs'],
    plugins: { react },
    rules: {
      /* core 的 no-unused-vars 不把 JSX 裡的識別字當成引用，所以
         `import VisualizerRenderer from …` 後面用 <VisualizerRenderer/> 仍被判成未使用
         （實測：StageRoot.jsx 的兩條 import 各報一個 error）。這條規則就是補這個缺口；
         用 eslint-plugin-react 的最小開銷，不上整套 react 推薦集。 */
      'react/jsx-uses-vars': 'error'
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  }
];
