if(!self.define){let e,r={};const i=(i,a)=>(i=new URL(i+".js",a).href,r[i]||new Promise((r=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=r,document.head.appendChild(e)}else e=i,importScripts(i),r()})).then((()=>{let e=r[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(a,n)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(r[c])return;let o={};const s=e=>i(e,c),d={module:{uri:c},exports:o,require:s};r[c]=Promise.all(a.map((e=>d[e]||s(e)))).then((e=>(n(...e),o)))}}define(["./workbox-85077874"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"/android-chrome-192x192.png",revision:"9f324396e9022a40fd0e685224520a5d"},{url:"/android-chrome-512x512.png",revision:"6e49b38a4baf6c436f6913fb0a1d0cf0"},{url:"/apple-touch-icon.png",revision:"a48de6dd6c6690d8cbdcb8ef7c0d83f5"},{url:"/dataset/ADCP_202009-10.csv",revision:"e2edcfc83f24885c24cd2354c64aaa2b"},{url:"/favicon-16x16.png",revision:"580174b7724020347779b7ce2d13827f"},{url:"/favicon-32x32.png",revision:"e85b237a3a65dd669354877b34181cf1"},{url:"/favicon.ico",revision:"86d1505fe931995bce9737e8df2b50b3"},{url:"/img/anchor.png",revision:"55168aa82a132132337d1454308c0f14"},{url:"/img/anchor@2x.png",revision:"90564b80bbf0e6ae239f71903ca70cbf"},{url:"/img/markers/marker-cyan.png",revision:"a7917accdbb96848d80abd72956a2586"},{url:"/img/markers/marker-cyan@2x.png",revision:"83a56c56957955439286cafc96596fdd"},{url:"/img/markers/marker-green.png",revision:"4d95fe37a6e88df2f8b60b8a0033e46c"},{url:"/img/markers/marker-green@2x.png",revision:"66b3ee881ede62fe095ad7f3a8446682"},{url:"/img/markers/marker-red.png",revision:"488c157115ff234cfb26eed3608da141"},{url:"/img/markers/marker-red@2x.png",revision:"2d728697343be9759c5b4af206055582"},{url:"/img/markers/marker-yellow.png",revision:"9c034320f965a0061cd416ba0ce0afc8"},{url:"/img/markers/marker-yellow@2x.png",revision:"a97382005080218c927551ad89c95f7b"},{url:"/index.html",revision:"8c128e80b0b3482c67dab3911676b327"},{url:"/js/leaflet.pather.js",revision:"06a277df8b6785d4e0dcce1a38dc5ae3"},{url:"/main.css",revision:"6776ed1f22e3588b260f767a944ee702"},{url:"/main.js.LICENSE.txt",revision:"0281c1b097964ee1a2fec4cae3135999"},{url:"/robots.txt",revision:"fa1ded1ed7c11438a9b0385b1e112850"}],{})}));
