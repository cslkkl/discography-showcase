import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'assets/**', 'screenshots/**', 'js/data.js', '_data/TS*.js']
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

  /* 关闭所有与 Prettier 冲突的格式类规则；格式交给 prettier --check */
  prettier
];
