if(!self.define){let e,r={};const i=(i,a)=>(i=new URL(i+".js",a).href,r[i]||new Promise((r=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=r,document.head.appendChild(e)}else e=i,importScripts(i),r()})).then((()=>{let e=r[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(a,n)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(r[c])return;let s={};const d=e=>i(e,c),o={module:{uri:c},exports:s,require:d};r[c]=Promise.all(a.map((e=>o[e]||d(e)))).then((e=>(n(...e),s)))}}define(["./workbox-85077874"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"/.DS_Store",revision:"f716eb15352eba8341e2505cf385ef4d"},{url:"/android-chrome-192x192.png",revision:"9f324396e9022a40fd0e685224520a5d"},{url:"/android-chrome-512x512.png",revision:"6e49b38a4baf6c436f6913fb0a1d0cf0"},{url:"/apple-touch-icon.png",revision:"a48de6dd6c6690d8cbdcb8ef7c0d83f5"},{url:"/dataset/.DS_Store",revision:"e2c957db3abd3bd86297cfb5544c9717"},{url:"/dataset/ADCP_202009-10.csv",revision:"e8356b4045611ab620f8e99171585305"},{url:"/favicon-16x16.png",revision:"580174b7724020347779b7ce2d13827f"},{url:"/favicon-32x32.png",revision:"e85b237a3a65dd669354877b34181cf1"},{url:"/favicon.ico",revision:"86d1505fe931995bce9737e8df2b50b3"},{url:"/img/.DS_Store",revision:"0e442ee35bf506a0ab9795549a19b1ac"},{url:"/img/anchor.png",revision:"55168aa82a132132337d1454308c0f14"},{url:"/img/anchor@2x.png",revision:"90564b80bbf0e6ae239f71903ca70cbf"},{url:"/img/markers/marker-cyan.png",revision:"a7917accdbb96848d80abd72956a2586"},{url:"/img/markers/marker-cyan@2x.png",revision:"83a56c56957955439286cafc96596fdd"},{url:"/img/markers/marker-green.png",revision:"4d95fe37a6e88df2f8b60b8a0033e46c"},{url:"/img/markers/marker-green@2x.png",revision:"66b3ee881ede62fe095ad7f3a8446682"},{url:"/img/markers/marker-red.png",revision:"488c157115ff234cfb26eed3608da141"},{url:"/img/markers/marker-red@2x.png",revision:"2d728697343be9759c5b4af206055582"},{url:"/index.html",revision:"8c128e80b0b3482c67dab3911676b327"},{url:"/js/d3-3.5.5.js",revision:"eb85df2fc0ee335e5ef1cb993406704d"},{url:"/js/d3-3.5.5.min.js",revision:"bf378a2ca392f3f366ac0853d0968e93"},{url:"/js/leaflet.label.js",revision:"a2346e9e4f45c07d5c9c3c57ad6a8af0"},{url:"/js/leaflet.pather.js",revision:"06a277df8b6785d4e0dcce1a38dc5ae3"},{url:"/main.css",revision:"baba2cf893977fbf14be407bb6785687"},{url:"/main.js.LICENSE.txt",revision:"e1cfabab61b532be910bc91889b8e537"},{url:"/robots.txt",revision:"fa1ded1ed7c11438a9b0385b1e112850"}],{})}));
