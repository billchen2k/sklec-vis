import{select,line,curveLinear}from"d3";!function(t){"use strict";"undefined"==typeof L&&function(t){throw"L.Pather: Leaflet.js is required: http://leafletjs.com/."}();const e={VIEW:1,CREATE:2,EDIT:4,DELETE:8,APPEND:16,EDIT_APPEND:20,ALL:31};L.Pather=L.FeatureGroup.extend({initialize:function(t){this.options=Object.assign(this.defaultOptions(),t||{}),this.creating=!1,this.polylines=[],this.eventHandlers=[]},createPath:function(t){if(t.length<=1)return!1;this.clearAll();const e=new L.Pather.Polyline(this.map,t,this.options,{fire:this.fire.bind(this),mode:this.getMode.bind(this),remove:this.removePath.bind(this)});return this.polylines.push(e),this.fire("created",{polyline:e,latLngs:e.getLatLngs()}),e},removePath:function(t){if(t instanceof L.Pather.Polyline){const e=this.polylines.indexOf(t);return this.polylines.splice(e,1),t.softRemove(),this.fire("deleted",{polyline:t,latLngs:[]}),!0}return!1},getPaths:function(){return this.polylines},onAdd:function(t){const e=this.element=this.options.element||t.getContainer();this.draggingState=t.dragging._enabled,this.map=t,this.fromPoint={x:0,y:0},this.svg=select(e).append("svg").attr("pointer-events","none").attr("class",this.getOption("moduleClass")).attr("width",this.getOption("width")).attr("height",this.getOption("height")),t.dragging.disable(),this.attachEvents(t),this.setMode(this.options.mode)},onRemove:function(){if(this.svg.remove(),this.options.removePolylines){let t=this.polylines.length;for(;t--;)this.removePath(this.polylines[t])}this.map.off("mousedown",this.eventHandlers.mouseDown),this.map.off("mousemove",this.eventHandlers.mouseMove),this.map.off("mouseup",this.eventHandlers.mouseUp),this.map.getContainer().removeEventListener("mouseleave",this.eventHandlers.mouseLeave),this.element.classList.remove("mode-create"),this.element.classList.remove("mode-delete"),this.element.classList.remove("mode-edit"),this.element.classList.remove("mode-append");const t=this.map.getContainer().querySelector(".leaflet-tile-pane"),e=this.draggingState?"enable":"disable";t.style.pointerEvents="all",this.map.dragging[e]()},getEvent:function(t){return t.touches?t.touches[0]:t},edgeBeingChanged:function(){const t=this.polylines.filter((function(t){return t.manipulating}));return 0===t.length?null:t[0]},isPolylineCreatable:function(){return!!(this.options.mode&e.CREATE)},events:{mouseDown:function(t){t=t.originalEvent||this.getEvent(t);const e=this.map.mouseEventToContainerPoint(t),n=this.map.containerPointToLatLng(e);this.isPolylineCreatable()&&!this.edgeBeingChanged()&&(this.creating=!0,this.fromPoint=this.map.latLngToContainerPoint(n),this.latLngs=[])},mouseMove:function(t){t=t.originalEvent||this.getEvent(t);const e=this.map.mouseEventToContainerPoint(t);if(this.edgeBeingChanged())return void this.edgeBeingChanged().moveTo(this.map.containerPointToLayerPoint(e));const n=line().x((function(t){return t.x})).y((function(t){return t.y})).curve(curveLinear);if(this.creating){const t=[this.fromPoint,new L.Point(e.x,e.y,!1)];this.latLngs.push(e),this.svg.append("path").classed(this.getOption("lineClass"),!0).attr("d",n(t)).attr("stroke",this.getOption("strokeColour")).attr("stroke-width",this.getOption("strokeWidth")).attr("fill","none"),this.fromPoint={x:e.x,y:e.y}}},mouseLeave:function(){this.clearAll(),this.creating=!1},mouseUp:function(){if(this.creating)return this.creating=!1,this.createPath(this.convertPointsToLatLngs(this.latLngs)),void(this.latLngs=[]);this.edgeBeingChanged()&&(this.edgeBeingChanged().attachElbows(),this.edgeBeingChanged().finished(),this.edgeBeingChanged().manipulating=!1)}},attachEvents:function(t){this.eventHandlers={mouseDown:this.events.mouseDown.bind(this),mouseMove:this.events.mouseMove.bind(this),mouseUp:this.events.mouseUp.bind(this),mouseLeave:this.events.mouseLeave.bind(this)},this.map.on("mousedown",this.eventHandlers.mouseDown),this.map.on("mousemove",this.eventHandlers.mouseMove),this.map.on("mouseup",this.eventHandlers.mouseUp),this.map.getContainer().addEventListener("mouseleave",this.eventHandlers.mouseLeave),this.map.getContainer().addEventListener("touchstart",this.fire.bind(t,"mousedown")),this.map.getContainer().addEventListener("touchmove",this.fire.bind(t,"mousemove")),this.map.getContainer().addEventListener("touchend",this.fire.bind(t,"mouseup"))},convertPointsToLatLngs:function(t){return t.map(function(t){return this.map.containerPointToLatLng(t)}.bind(this))},clearAll:function(){this.svg.text("")},getOption:function(t){return this.options[t]||this.defaultOptions()[t]},defaultOptions:function(){return{moduleClass:"pather",lineClass:"drawing-line",detectTouch:!0,elbowClass:"elbow",removePolylines:!0,strokeColour:"rgba(0,0,0,.5)",strokeWidth:2,width:"100%",height:"100%",smoothFactor:10,pathColour:"black",pathOpacity:.55,pathWidth:3,mode:e.ALL}},setSmoothFactor:function(t){this.options.smoothFactor=parseInt(t)},setMode:function(n){this.setClassName(n),this.options.mode=n;const i=this.map.getContainer().querySelector(".leaflet-tile-pane");if(function(){return this.detectTouch&&("ontouchstart"in t||"onmsgesturechange"in t)?this.options.mode&e.CREATE||this.options.mode&e.EDIT:this.options.mode&e.CREATE}.bind(this)()){const t=this.draggingState?"disable":"enable";return i.style.pointerEvents="none",void this.map.dragging[t]()}i.style.pointerEvents="all",this.map.dragging.enable()},setClassName:function(t){const n=function(n){const i=["mode",n].join("-");e[n.toUpperCase()]&t?this.element.classList.add(i):this.element.classList.remove(i)}.bind(this);n("create"),n("delete"),n("edit"),n("append")},getMode:function(){return this.options.mode},setOptions:function(t){this.options=Object.assign(this.options,t||{})}}),L.Pather.MODE=e,L.pather=function(t){return new L.Pather(t)}}(window),function(){"use strict";Object.assign||Object.defineProperty(Object,"assign",{enumerable:!1,configurable:!0,writable:!0,value:function(t,e){if(null==t)throw new TypeError("Cannot convert first argument to object");const n=Object(t);for(let t=1;t<arguments.length;t++){let e=arguments[t];if(null==e)continue;e=Object(e);const i=Object.keys(Object(e));for(let t=0,s=i.length;t<s;t++){const s=i[t],o=Object.getOwnPropertyDescriptor(e,s);void 0!==o&&o.enumerable&&(n[s]=e[s])}}return n}})}(),function(){"use strict";const t="undefined"==typeof Symbol?"_pather":Symbol.for("pather");L.Pather.Polyline=function(t,e,n,i){this.options={color:n.pathColour,opacity:n.pathOpacity,weight:n.pathWidth,smoothFactor:n.smoothFactor||1,elbowClass:n.elbowClass},this.polyline=new L.Polyline(e,this.options).addTo(t),this.map=t,this.methods=i,this.edges=[],this.manipulating=!1,this.attachPolylineEvents(this.polyline),this.select()},L.Pather.Polyline.prototype={select:function(){this.attachElbows()},deselect:function(){this.manipulating=!1},attachElbows:function(){this.detachElbows(),this.polyline._parts[0].forEach(function(e){const n=new L.DivIcon({className:this.options.elbowClass}),i=this.map.layerPointToLatLng(e),s=new L.Marker(i,{icon:n}).addTo(this.map);s[t]={point:e},this.attachElbowEvents(s),this.edges.push(s)}.bind(this))},detachElbows:function(){this.edges.forEach(function(t){this.map.removeLayer(t)}.bind(this)),this.edges.length=0},attachPolylineEvents:function(t){t.on("click",function(t){if(t.originalEvent.stopPropagation(),t.originalEvent.preventDefault(),this.methods.mode()&L.Pather.MODE.APPEND){const e=this.map.mouseEventToLatLng(t.originalEvent);this.insertElbow(e)}else this.methods.mode()&L.Pather.MODE.DELETE&&this.methods.remove(this)}.bind(this))},attachElbowEvents:function(t){t.on("mousedown",function(e){e=e.originalEvent||e,this.methods.mode()&L.Pather.MODE.EDIT&&(e.stopPropagation&&(e.stopPropagation(),e.preventDefault()),this.manipulating=t)}.bind(this)),t.on("mouseup",(function(t){(t=t.originalEvent||t).stopPropagation&&(t.stopPropagation(),t.preventDefault()),this.manipulating=!1})),t._icon.addEventListener("touchstart",t.fire.bind(t,"mousedown")),t._icon.addEventListener("touchend",t.fire.bind(t,"mouseup"))},insertElbow:function(t){const e=this.map.latLngToLayerPoint(t);let n=1/0,i=-1;const s=this.polyline._parts[0];s.forEach((function(t,o){const a=s[o+1]||s[0],h=L.LineUtil.pointToSegmentDistance(e,t,a);h<n&&(n=h,i=o)})),s.splice(i+1,0,e);const o=s.map(function(t){return{_latlng:this.map.layerPointToLatLng(t)}}.bind(this));this.redraw(o),this.attachElbows()},moveTo:function(t){const e=this.map.layerPointToLatLng(t);this.manipulating.setLatLng(e),this.redraw(this.edges)},finished:function(){this.methods.fire("edited",{polyline:this,latLngs:this.getLatLngs()})},redraw:function(t){const e=[],n={};t.forEach((function(t){e.push(t._latlng)})),Object.keys(this.options).forEach(function(t){n[t]=this.options[t]}.bind(this)),n.smoothFactor=0,this.softRemove(!1),this.polyline=new L.Polyline(e,n).addTo(this.map),this.attachPolylineEvents(this.polyline)},softRemove:function(t){t=void 0===t||t,this.map.removeLayer(this.polyline),t&&this.edges.forEach(function(t){this.map.removeLayer(t)}.bind(this))},getLatLngs:function(){return this.polyline._parts[0].map(function(t){return this.map.layerPointToLatLng(t)}.bind(this))}}}();