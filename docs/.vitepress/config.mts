import { defineConfig } from "vitepress";
import pkg from "../../package.json";

export default defineConfig({
  title: "𝓡esy",
  description: "Development documentation for the state management engine 'Resy'",
  markdown: {
    image: {
      // 默认禁用；设置为 true 可为所有图片启用懒加载。
      lazyLoading: true
    }
  },
  head: [
    [
      "link",
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/logo.svg"
      },
    ],
  ],
  themeConfig: {
    logo: "/logo.svg",
    search: {
      provider: "local",
      // provider: 'algolia',
      // options: {
      //   appId: '8J64VVRP8K',
      //   apiKey: '52f578a92b88ad6abde815aae2b0ad7c',
      //   indexName: 'resy',
      //   locales: {
      //     zh: {
      //       placeholder: '搜索文档',
      //       translations: {
      //         button: {
      //           buttonText: '搜索文档',
      //           buttonAriaLabel: '搜索文档'
      //         },
      //         modal: {
      //           searchBox: {
      //             resetButtonTitle: '清除查询条件',
      //             resetButtonAriaLabel: '清除查询条件',
      //             cancelButtonText: '取消',
      //             cancelButtonAriaLabel: '取消'
      //           },
      //           startScreen: {
      //             recentSearchesTitle: '搜索历史',
      //             noRecentSearchesText: '没有搜索历史',
      //             saveRecentSearchButtonTitle: '保存至搜索历史',
      //             removeRecentSearchButtonTitle: '从搜索历史中移除',
      //             favoriteSearchesTitle: '收藏',
      //             removeFavoriteSearchButtonTitle: '从收藏中移除'
      //           },
      //           errorScreen: {
      //             titleText: '无法获取结果',
      //             helpText: '你可能需要检查你的网络连接'
      //           },
      //           footer: {
      //             selectText: '选择',
      //             navigateText: '切换',
      //             closeText: '关闭',
      //             searchByText: '搜索提供者'
      //           },
      //           noResultsScreen: {
      //             noResultsText: '无法找到相关结果',
      //             suggestedQueryText: '你可以尝试查询',
      //             reportMissingResultsText: '你认为该查询应该有结果？',
      //             reportMissingResultsLinkText: '点击反馈'
      //           }
      //         }
      //       }
      //     },
      //   },
      // },
    },
    nav: [
      { text: "指南", link: "/pages/quick-start.md" },
      {
        text: pkg.version,
        items: [
          {
            text: "更新日志",
            link: "https://github.sheincorp.cn/lsbFlying/resy/blob/master/CHANGELOG.md",
          },
        ]
      },
    ],
    sidebar: [
      {
        text: "开始",
        collapsed: false,
        items: [
          { text: "简介", link: "/pages/introduce.md" },
          { text: "快速上手", link: "/pages/quick-start.md" },
        ]
      },
      {
        text: "store",
        collapsed: false,
        items: [
          { text: "生成 store", link: "/pages/generate-store.md" },
          { text: "defineStore", link: "/pages/defineStore.md" },
          { text: "createStore", link: "/pages/createStore.md" },
          { text: "API 参数", link: "/pages/using-detail.md" },
        ]
      },
      {
        text: "设计",
        collapsed: false,
        items: [
          { text: "类型设计", link: "/pages/type-design.md" },
          { text: "层次设计", link: "/pages/level-design.md" },
          { text: "模块化", link: "/pages/modularity.md" },
          { text: "设计与概念", link: "/pages/design-concept.md" },
          { text: "对比总结", link: "/pages/compare-summary.md" },
        ]
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/lsbFlying/resy",
      }
    ],
    docFooter: {
      prev: "上一页",
      next: "下一页"
    },
    outline: {
      label: "页面导航"
    },
    footer: {
      message: "基于 MIT 许可发布",
      copyright: `版权所有 © 2022-${new Date().getFullYear()} 刘善保`
    },
  }
});
