/**

version = 90
update	= ../../template/inco/js_base.tpl
store	= ../mini/js/base/

**/


/*
	Global namespace VI(6 in Roman Numberals)

	VI 寓意 六。
 */

/**

VI = {};

// 返回唯一ID，逻辑与 Mootools 中 String.uniqueID 相同。
VI.guid = function() {
	var stamp = new Date().getTime() - 365 * 24 * 60 * 60 * 1000;

	return function() {
		return (++stamp).toString(36);
	}
}();
**/

/*
	混合两个对象。

	@param r - 接收对象
	@param s - 提供对象
	@param ov (option) - overwrite 是否覆盖原属性
	@param wl (option) - 白名单， 只有在白名单中的属性才会复制给接收对象。
	@param merge (option) - 是否混合子对象。
 */

/** 2016-08-08 han
VI.mix = function(r, s, ov, wl, merge) {
	var i, l, p;

	if (wl && wl.length) {
		for (i = 0, l = wl.length; i < l; ++i) {
			p = wl[i];
			if (s.hasOwnProperty(p)) {
				if (merge && isObject(r[p])) {
					this.mix(r[p], s[p]);
				} else if (ov || !(p in r)) {
					r[p] = s[p];
				}
			}
		}
	} else {
		for (i in s) {
			if (s.hasOwnProperty(i)) {
				if (merge && isObject(r[i])) {
					this.mix(r[i], s[i], ov, wl, true);
				} else if (ov || !(i in r)) {
					r[i] = s[i];
				}
			}
		}
	}
	return r;
};


VI.extend = function(r, s, px, sx) {
	if (! s || ! r) {
		return r;
	}

	var OP = Object.prototype;
	var O = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	}
	var sp = s.prototype;
	var rp = O(sp);
	r.prototype = rp;
	rp.constructor = r;
	r.superclass = sp;

	// assign constructor property
	if (s !== Object && sp.constructor === OP.constructor) {
		sp.constructor = s;
	}

	// add prototype overrides
	if (px) {
		this.mix(rp, px, true);
	}

	// add object overrides
	if (sx) {
		this.mix(r, sx, true);
	}

	return r;
};


VI.Event = function() {
    var Event = function() {
        this._events = null;
    };

	Event.prototype = {

		on: function(type, handler) {
			this._bindEventOnceOrNormally(type, handler);
		},

		one: function(type, handler) {
			this._bindEventOnceOrNormally(type, handler, true);
		},

		off: function(type, handler) {
            var events = this._events;
            var handlers = events && type && events[type];

            if (handlers && handler) {
                 for (var i = 0; i < handlers.length; i++) {
                    if (handler == handlers[i]) {
                        handlers.splice(i, 1);
                    }
                }

            } else if (handlers) {
                this._events[type] = [];

            // teardown all handler quickly.
            } else {
                this._events = {};
            }
		},

		trigger: function(type) {
            var events = this._events;
            var handlers = events && events[type];
            var args = [].slice.call(arguments);

            args.shift();

            if (handlers) {
                for (var i = 0; i < handlers.length; i++) {
                    var handler = handlers[i];

                    handler.apply(this, args);
                    if (handler._once) {
                        handlers.splice(i, 1);
                    }
                }                
            }
		},

        _bindEventOnceOrNormally: function(type, handler, once) {
            var events = this._events || (this._events = {})
            var types = events[type] || (events[type] = []);

            if (handler) {
                handler._once = !!once
                types.push(handler)
            }
        }
	};

	return Event;
}();


VI.Option = function() {
	var Option = function() {
		this.option = {};
	};

	Option.prototype = {
		config: function(defaultOpt, opt) {
	        if (arguments.length == 1) {
	            opt = defaultOpt;
	            defaultOpt = this.option || {};
	        }

	        var obj = jQuery.extend({}, defaultOpt, opt);
	        var self = this;
	        var events;
	        	        
	        if (events = obj.events) {
	        	for (var key in events) {
	        		events[key] && this.on(key, events[key]);
	        	}
		        obj.events = events = null;	        	
	        }

	        return (this.option = obj);	
		}
	};

	VI.mix(Option.prototype, VI.Event.prototype);

	return Option;
}();


VI.Widget = function() {
	var $ = jQuery;

	var Widget = function(elem) {
	    this.id = '';
	    this.__dom = null;

	    if (elem) {
	    	this.fit(elem);
	    	this.mount();
	    }
	};
	
	Widget.prototype = {
	    fit: function(elem) {
            this.id = this.mark(elem);

            // maybe elem is empty jQuery object.
            elem = elem.jquery ? elem[0] : elem;

            if (elem && (!elem.parentNode || elem.parentNode.nodeType == 11)) {
            	this.__dom = elem;
            }
            return $(elem);
	    },
	    
	    elem: function() {
	    	var dom;
	    	var id;

	    	if (dom = this.__dom) {
	    		return $(dom);

	    	} else if (id = this.id) {
	    		return this.mark(id);

	    	} else {
	    		throw 'Widget don\'t fit any element yet';
	    	}
	    },

	    mount: function(container) {
	    	var dom = this.__dom;
	    	
	    	if (dom && (!dom.parentNode || dom.parentNode.nodeType == 11)) {
	    		this.addToDocument(container);
	    		this.trigger('mount');
	    	}
	    	delete this.__dom;
	    },
		
		mark: function(idOrElem) {
			if (typeof idOrElem == 'string') {
				return $('#' + idOrElem);

			} else {
				var elem = $(idOrElem);
				var id = elem.attr('id') || VI.guid();
				
				elem.attr('id', id);
				return id;
			}
		}, 
	    
	    destroy: function() {
	        this.trigger('destory');
	        this.elem().remove();
	    },

	    // sometimes should be overwrite
	    addToDocument: function(container) {
    		container = container || document.body;
    		container.appendChild(this.__dom);
	    },

	    isMounted: function() {
	    	return this.__dom === undefined;
	    }
	};

	VI.mix(Widget.prototype, VI.Option.prototype);
	VI.mix(Widget, Widget.prototype, false, ['mark']);
	
	return Widget;
}();

VI.Overlay = function() {
	var $ = jQuery;
	
	// Why do this ?  
	// @see https://yuilibrary.com/forum/viewtopic.php?f=18&t=8799&p=28218
	// and  https://support.microsoft.com/kb/942840
	// but closure compiler maybe replace variables to literal , anyway this seems professional.
	var WIDTH = 'width';
	var HEIGHT = 'height';
	var DISPLAY = 'display';
	var NONE = 'none';
	var BLOCK = 'block';
	var POSITION = 'position';
	var VISIBILITY = 'visibility';
	var VISIBLE = 'visible';
	var HIDDEN = 'hidden';
	var ABSOLUTE = 'absolute';
	var LEFT = 'left';
	var TOP = 'top';
	var ZINDEX = 'zIndex';
	var AUTO = 'auto';
	
	
	var CONF = {
	    x: 0,
	    y: 0,
	    width: 0,
	    height: 0,
	    zIndex: 1000,
        align: false,
	    fill: null,
	    parent: null
        *
        events: {
            onFill: null,
            onBeforeShow: null,
            onAfterShow: null,
            onBeforeHide: null,
            onAfterHide: null            
        }
        *
	};
	
    var Overlay = function(config) {
        var elem = $('<div>');
        var conf;
        var styleObj = {};

        this.fit(elem);
        this.config(CONF, config);
        this.width = this.option.width;
        this.height = this.option.height;
        this.contentBox = null;
        this.on('mount', this._setSizePositionAndFillUp);        
    };

    Overlay.prototype = {
        fill: function(child){
            if (child) {
                var elem = this.elem();

                if (typeof child == 'string') {
                    elem.html(child);
                       
                } else {
                    elem.append(child);
                }

                this.contentBox = this.mark(elem.find(':first-child').eq(0));
                !this.width && this.getSize();

                this.trigger('fill');     
            }

        },
        
        getSize: function() {
            var elem = this.elem();
            var contentBox = this.getContentBox();
            var width;
            var height;
            
            if (elem.css(DISPLAY) == BLOCK) {
                width = contentBox.width();
                height = contentBox.height();

            } else {
                elem.css(VISIBILITY, HIDDEN);
                this._show();
                width = contentBox.width();
                height = contentBox.height();
                this._hide();
                elem.css(VISIBILITY, VISIBLE);                
            }
            
            this.width = width;
            this.height = height;
            
            return [width, height];
        },
        
        show: function() {
            if (!this.isMounted()) {
                this.mount();
            }

            this.trigger('beforeShow');
            this._show();
            this.trigger('afterShow');
        },
        
        hide: function() {
            this.trigger('beforeHide');
            this._hide();
            this.trigger('afterHide');
        },
        
        toggle: function() {
            var elem = this.elem();
            
            if (elem.css(DISPLAY) == NONE) {
                this.show();
            } else{
                this.hide();
            }
        },
        
        move: function(x, y) {
            this.moveX(x);
            this.moveY(y);
        }, 
        
        moveX: function(x) {
            this.elem().css(LEFT, x);
        },
        
        moveY: function(y) {
            this.elem().css(TOP, y);
        },
        
        // we ignore horizontal algin when parent has horizontal scrollbar.
        align: function(direction) {
            var elem = this.elem();
            var parent = $.nodeName(elem.parent()[0], 'body') ? window : elem.parent();
            var parentWidth = $(parent).width();
            var parentHeight = $(parent).height();
            var parentViewportHeight =  parent.jquery ? parent[0].clientHeight : $(parent).height();
            var parentScrollTop = $(parent).scrollTop();
            var width = this.width;
            var height = this.height;         
            var left = parentWidth/2 - width/2;
            var top;
            
            if (parentViewportHeight == 0 || parentHeight <= height) {
                top = parentScrollTop;
            } else {
                top = parentViewportHeight/2 - height/2 + parentScrollTop;
            }

            if (direction == 'horizontal') {
                this.moveX(left);
            } else if (direction == 'vertical') {
                this.moveY(top);
            } else {
                this.move(left, top);              
            }
        },

        getContentBox: function() {
            return this.mark(this.contentBox);
        },

        isShow: function() {
            var elem = this.elem();
            return ! elem.css(DISPLAY) == NONE
        },

        // overwrite from Widget
        addToDocument: function() {
            var option = this.option;
            var container = option.parent || document.body;

            $(container).append(this.elem());
        },

        _setSizePositionAndFillUp: function() {
            var option = this.option;
            var styleObj = {};
            var elem = this.elem();

            this.fill(option.fill);

            styleObj[DISPLAY] = NONE;
            styleObj[POSITION] = ABSOLUTE;
            styleObj[LEFT] = option.x;
            styleObj[TOP] = option.y;
            styleObj[WIDTH] = this.width || AUTO;
            styleObj[HEIGHT] = this.height || AUTO;
            styleObj[ZINDEX] = option.zIndex;
            
            elem.css(styleObj);
            option.align && this.align(option.align)
        },

        _show: function() {
            this.elem().css(DISPLAY, BLOCK);           
        },

        _hide: function() {
            this.elem().css(DISPLAY, NONE);            
        }
    }
    
    VI.mix(Overlay.prototype, VI.Widget.prototype);
    
    return Overlay;
}();

**/

/**
window.localStorage.getItem( key );
2 window.localStorage.setItem( key, value );
3 window.localStorage.removeItem( key );
4 window.localStorage.clear();
5 window.localStorage.length;
6 window.localStorage.key( i );
**/
Storage = {
	test: function(){
		return window.localStorage;
	},
	getItem:function(key){
		return localStorage.getItem(key)
	},
	setItem: function(key, value){
		return localStorage.setItem(key, value);
	},
	removeItem: function(key){
		return localStorage.removeItem(key);
	},
	clear: function(){
		return localStorage.clear();
	},
	length: function(){
		return localStorage.length;
	}
};


/**

图片惰性加载显示
img {
	filter: alpha(opacity=0);
	opacity: 0;
	transition: opacity 0.4s ease-in-out;
}

**/
jQuery.fn.lazyLoadImg = function(src2){
	var $ = jQuery,
		elements = this,
		$window = $(window);

	if($window.___lazyImage___){
		$window.off('scroll', $window.___lazyImage___);
		$window.___lazyImage___ = null;
	}
	
	$window.___lazyImage___  = function(){			
		var height = $window.height() + $window.scrollTop() + 10, 
			count = 0;

		$.each( elements, function(i, item){
			var img = $(item), 
				itop = img.offset().top;
			if( img.attr(src2) ){
				count ++;
				if( height >= itop && img[0].offsetHeight>0){
					img[0].onload = function(){ img.css('opacity', 1)}
					img.attr('src', img.attr(src2));
					img.removeAttr(src2);
				}
			}				
		});

		if(count<1){
			$window.off('scroll resize', $window.___lazyImage___);
		}
	};
	
	$window.on('scroll resize', $window.___lazyImage___);
	$window.___lazyImage___();	
};


// 页面快捷键设置
var __KEY = {
	k:[],
	t:0,
	events:{},
	addEvent: function(_event, fun){
		if(this.events[_event]){
			Prompt.alert(_event+' 已经被占用');
		}else{
			this.events[_event] = fun;
		}
	},
	addEvents: function(obj){
		for(var p in obj){
			this.addEvent(p, obj[p]);
		}
	},
	test:function(k){
		clearTimeout(this.t);
		this.k.push(k);
		var _k = this.k.join('');
		if( this.events[_k] ){
			this.empty();
			this.events[_k]();
		}else{
			this.t = setTimeout( jQuery.proxy(this.empty, this), 300 );
		}
	},
	empty: function(){
		this.k=[];
	}
};
jQuery(document).bind('keydown', function(event){
	if(event.altKey && event.which>=48 && event.which<=57) __KEY.test(event.which);
});





//临时用
//var UID = Date.now();
var UID = (new Date()).getTime();
jQuery.extend(String, {
	uniqueID: function(){
		return (UID++).toString(36);
	}
});


/*window focus blur*/
//Element.NativeEvents.focusin=2;
//Element.NativeEvents.focusout=2;
var _puser = pageMessage.user,
	_toDomain = pageMessage.toDomain,
	_domain  = pageMessage.domain;

function myAlert(str){
	document.title=str;
}

// 临时提示
function calert(str, act){
	var _calert_box = jQuery('#calert_box');
	if(_calert_box.length<1){
		_calert_box = jQuery('<div>', {
			'class':'calert calert-fade',
			id:'calert_box',
			html:'<div class="CB"><div class="CON"></div></div>'
		}).appendTo(document.body);
	}
	
	var CL = act?'removeClass':'addClass';
	_calert_box[CL]('calert-error').find('.CON').html(str);
	setTimeout( function(){
		_calert_box.removeClass('calert-fade');
		},1);
		//ie6
	var _istransition = !(jQuery.browser.msie && jQuery.browser.version<10);
	if(!_istransition){ //不支持transition
		jQuery('#calert_box').stop().animate({			
			width:document.documentElement.clientWidth,
			opacity:1
		}, 320);		
	}
	if(window.alert_time){
		clearTimeout(window.alert_time);
	}
	window.alert_time = setTimeout(function(){
		jQuery('#calert_box').addClass('calert-fade');
		if(!_istransition){
			jQuery('#calert_box').stop().animate({			
				width:1,
				opacity:0
			}, 300);
		}
	}, 2500);	
}

if(!window.console){
  window.console={
		log: function(){}
	};
}


function $6(id){
	return document.getElementById(id) || null;
}

jQuery.extend(Number, {'random': function(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
}});

function no_coin6(){
	try{
		Prompt.close(0)
	}catch(e){

	}
	Prompt.create({			
			content: '您的六币余额不足，是否现在充值？',
			btn_sure: {text:'马上充值', link:'/user/payshow.php?i=2', target:'_blank'},
			btn_cancel: {text:'稍后充值'},
			tracing: 'coin6floor'
		});
}
var v6;

(function(){
	var $ = jQuery;
	v6= {
	ie6:($.browser.msie && $.browser.version == '6.0'),
	addWinFocus:function(fn){
		if(v6.ie6){
			$(document).bind('focusin', fn);
		}else{
			$(window).bind('focus', fn);
		}
	},

	addWinBlur: function(fn){
		if(v6.ie6){
			$(document).bind('focusout', fn);
		}else{
			$(window).bind('blur', fn);
		}
	},

	createFace: function(obj){ //创建公用表情
		var faceBox = this.faceBox;
		if(faceBox) return faceBox;
		this.faceBox = {};
		this.faceBox.box = $('<div/>', {
			'id':'pubFaceBox',
			'class':'pubFaceBox',
			style:'display:block; visibility:hidden' //考虑放到css
		}).appendTo(document.body);

		$.extend(this.faceBox, { // 表情容器
			vis:0,
			btn:null,
			fname:obj.fname||'fname', //唯一标识
			isInit:0,// 表情初始化标记
			insertFace: function(txt){ //播放表情
				if(this.input.val()==this.alt) this.input.val('');
				insertFace(this.input[0], txt);
				this.input.focus();
			},
			gifInit: function(){ // 生成表情列表
				this.isInit=1;

				var tab = document.createElement('table'),
					n=0,
					m=0,
					p,
					tr = tab.insertRow(n++);

				this.box.append(tab);
				var cells=9;
				var faceAr=[];


				for(p in FaceSymbols){
					faceAr.push([p,FaceSymbols[p]]);
				}

				var faceArLen=faceAr.length,
					i=0;

				for(;i<faceArLen;i++){

					if(i%cells==0&&i!=0){
						 tr=tab.insertRow(n++);
					}
					var td = tr.insertCell(i%cells)
					var ar=faceAr[i];
					var title = ar[1].slice(1);
					td.innerHTML = '<a title="'+title+'"><img alt="'+title+'" src="'+FaceUrl+ar[0]+'.gif" /></a>';
				}



				// 补全TD
				var len = faceArLen%cells ? cells-faceArLen%cells : 0,
					tr=tab.rows[tab.rows.length-1];
				for(var i=0; i<len; i++){
					var td = tr.insertCell(tr.cells.length);
					td.innerHTML='&nbsp';
					td.style.cursor='default';
				}

				tab=tr=faceAr=null;
				var _facebox = this;
				this.box.on('click', 'a', function(e){ //点击事件
					e.preventDefault();
					var _a = $(this);
					_facebox.insertFace('/'+_a.attr('title'));
					_facebox.iHidden();
				});
			},

			visible: function(btn, input, alt){
				if(this.btn!==null) return this.iHidden();
				if(!this.isInit) this.gifInit();
				this.btn=$(btn);
				this.input=$(input);
				this.alt=alt;
				var _pos1 = this.btn.offset(), 
					_btnPos = {width:this.btn.width(), height:this.btn.height(), left:_pos1.left, top:_pos1.top}, //btn.getCoordinates(),
					_pos2 = this.box.offset(),
					_thisPos = {width:this.box.innerWidth(), height:this.box.innerHeight(), left:_pos2.left, top:_pos2.top}, //this.getCoordinates(),
					_wPos = {width:$(window).width(), height:$(window).width(), left:0},//window.getCoordinates(),
					_px,
					_py;
				_thisPos.height=250; //写死了
				if(
					(_btnPos.left + _thisPos.width) < (_wPos.left + _wPos.width)
					||(_btnPos.left+_btnPos.width) < _thisPos.width
				){
					_px = _btnPos.left;
				}else{
					_px = _btnPos.left + _btnPos.width - _thisPos.width;
				}
				if(
					_btnPos.top - $(window).scrollTop() < _thisPos.height
					/**(_btnPos.height + _thisPos.height) < _wPos.height - (_btnPos.top-$(window).scrollTop())
					|| _btnPos.top < _thisPos.height**/
				){
					_py = _btnPos.top + _btnPos.height;
				}else{
					_py = _btnPos.top - _thisPos.height;
				}
				this.box.css({
					'top':_py,
					'left':_px,
					'visibility':'visible'
				});
				this.vis = 1;
				document[this.fname] = $.proxy(this.dev,this);
				$(document.body).bind('click', document[this.fname]);
			},

			iHidden : function(){
				this.box.css('visibility','hidden');
				this.vis = 0;
				$(document.body).unbind('click', document[this.fname]);
				document[this.fname] = null;
				this.btn=null;
				this.input=null;
				this.alt='';
				return false;
			},

			dev: function(event){
				var tar = event.target;
				while(tar.tagName.toLowerCase()!='body'){
					if(tar == this.box[0] || tar==this.btn[0]) return;
					tar = tar.parentNode;
				}
				this.iHidden();
			}
		}); // Object.append End
		//faceBox.gifInit();
		return this.faceBox;
	},

	setCursorPos:function(ctrl, pos){
		if(ctrl.setSelectionRange)
    	{
    		ctrl.focus();
    		ctrl.setSelectionRange(pos,pos);
    	}else if (ctrl.createTextRange) {
    		var range = ctrl.createTextRange();
    		range.collapse(true);
    		range.moveEnd('character', pos);
    		range.moveStart('character', pos);
    		range.select();
    	}
	},

	// 我的靓号，借出，赠送在用
	pop:{
		create:function(obj){
			if(!this.box){
				this.box = $('<div/>', {
					'id':'popBox',
					'class':'popbox',
					'html':'<div class="wrap">\
					<div class="hd"><h2>'+obj.title+'</h2><span class="close" onclick="v6.pop.remove()"></span></div>\
					<div class="bd">\
					'+obj.con+'\
					</div></div>'
				}).appendTo(document.body).css('top',(document.documentElement.scrollTop||document.body.scrollTop)+100);
				if(v6.ie6) {
					$LAB.script(JSF.png).wait(function(){
						DD_belatedPNG.fix('#popBox span.close');
					});
				}
				getMask()
			}else{
				this.box.find('h2').eq(0).html(obj.title);
				this.box.find('div.bd').html(obj.con);
			}
			return $('#popBox');
		},
		remove: function(){
			$('#popBox').remove();
			$('#loginMask').remove();
			$('#loginMaskBg').remove();
			delete this.box;
		}
	},

	jsonp: function(obj){ // obj = {api:'', pars:{}, callback:fn}
		var _rq, _api,
			_pars = obj.pars||{},
			_callback = obj.callback||function(){};
		/*
		if(location.hostname=='6.cn'){ // https://6.cn/api/liveJsp.php
			_api = 'https://6.cn/api/liveJsp.php';
			var _ars=[];
			_ars.push('https://v.6.cn'+obj.api+'?');
			for(var p in _pars){
				_ars.push(p+'='+encodeURIComponent(_pars[p]))
			}
			_pars = 'url='+ encodeURIComponent(_ars.join('&'));
		}else{
			_api = obj.api;
		}
		*/
		_rq = $.getJSON( obj.api, _pars, _callback);
	}
}
})();


/* 主播 财富等级
创世神王 768,000,000
创世神皇 1,024,000,000
创世神帝 1,280,000,000
创世天尊 1,536,000,000
*/
var Rank={
	wealth:{
		1:1000,
		2:5000,
		3:15000,
		4:30000,
		5:50000,
		6:100000,
		7:200000,
		8:400000,
		9:650000,
		10:1000000,
		11:1500000,
		12:2000000,
		13:2500000,
		14:3500000,
		15:5000000,
		16:8000000,
		17:12000000,
		18:17000000,
		19:23000000,
		20:30000000,
		21:38000000,
		22:47000000,
		23:57000000,
		24:68000000,
		25:128000000,
		26:256000000,
		27:512000000,
		28:768000000,
		29:1024000000,
		30:1280000000,
		31:1536000000
	},
	live:{
		1:1000,
		2:5000,
		3:15000,
		4:30000,
		5:50000,
		6:100000,
		7:200000,
		8:350000,
		9:550000,
		10:800000,
		11:1200000,
		12:1500000,
		13:2000000,
		14:3000000,
		15:5000000,
		16:8000000,
		17:12000000,
		18:18000000,
		19:25000000,
		20:33000000,
		21:41000000,
		22:50000000,
		23:60000000,
		24:70000000,
		25:80000000,
		26:90000000,
		27:100000000,
		28:110000000,
		29:125000000,
		30:150000000,
		31:175000000,
		32:200000000,
		33:230000000,
		34:260000000,
		35:290000000,
		36:330000000,
		37:370000000,
		38:420000000,
		39:470000000,
		40:500000000,
		41:530000000,
		42:560000000,
		43:590000000,
		44:620000000,
		45:650000000,
		46:680000000,
		47:710000000,
		48:740000000,
		49:770000000,
		50:800000000,
		51:830000000,
		52:860000000,
		53:890000000,
		54:920000000,
		55:950000000,
		56:980000000,
		57:1010000000,
		58:1040000000,
		59:1070000000,
		60:1100000000,
		61:1130000000,
		62:1160000000,
		63:1190000000,
		64:1220000000,
		65:1250000000,
		66:1280000000,
		67:1310000000,
		68:1340000000,
		69:1370000000,
		70:1400000000,
		71:1430000000,
		72:1460000000,
		73:1490000000,
		74:1520000000,
		75:1550000000,
		76:1580000000,
		77:1610000000,
		78:1640000000,
		79:1670000000,
		80:1700000000,
		81:1730000000,
		82:1760000000,
		83:1790000000,
		84:1820000000,
		85:1850000000,
		86:1880000000,
		87:1910000000,
		88:1940000000,
		89:1970000000,
		90:2000000000,
		91:2030000000,
		92:2060000000,
		93:2090000000,
		94:2120000000,
		95:2150000000,
		96:2180000000,
		97:2210000000,
		98:2240000000,
		99:2270000000,
		100:2300000000,
		101:2330000000,
		102:2360000000,
		103:2390000000,
		104:2420000000,
		105:2450000000,
		106:2480000000,
		107:2510000000,
		108:2540000000,
		109:2570000000
	}
}


var WB;

(function(){
var $ = jQuery;
WB= { // 微博用

	 //房间主播转贴
	 re:{
		sendApi: '/message/message_add.php',
		popBox:0,
		isInit:0,
		hid_t:0, //隐藏记时
		setCursorPos:v6.setCursorPos,
		createFace:v6.createFace,
		createPop: function(){
			this.popBox = jQuery('<div/>', {
				'class': 'popbox cmtRelay',
				'id': 'wbReplay',
				'html': '\
					<div class="hd"><h2>转发到我的动态</h2><span class="close close_big"></span></div>\
					<div class="bd">\
					<form class="retweet-form fix">\
					<div class="text"><textarea></textarea></div>\
					<div class="tools">\
					<a class="faceList" href="javascript:;"><i></i></a>\
					<p class="uploadButton" ><i></i><em><input type="file" name="file" title="上传图片"></em></p>\
					<span class="actBtn"><button type="submit">转 发</button></span>\
					</div>\
					<div class="previewImage" style="display:none;">\
					<img />\
					<span class="previewImageClose"></span>\
					</div>\
					</form>\
					</div>\
					</div>'
			}).appendTo(document.body);
		},

		init: function(){
			if(this.isInit) return;
			this.isInit=1;
			var _re = this;
			this.createPop();
			var _box = this.popBox;
			var closeBtn = _box.find('.close');
			var faceBtn = _box.find('a.faceList');
			var form = _box.find('form');
			this.sendInput = _box.find('textarea');
			this.sendBtn = _box.find('button[type=submit]');

			//关闭
			closeBtn.bind('click', $.proxy(this.hid, this));

			//表情
			var faceBox = this.createFace({fname:'wb'});
				faceBtn.bind('click', function(){
					faceBox.visible(this, _re.sendInput[0], '');
					return false;
				});

			form.bind('submit', function(event) {
				event.preventDefault();
				_re.send();
			})
			this.uploadImageReady(_box);
		 },

		hid: function(){
			if(this.hid_t) clearTimeout(this.hid_t);
			this.deSend();
			this.popBox.css('display','none');
			$('#loginMask').remove();
			$('#loginMaskBg').remove();
			return false;
		 },

		vis: function(btn){
			getMask();
			var pos = $(btn).offset();
			this.popBox.css({
				top:pos.top - 100,
				display:'block'
			});
		 },

		filterMsg: function(msg){
			var msg= msg.replace(/<img[^>]+?\/(\d+)\.gif[^>]+?>/gim, function(a,b){return FaceSymbols[b]});
			return msg.replace(/<img.+?>|<a.+?>|<\/a>/ig, '').unescapeHTML();
		},

		setCon: function(btn,msg){
			var msg = this.filterMsg(msg);
			this.init();
			this.sendInput.val('//'+msg);
			this.vis(btn);
			this.setCursorPos(this.sendInput, 0);
		 },
		 setSend: function(){
			this.sendInput.prop('disabled',true);
			this.sendBtn.addClass('disabled');
			this.sendBtn.addClass('actBtn-skin-gray');
		 },
		 deSend: function(){
			this.sendInput.prop('disabled',false);
			this.sendBtn.removeClass('disabled');
			this.sendBtn.removeClass('actBtn-skin-gray')
		 },
		 send: function(){
			if(this.sendBtn.hasClass('disabled') ){
				return false;
			}
			var msg = $.trim(this.sendInput.val());
			if(msg==''){
				alert('转发内容为空!');
				return;
			}
			this.setSend();
			this.reSend = $.getJSON( this.sendApi, {uid:_puser.uid, msg:msg, src: this.image}, this.sendBack);
		 },
		sendBack: function(obj){
			var _re = WB.re;
			if(obj.flag=='001'){
				_re.hid_t=setTimeout($.proxy(_re.hid, _re), 100);
			}else{
				Prompt.alert(obj.content);
			}

			_re.cancelImage();
		}

	 },

	// 转发贴子
	rem:{
		sendApi: '/message/message_forward.php',
		popBox:0,
		isInit:0,
		ie6:($.browser.msie && $.browser.version =='6.0'),
		hid_t:0, //隐藏记时
		inpMax:140, //最多140个字符
		setCursorPos:v6.setCursorPos,
		createFace:v6.createFace,
		createPop: function(){
			this.popBox = $('<div/>', {
				'class': 'popbox cmtRelay',
				'id': 'wbReplay',
				'html': '\
					<div class="hd"><h2>转发到我的动态</h2><span class="close close_big"></span></div>\
					<div class="bd">\
					<div class="quote"></div>\
					<form class="retweet-form fix">\
					<div class="text"><textarea></textarea></div>\
					<div class="tools">\
					<a class="faceList" href="javascript:;"><i></i></a>\
					<p class="uploadButton" ><i></i><em><input type="file" name="file" title="上传图片"></em></p>\
					<span class="actBtn"><button type="submit">转 发</button></span>\
					</div>\
					<div class="form-to">\
					<span class="option"><label><input type="checkbox" class="opt" name="islast" value="1"  />同时评论给 <span class="author"></span></label></span>\
					<span class="option toOriginal"><label><input type="checkbox" class="opt" name="isroot" value="1" />同时评论给原作者 <span class="originalAuthor"></span></label></span>\
					</div>\
					<div class="previewImage" style="display:none;">\
					<img />\
					<span class="previewImageClose"></span>\
					</div>\
					</form>\
					</div>\
					</div>'
			}).appendTo(document.body).css({
				'display':'none',
				'position':'fixed'
			});
			if(this.ie6){
				this.popBox.css('position','absolute');
			}
		 },

		init: function(){
			if(this.isInit) return;
			this.isInit=1;
			this.createPop();
			var _rem = this;
			var _box = this.popBox;
			var form = _box.find('form');
			var closeBtn = _box.find('.close');
			var faceBtn = _box.find('a.faceList, button.emotion');
			this.srcBox=_box.find('.quote');
			this.sendInput = _box.find('textarea');
			this.sendBtn = _box.find('.sendButton');

			
			//同时评论给...
			var cmtUbox = _box.find('.checkbox');
			var toChs = cmtUbox.find('input');

			this.To = {
				cUser: _box.find('.author'),
				isCuser: toChs.eq(0),
				rUser: _box.find('.originalAuthor'),
				isRuser: toChs.eq(1)
			}

			toChs.prop('checked',true);
			
			//关闭
			closeBtn.bind('click', $.proxy(this.hid, this));

			//表情
			var faceBox = this.createFace({fname:'wb'});
				faceBtn.bind('click', function(){
					faceBox.visible(this, _rem.sendInput[0], '');
				});

			form.bind('submit', function(event) {
				_rem.send(event)
			});

			this.uploadImageReady(_box);

		 },

		hid: function(){
			if(this.hid_t) clearTimeout(this.hid_t);
			this.deSend();
			this.popBox.css('display','none');
			// 同时评论给默认
			var to=this.To;
			to.cUser.html('');
			to.rUser.html('');
			to.isCuser.prop('checked',true);
			to.isRuser.prop('checked',true);

			$('#loginMask').remove();
			$('#loginMaskBg').remove();
			return false;
		 },

		vis: function(btn){
			getMask();
			var _top = this.ie6? $(window).scrollTop()+100:100;

			this.popBox.css({
				top: _top,
				display:'block'
			});
			
			this.cancelImage();
		 },

		filterMsg: function(msg){ // 保留笑脸
			var msg= msg.replace(/<img[^>]+?\/(\d+)\.gif[^>]+?>/gim, function(a,b){return FaceSymbols[b]});
			return msg.replace(/<img.+?>|<a.+?>|<\/a>/ig, '').unescapeHTML();
		},

		filterMsg2: function(msg){ //去除HTML 原贴用
			var arr = msg.match(/(<a.+?<\/a>)(.+)/i);
			return arr[1]+''+arr[2].replace(/<a.+?<img.+?<\/a>/ig, '');
		},

		getUserName: function(msg){ // 得到用户名
			var arr = msg.match(/<a.+?>(.+?)<\/a>/i);
			return arr[1];
		},

		setCon: function(args){ //{bnt:btn, msg:msg, sendId:id}
			this.init();
			this.sendId = args.sendId;
			var msg = this.filterMsg2(args.msg);
			this.srcBox.html('@' + msg);
			this.sendInput.val( args.reMsg?'//'+this.filterMsg(args.reMsg):'');
			if(args.reMsg){ // 有原贴
				this.To.rUser.html( this.getUserName(args.msg) );
				this.To.isRuser.parent().css('display','block');
				this.To.cUser.html( this.getUserName(args.reMsg) );
			}else{ // 无原贴
				this.To.cUser.html(this.getUserName(args.msg));
				this.To.isRuser.parent().css('display','none');
			}
			this.vis(args.btn);
			this.setCursorPos(this.sendInput, 0);
		 },
		setSend: function(){
			this.sendInput.prop('disabled',true);
			this.sendBtn.find('button').prop('disabled',true);
			this.sendBtn.addClass('actBtn-skin-gray')
		 },
		deSend: function(){
			this.sendInput.prop('disabled',false);;
			this.sendBtn.find('button').prop('disabled',false);;
			this.sendBtn.removeClass('actBtn-skin-gray')
		 },
		send: function(event){
			event.preventDefault();

			var msg = this.sendInput.val(), islast = this.To.isCuser.prop('checked')?1:0, isroot=this.To.isRuser.prop('checked')?1:0;

			if(msg==''){ // 无内容下
				msg='转发';
			}
			//if(!this.testMax()) return alert('提交失败，文字过多！');
			this.setSend();
			
			this.reSend = $.getJSON( this.sendApi, {uid:_puser.uid, msg:msg, mid:this.sendId, islast:islast, isroot:isroot, src:this.image}, this.sendBack);
		 },
		sendBack: function(obj){

			if(obj.flag=='001'){
				var _rem = WB.rem;
				if(typeof (myTrack) == 'undefined') {
					Prompt.alert('转发成功!');
					_rem.hid();
					return;
				}
				//直接新增列表内容
				myTrack.toScrollTop(); //滚动到可见位置
				var con ={flag:obj.flag, content:{content:[obj.content], newid:0, p:1, pageCount:0}};
				setTimeout(function(){
					myTrack.newMsgBack(con)
				}, 500); // 插入
				_rem.hid_t=setTimeout($.proxy(_rem.hid,_rem),100);
			}else{
				Prompt.alert(obj.content);
			}
		}
	 },

	/**
		*	博客消息解析
		*	obj 消息
		*	m	发消息名字统称 '我'
	**/
	parseWeiBoMsg: function(obj){
		var e=obj.content,
		u = '<div class="fuser"><a class="name" usercard="'+obj.uid+'" target="_blank" href="'+_toDomain+'/profile/index.php?rid='+obj.rid+'" >'+obj.alias+'</a></div>',
		msg='';
		switch(obj.type+''){
			case '1':
				msg=ParseFaceSymobls(e.msg);
				if(e.pic&&e.pic.url){
					msg+='<br /><a target="_blank" href="'+_toDomain+e.pic.link+'" class="aPic bigCursor"><img cm="showBigPic" src="'+WB.transFileUrl(e.pic.url,'_s')+'" /></a>';
				}
				if(e.mp3&&e.mp3.aid){
					msg+='<br /><a target="_blank" href="'+_toDomain+e.mp3.link+'"><img src="//vr0.6rooms.com/imges/live2013/idx_mp3_btn.png" class="audioIcon" cm="playAudio|'+e.mp3.aid+'" /></a>';
				}
				break;
			case '18':
				var pic = e.pic && e.pic.url;
				var msg = ParseFaceSymobls(pic ? (e.msg || '') : (e.msg || '转发'))
				if (pic) {
					msg += '<br /><a class="aPic" href="' + WB.transFileUrl(pic, '') + '" target="_blank"><img src="' + WB.transFileUrl(pic, '_s') + '" /></a>'
				}
				break;

			case '19':
				var pic = e.pic && e.pic.url;
				msg = '#'+e.talias+'#的精彩表演正在进行，不要错过哦！<a target="_blank" href="'+_toDomain+'/room/rewrite.php?u='+e.tuid+'">点击这里进入</a><br/><a class="aPic" target="_blank" href="'+_toDomain+'/room/rewrite.php?u='+e.tuid+'"><img src="' + WB.transFileUrl(pic, '_s') + '" /></a>';
				break;
			case '20':
				msg=e.title + '<br/><a class="mini-video" target="_blank" href="#"><img src="'+e.url+'" cm="miniVideo|'+e.vid+'"><sup></sup></a>';
				break;
			case '2':
				msg='上传了1张照片<br/><a target="_blank" href="'+_toDomain+e.link+'" class="aPic bigCursor"><img cm="showBigPic|" src="'+WB.transFileUrl(e.url, '_s')+'" /></a>';
				break;
			case '3':
				msg='上传了1首歌曲<span class="fMp3"> </span><a class="aMp3" target="_blank" href="'+_toDomain+e.link+'"><i></i>'+e.audname+'</a>'+
				'<br /><a target="_blank" href="'+_toDomain+e.link+'"><img src="//vr0.6rooms.com/imges/live2013/idx_mp3_btn.png" class="audioIcon" cm="playAudio|'+(e.link.match(/aid\=(\d+)/)[1])+'|'+(e.link.match(/uid\=(\d+)/)[1])+'" /></a>';
				break;
			case '4':
				msg='上传了1个视频<br/><a class="aFlv" target="_blank" href="'+_toDomain+e.link+'"><img src="'+e.url+'"><sup></sup></a>';
				break;
			case '5':
				msg='发起了直播';
				break;
			case '6':
				msg='送给<a target="_blank" href="'+_toDomain+'/profile/index.php?rid='+e.trid+'">'+e.talias+'</a>'+e.num+'个'+Pres[e.gift].title;
				break;
			case '7':
				//msg='收到<a target="_blank" href="/profile/index.php?uid='+e.fuid+'">'+e.falias+'</a>赠送的'+e.num+'个'+Pres[e.gift].title;
				msg='收到 '+e.num+'个'+Pres[e.gift].title+'<i class="'+Pres[e.gift].cls+' giftSmall" /></i>';
				break
			case '8':
				msg='从好友中删除了<a target="_blank" href="'+_toDomain+'/profile/index.php?rid='+e.trid+'">'+e.talias+'</a>';
				break;
			case '9':
				msg='财富等级升级到<i class="rich'+e.num+' userLevelSmall"></i>';
				break;
			case '10':
				msg='明星等级升级到<i class="star'+e.num+' userLevelSmall"></i>';
				break;
			case '11':
				msg='获得了本周明星排行 第'+e.num+'名';
				break;
			case '12':
				msg='获得了本月明星排行 第'+e.num+'名';
				break;
			case '13':
				msg='加入了家族 <a href="'+_toDomain+'/f/p/'+e.fuid+'.html" target="_blank">'+e.fname+'</a>';
				break;
			case '14':
				msg='退出了家族 <a href="'+_toDomain+'/f/p/'+e.fuid+'.html" target="_blank">'+e.fname+'</a>';
				break;
			case '15':
				msg='关注了 <a usercard="'+e.tuid+'" href="'+_toDomain+'/profile/index.php?rid='+e.trid+'" target="_blank">'+e.talias+'</a>';
				break;
			case '16':
				msg='加 <a usercard="'+e.tuid+'" href="'+_toDomain+'/profile/index.php?rid='+e.trid+'" target="_blank">'+e.talias+'</a> 为好友';
				break;
			case '17':
				msg= e.game+'，赢得'+e.num+'个'+Pres[e.gift].title+'<i class="'+Pres[e.gift].cls+' giftSmall"></i>';
				break;
			case '100':
				msg=ParseFaceSymobls(e.msg);
				break;
			case '101':
				if (e.fuid) {
					msg=ParseFaceSymobls(e.msg)+'<br /><a class="aPic" href="'+_toDomain+'/f/p/' + e.fuid + '.html'+'#!topic/'+obj.id+'" target="fansq'+e.fuid+'"><img src="'+WB.transFileUrl(e.url,'_s')+'" /></a>';

				} else {
					msg=ParseFaceSymobls(e.msg)+'<br /><a class="aPic" href="'+_toDomain+'/profile/fansq.php?fansqrid='+e.fansqrid+'#!topic/'+obj.id+'" target="fansq'+e.fansqrid+'"><img src="'+WB.transFileUrl(e.url,'_s')+'" /></a>';
				}
				break;
			default:
				msg='---';
				break;
		}

		//msg='上传了1首歌曲<a class="aMp3" target="_blank" href="">中华人民共和国中华人民共和国</a>';
		//return (obj.type==18?u+'：':u+' ')+msg;
		return u+'<p class="fbody">'+msg+'</p>';
	},
	// 客户端来源
	parseClientSource: function(clientTypeId) {
		if (!clientTypeId) {
			return '';
		}
		var url = '';
		var text = '';

		switch(clientTypeId) {
			case '0': 
				url = '/event/liveClient/?t=pad';
				text = 'iPad'
				break;

			case '1':
				url = '/event/liveClient/?t=phone';
				text = 'iPhone'
				break;
			case '2':
				url = '/event/liveClient/?t=pad';
				text = 'Android'
				break;
			case '3':
				url = '/event/liveClient/?t=phone';
				text = 'Android'
				break;
		} 
		
		return '<a class="from-mobile-client" href="' + url + '" target="_blank"><i></i>来自' + text + '</a>';
	},
	transFileUrl:function(src,subfix){
		if(!src){
			return '';
		}
		return src.replace(/^(\S+?)(?:_(?:s|b|ls))?(\.[^\.]+)$/,'$1'+(subfix||'')+'$2');
	},
	justifyBox:function(width,height,maxWidth,maxHeight){
		var w,h;
		maxWidth=maxWidth||380;
		maxHeight=maxHeight||1000;

		if(maxWidth/maxHeight>width/height && height>maxHeight){
				h=maxHeight;
				w=h*width/height
		}
		else if(maxWidth/maxHeight<width/height && width>maxWidth){
			w=maxWidth;
			h=height*w/width;
		}
		else{
			w=width;
			h=height;
		}
		return {
			width:w,
			height:h
		}
	},

	uploadImage: {

		uploadImageReady: function(container) {
			container = $(container);
			
			this.uploadButton = container.find('.uploadButton');
			this.previewImage = container.find('.previewImage');
			this.previewImageClose = container.find('.previewImageClose');
			this._fileInputChangeHandler = $.proxy(this._fileInputChangeHandler,this);
			this.cancelImage = $.proxy(this.cancelImage,this);
			this.UPLOAD_IMAGE_CALLBACK = String.uniqueID();
			this.uploadButton.find('input').bind('click', function(e) { e.preventDefault()});

			this._resetFileInput();
			this.previewImageClose.bind('click', this.cancelImage);
			window[this.UPLOAD_IMAGE_CALLBACK] = $.proxy(this._uploadBack,this);
		},

		cancelImage: function() {
			this.image = '';
			this._previewImageState();
		},

		_resetFileInput: function() {
			var uploadButton = this.uploadButton;

			if (uploadButton) {
				var input = $('<input/>', {
					'type': 'file',
					'name': 'file',
					'title': '上传图片'
				})
				var oldInput = uploadButton.find('input');

				oldInput[0] ? oldInput.replaceWith(input) :
					uploadButton.find('em').append(input);
				input.bind('change', this._fileInputChangeHandler)
			}
		},

		_fileInputChangeHandler: function(event) {
			var input = event.target;
			var value = input.value;
			var fileExtension = /\.(\w+)$/.exec(value);

			if (!fileExtension || 'jpg jpeg gif png'.indexOf(fileExtension[1].toLowerCase()) < 0) {
				alert('图片格式只支持jpg,jpeg,png,gif');
				return;
			}
			this._uploadImage();
		},

		_uploadImage: function() {
			var uploadButton = this.uploadButton;
			var div = $('<div/>', {
				'id': 'uploadImageTemporaryForm',
				'html': '<form action="' + location.protocol + '//pic.v.6.cn/api/uploadForGeneral.php" enctype="multipart/form-data" \
						method="post" target="emptyIframe">\
						<input type="hidden" name="callbackFun" value="window.top.' + this.UPLOAD_IMAGE_CALLBACK + '" />\
						<input type="hidden" name="for" value="1" />\
						<input type="hidden" name="callbackUrl" value="' + location.protocol + '//' + window.location.hostname + '/profile/transferStation.html" />\
						<input type="hidden" name="pid" value="1001" />\
						<input type="hidden" name="size" value="s2,b1" />\
						</form>'
			});
			var form = div.find('form');
			form.append(uploadButton.find('input'));
			div.css('display', 'none');
			div.appendTo(document.body);
			form.submit();
			this._previewImageState('loading');
		},

		_uploadBack: function(data) {
			if (data.flag == '001') {
				this.previewImage.find('img').attr('src', WB.transFileUrl(data.content.url.link));
				this.image = data.content.url.link;
				this._previewImageState('complete');

			} else {
				this._previewImageState();
				Prompt.alert(data.content);
			}
			$('#uploadImageTemporaryForm')[0] && $('#uploadImageTemporaryForm').remove();
		},

		_previewImageState: function(state) {
			var previewImage = this.previewImage;
			var uploadButton = this.uploadButton;

			if (state == 'loading') {
				previewImage.css('display', 'block');
				previewImage.addClass('previewImage-loading');
				uploadButton.css('visibility', 'hidden');

			} else if (state == 'complete') {
				previewImage.css('display', 'block');
				previewImage.removeClass('previewImage-loading');

			} else {
				previewImage.css('display', 'none');
				previewImage.find('img').removeAttr('src');
				uploadButton.css('visibility', 'visible');
				this._resetFileInput();
			}
		}
	}
}

$.extend(WB.rem, WB.uploadImage);
$.extend(WB.re, WB.uploadImage);
})();

var MiniVideo;
(function(){
	var H5_CSS = '//g.alicdn.com/de/prismplayer/2.6.0/skins/default/aliplayer-min.css';
	var H5_URL = '//g.alicdn.com/de/prismplayer/2.6.0/aliplayer-h5-min.js';
	var FLASH_URL = '//g.alicdn.com/de/prismplayer/2.6.0/aliplayer-flash-min.js';

	MiniVideo = function(conf){
		this._fid = String.uniqueID();
		this._player = null;
		this._conf = conf || {};
		this._callback = [];
	};

	jQuery.extend(MiniVideo.prototype, {
		getConf: function(){
			return this._conf;
		},
		createBox: function(){
			var fid = this._fid;
			var box = jQuery('<div/>', {
				'class': 'mini-video-expand'
			});

			box.html('<div class="arrow-icon"><i class="ico">◆</i><i class="ico ico2">◆</i></div>\
				<p class="feed-media-action-wrap">\
					<a class="feed-media-action  mini-video-collapse" href="#collapseMiniVideo" cm="in" class=""><i></i>收起</a>\
				</p>\
				<div class="feed-meida-miniVideo">\
					<div id="'+fid+'">视频加载中..</div>\
				</div>');
			return box;
		},
		loadPlayer: function(){
			var self = this;
			var conf = this.getConf();
			var fid = this._fid;
			var videobox = jQuery('#' + fid);
			var type = this.getPlayerType();

			if(type == 'no-support'){
				videobox.html('您当前的浏览器不支持播放该视频，请升级您的浏览器！（支持IE8以上版本及其它主流浏览器）');
			}else{
				jQuery.getJSON('/minivideo/auth.php', {act: 'play', vid: conf.vid, _t:+new Date}).done(function(json){
					if(json.flag == '001'){
						videobox.empty();
						// if(type == 'h5' && !jQuery('#mini_video_css')[0]){
						// 	self._loadH5Css();
						// };
						//flash 版本ie8需要加载json.min.js
						if(type == 'flash'){
							$LAB.script('//g.alicdn.com/de/prismplayer/2.6.0/json/json.min.js').wait();
						};
						//加载阿里云播放器
						$LAB.script(FLASH_URL).wait(function(){
							try{
								var player = new Aliplayer({
									id: fid,
									width: conf.width || '100%',
									height: conf.height || '300px',
									autoplay: conf.autoplay,
									cover: conf.cover,
									source: json.content.mp4url,
									showBarTime:1000, //控制栏自动隐藏时间（ms）
									skinRes: '//vr0.6rooms.com/imges/live/events/mini_video/skin',//播放器皮肤
									//按钮位置配置
									skinLayout:[
									    {name:"bigPlayButton", align:"cc"},
									    {name:"loading", align:"cc"},
									    {
									      name:"controlBar", align:"blabs", x:0, y:0,
									      children: [
									        {name:"progress", align:"tlabs", x: 0, y:0},
									        {name:"playButton", align:"tl", x:15, y:26},
									        {name:"nextButton", align:"tl", x:10, y:26},
									        {name:"timeDisplay", align:"tl", x:10, y:24},
									        {name:"fullScreenButton", align:"tr", x:10, y:25},
									        {name:"streamButton", align:"tr", x:10, y:23},
									        {name:"volume", align:"tr", x:10, y:25}
									      ]
									    },
									    {
									      name:"fullControlBar", align:"tlabs", x:0, y:0,
									      children: [
									        {name:"fullTitle", align:"tl", x:25, y:6},
									        {name:"fullNormalScreenButton", align:"tr", x:24, y:13},
									        {name:"fullTimeDisplay", align:"tr", x:10, y:12},
									        {name:"fullZoom", align:"cc"}
									      ]
									    }
									]
								});
								//监听状态
								player.on('ready', jQuery.proxy(self, '_playerReady', player));
								player.on('error', jQuery.proxy(self, '_errorHandler'));

								//触发事件
								var callback = self._callback;
					            if (callback.length > 0) {
					                for(var i=0;i<callback.length;i++){
					                    player.on(callback[i][0], callback[i][1]);
					                };
					            };
								
							}catch(e){
								console.log('loadMiniVideoPlayer', e);
							}
						});
					}else{
						videobox.html(json.content);
					};
				});
			};
		},
		destroyPlayer: function(){
			try{
				//console.log(this._player);
				if(this._player){
					this._player.pause();
					this._player.dispose();
					this._player = null;
				};
			}catch(e){
				console.log('destroyMiniVideoPlayer', e);
			};
		},
		on: function(event, callback){
			if(this._player){
	            this._player.on(event, callback);
	        }else{
	            this._callback.push([event, callback]);
	        };
		},
		getPlayer: function(){
			return this._player;
		},
		getPlayerType: function(){
			var lowIE = jQuery.browser.msie && jQuery.browser.version < 10;
			var noSupport = jQuery.browser.msie && jQuery.browser.version < 8;
			return noSupport ? 'no-support' : (lowIE ? 'flash' : 'h5');
		},
		_playerReady: function( player){
			this._player = player;
		},
		_errorHandler: function(e){
			console.log(e);
		},
		_loadH5Css: function(){
			var csslink = jQuery('<link type="text/css" rel="stylesheet" />').attr({
				id: 'mini_video_css',
				href: H5_CSS
			});

			jQuery('head')[0].appendChild(csslink[0]);
		}
	});
})();

// ------  time(aptime) ------
function GetPix(_c, _t){ // 返回一个空图片并设置样式
	var _title= _t?'title="'+_t+'"':'';
	return '<i '+_title+' class="'+_c+'"></i>'
}

var aptime = {
	
	hms: function(s){
		var date = new Date(s*1000) ;
		var h = date.getHours(),
			m = date.getMinutes(),
			s = date.getSeconds();
		h = h < 10 ? '0' + h : h ;
		m = m < 10 ? '0' + m : m ;
		s = s < 10 ? '0' + s : s ;
		return  h + '时' + m +'分' + s + '秒' ;
	},
	
	//--- s => hh : mm : ss
	 sToHours : function (s) {
		var hh , mm , ss
		ss = s % 60 ;
		s = Math.floor(s / 60) ;
		ss = ss >= 10 ? ss : '0' + ss ;

		mm = s % 60 ;
		s = Math.floor(s / 60) ;
		mm = mm >= 10 ? mm : '0' + mm ;

		hh = s % 60 ;
		s = Math.floor(s / 60) ;
		hh = hh >= 10 ? hh : '0' + hh ;

		if(hh > 24)
			return '23:59:59' ;
		else if(hh < 1)
			return mm + ':' + ss ;
		else
			return hh + ':' + mm + ':' + ss ;

	} ,

	// s => hh : mm
	stoHoursEx : function(s){
		var date = new Date( (s*1000).toString().slice(0,13)/1 ) ;
		var h = date.getHours() ;
		h = h < 10 ? '0' + h : h ;
		var f = date.getMinutes() ;
		f = f < 10 ? '0' + f : f ;
		return  h + ':' + f ;
	} ,


	// 1993_04_04 10:22
	sToDate : function(s) {
		var date = new Date(s*1000) ;
		var y = date.getFullYear() ;
		var m = date.getMonth() + 1 ;
		m = m < 10 ? '0' + m : m ;
		var d = date.getDate() ;
		d = d < 10 ? '0' + d : d ;
		var h = date.getHours() ;
		h = h < 10 ? '0' + h : h ;
		var f = date.getMinutes() ;
		f = f < 10 ? '0' + f : f ;
		return  y + '-' + m + '-' + d + ' ' + h + ':' + f ;
	} ,

	// 04-12 12:21
	sToDate2 : function(s) {
		var date = new Date(s*1000) ;
		var y = date.getFullYear() ;
		var m = date.getMonth() + 1 ;
		m = m < 10 ? '0' + m : m ;
		var d = date.getDate() ;
		d = d < 10 ? '0' + d : d ;
		var h = date.getHours() ;
		h = h < 10 ? '0' + h : h ;
		var f = date.getMinutes() ;
		f = f < 10 ? '0' + f : f ;
		return  m + '-' + d + ' ' + h + ':' + f ;
	},

	sToDate3: function(s) {
		var timestamp = s * 1000;
		var dateObj = new Date(timestamp);
		var now = new Date();
		var hence = now.getTime() - timestamp;

		var fillZero = function(num) {
			if (num < 10) {
				return '0' + num;
			}
			return num + '';
		};

		var format = function(template) {
			var year = dateObj.getFullYear();
			var month = fillZero(dateObj.getMonth() + 1);
			var date = fillZero(dateObj.getDate());
			var hour = fillZero(dateObj.getHours());
			var minute = fillZero(dateObj.getMinutes());

			return template.replace(/y|m|d|h|i/g,function(s){
				switch(s){
					case 'y':
						return year;
					case 'm':
						return month;
					case 'd':
						return date;
					case 'h':
						return hour;
					case 'i':
						return minute;
				}
			});
		};

		if (hence <= 60 * 1000) {
			return Math.max(Math.ceil(hence / 1000), 1) + '秒前'

		} else if (hence < 60 * 60 * 1000) {
			return Math.ceil(hence / 60 / 1000) + '分钟前';

		} else if (hence <= 24 * 60 * 60 * 1000 && now.getDate() == dateObj.getDate()) {
			return '今天 ' + format('h:i')

		} else if (now.getFullYear() == dateObj.getFullYear()) {
			return format('m-d h:i');

		} else {
			return format('y-m-d h:i');
		}
	},

	// 12:12:12 hh:mm:ss
	sToStr : function(s) {
		var hh , mm , ss
		ss = s % 60 ;
		s = Math.floor(s/60) ;

		mm = s % 60 ;
		s = Math.floor(s/60) ;

		hh = s % 60 ;
		s = Math.floor(s/60) ;

		return (hh > 0 ? hh + '小时' : '') + (mm > 0 ? mm + '分' : '') + (ss > 0 ? ss + '秒' : '') ;

	} ,

	// 时间戳
	toTime : function(y,m,d,h,f,s) {
		return new Date(y,m-1,d,h||0,f||0,s||0).getTime()/1000 ;
	} ,

	// tdesc
	tdesc : function(time , nowTime) {
		if(isNaN(time))
			return time ;
		var uts = (nowTime || new Date().getTime()/1000) - time ;
		if (uts < 1)
			return "1秒前";
		else if (uts < 60)
			return Math.ceil(uts) + "秒前";
		else if (uts < 3600) {
			var m = Math.ceil(uts/60) ;
			return m + "分钟前";
		}
		else if (uts < 86400) {
			var h = Math.ceil(uts/3600) ;
			return h + "小时前" ;
		}
		else {
			var d = Math.ceil(uts/86400) ;
			return d + "天前" ;
		}
	},

	parseTime: function(tm,c){ // 时间戳
		var _d = new Date();
		_d.setTime(tm*1000);
		var _ny = _d.getFullYear(), _nm=_d.getMonth()+1, _nm = _nm>9?_nm:'0'+_nm, _nd=_d.getDate(), _nd=_nd>9?_nd:'0'+_nd;
		c=c?c:'-';
		return _ny+c+_nm+c+_nd;
	}
}

// -- en htmlSpecialchars
function enhtmlchars(str) {
	str = str.replace('&amp;','&')
			.replace(/</g , '&lt;').replace(/>/g , '&gt;')
			.replace(/"/g , '&quot;').replace(/'/g , '&#039;')
			.replace(/ /g , '&nbsp;');
	return str ;
}


// convert \r\n, \r or \n to br
function nl2br(str) {
	return str.replace(/(\r\n)|[\r\n]/g , '<br />') ;
}


//var curHost=location.href.replace(/6\.cn.*$/,'')+'6.cn'; // 当前域

//var isIE8 = window.ActiveXObject && document.documentMode; ///MSIE\s*8.0/i.test(navigator.appVersion);
//var isChrome = /chrome/i.test(navigator.userAgent);

String.prototype.len = function(){
	var str = this, len = 0;
	for(var i=0; i<str.length; i++)
		str.charCodeAt(i)>255 ? len += 2 : len++;
	return len;
}


String.prototype.st = function(len, dot){
	if(this.length<1 || this.length<=len) return this.toString();
	var str = this, nStr = [], tmp = 0;
	for(var i=0; i<str.length; i++){
		str.charCodeAt(i)>255 ? tmp += 2 : tmp++;
		if(tmp>len*2) break;
		nStr.push(str.charAt(i));
	}
	var str2 = nStr.join('');
	if(str2==str){
		return str;
	}else{
		return dot?str2.slice(0, str2.length-1)+'…':str2;
	}
}

//转义HTML
String.prototype.stripTags=function() {
	return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
}
String.prototype.unescapeHTML=function() {
	return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&nbsp;/ig,' ');
}
String.prototype.escapeHTML=function() {
	return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

String.prototype.f3 = function(){
	return this.length<1 ? 0 :this.split('').reverse().join('').replace(/(\d{3})(?=\d)/g,'$1,').split('').reverse().join('');
}

function numF(n){
	n = String(n);
	if(n.length<4) return n;
	var a = n.split('').reverse().join('');
	a = a.replace(/(\d{3})/g, '$1,');
	a = a.split('').reverse().join('');
	return a.replace(/^,/,'');
}

/**
function myEncode(str){//只转义单字节
	var tem=[];
	for(var i=0; i<str.length; i++){
		var s = str.charAt(i);
		tem.push(s.charCodeAt(0)>255?s:encodeURIComponent(s));
	}
	return tem.join();
}
**/

/**
function getOptions(e){
	var p=e, x=0, y=0;
	while(p!=null){
		x += p.offsetLeft;
		y += p.offsetTop;
		p = p.offsetParent;
	}

	return {x:x, y:y};
}
**/

/**
function getSWF(movieName){
	if (navigator.appName.indexOf("Microsoft") != -1){
		return window[movieName];
	}else{
		return document[movieName];
	}
}
**/

/*global*/

/*global_2*/

//插入表情
function insertFace(txtBox, inTxt){
	if (!document.selection)
	{
		var b = txtBox.selectionStart;
		var e = txtBox.selectionEnd;
		var txt = txtBox.value;
		txt = txt.substr(0, b) + inTxt + txt.substr(e, txt.length);
		txtBox.value = txt;
		txtBox.selectionStart = txtBox.selectionEnd = b + inTxt.length;
        txtBox.focus();
		return;
	}
	txtBox.focus();
	var range = document.selection.createRange();
	var txtRange = txtBox.createTextRange();
	var txt = txtBox.value;
	var pos;
	var len = range.text.length;

	var cursor = "&^asdjfls2FFFF325%$^&"; //唯一
	range.text = cursor;

	pos = txtBox.value.indexOf(cursor);
	range.moveStart("character", -cursor.length);
	range.text = "";
	txtBox.value = txt.substr(0, pos) + inTxt + txt.substr(pos + len, txt.length);
	txtRange.collapse(true);
	txtRange.moveStart("character", pos + inTxt.length);
	txtRange.select();
}


// 表情们
var FaceUrl='//vr0.6rooms.com/imges/live/face_v17/';
var FaceSymbols={
		'0':'/狂笑',
		'1':'/大笑',
		'2':'/惊讶',
		'3':'/害羞',
		'4':'/窃笑',
		'5':'/发怒',
		'6':'/大哭',
		'7':'/色色',
		'8':'/坏笑',
		'9':'/火大',
		'10':'/汗',
		'11':'/奸笑',
		'12':'/欢迎',
		'13':'/再见',
		'14':'/白眼',
		'15':'/挖鼻',
		'16':'/顶',
		'17':'/胜利',
		'18':'/欧耶',
		'19':'/抱拳',
		'20':'/囧',
		'21':'/淡定',
		'22':'/美女',
		'23':'/靓仔',
		'24':'/神马',
		'25':'/开心',
		'26':'/给力',
		'27':'/飞吻',
		'28':'/眨眼',
		'29':'/V5',
		'30':'/来吧',
		'31':'/围观',
		'32':'/飘过',
		'33':'/地雷',
		'34':'/菜刀',
		'35':'/帅',
		'36':'/审视',
		'37':'/无语',
		'38':'/无奈',
		'39':'/亲亲',
		'40':'/勾引',
		'41':'/后后',
		'42':'/吐血',
		//'43':'/啊哦',
		'44':'/媚眼',
		'45':'/愁人',
		'46':'/肿么了',
		'47':'/调戏',
		'48':'/抽',
		'49':'/哼哼',
		'50':'/bs',
		//'51':'/委屈',
		'52':'/鸡冻',
		'53':'/眼馋',
		'54':'/热汗',
		'55':'/输',
		'56':'/石化',
		'57':'/蔑视',
		'58':'/哭',
		'59':'/骂',
		'60':'/狂哭',
		'61':'/狂汗',
        '62': '/笑哭',
        '63': '/狗狗',
        '64': '/喵喵'


};
var FaceSafe = {
	's11':'/被扁',
	's12':'/变脸',
	's13':'/吃饭',
	's14':'/吹裙子',
	's15':'/打劫',
	's16':'/憨笑',
	's17':'/泪流满面',
	's18':'/傻笑',
	's19':'/惊吓',
	's20':'/惊恐',
	's21':'/好囧',
	's22':'/蹲墙角',
	's23':'/可爱',
	's24':'/委屈落泪',
	's25':'/抠鼻',
	's26':'/亲一个',
	's27':'/色迷迷',
	's28':'/闪闪发光',
	's29':'/虐',
	's31':'/幸福',
	's32':'/装帅',
	's33':'/拍砖',
	's30':'/左吐',
	's34':'/右吐',
	's35':'/左闪',
	's36':'/右躲',

	's1':'/白富美',
	's2':'/心动的感觉',
	's3':'/兄弟们上',
	's4':'/求交往',
	's5':'/嫁给我吧',
	's6':'/在一起',
	's7':'/看好老婆',
	's8':'/好基友',
	's9':'/屌爆了',
	's10':'/走你'
};
var FaceVip = {
	'vip1':'/真好听',
	'vip2':'/嗨起来',
	'vip3':'/霸气',
	'vip4':'/红包刷起来',
	'vip5':'/太漂亮了',
	'vip6':'/马上投票',
	'vip7':'/玫瑰在哪里',
	'vip8':'/土豪来啦',
	'vip9':'/爱死你了',
	'vip10':'/啵一个',
	'vip11':'/新货求关注',
	'vip12':'/要抱抱',
	'vip13':'/冒个泡',
	'vip14':'/有黑幕',
	'vip15':'/爱你1314',
	'vip16':'/好甜呀',
	'vip17':'/坑爹',
	'vip18':'/女汉子',
	'vip19':'/鼓掌',
	'vip20':'/加油',
	'vip21':'/天然呆',
	'vip22':'/赞'
};

var FaceBirth = {
	birth1: '/生日快乐1',
	birth2: '/生日快乐2',
	birth3: '/生日快乐3',
	birth4: '/生日快乐4',
	birth5: '/生日快乐5',
	birth6: '/生日快乐6',
	birth7: '/生日快乐7',
	birth8: '/生日快乐8'
};


function ParseFaceSymobls(msg, act){ // 解析str
	var act=act||'2',
		_faces = {
			'1':FaceSafe,
			'2':FaceSymbols,
			'3':FaceVip,
			'4':FaceBirth
		}[act];
	for(var p in _faces){
		msg = msg.replace(new RegExp(_faces[p],'g'),'<img align="absmiddle" src="'+this.FaceUrl+p+'.gif"/>');
	}
	return msg;
}
/*global_2*/


//presSug
function wsug(e, str){
	var oThis = arguments.callee;
	if(!oThis.sug){
		oThis.sug = jQuery('<div>').addClass('presSug').appendTo(document.body);
	}

	if(!str) {
		oThis.sug.css({
			visibility:'hidden',
			top:-999
		});		
		jQuery(document).unbind('mousemove');
		return;
	}

	var sug = oThis.sug;
	sug.html(str);

	var w = sug.width(), h = sug.outerHeight(), dw = document.documentElement.clientWidth||document.body.clientWidth; dh = document.documentElement.clientHeight || document.body.clientHeight;
	var st = document.documentElement.scrollTop || document.body.scrollTop, sl = document.documentElement.scrollLeft || document.body.scrollLeft;
	var left = e.clientX +sl +17 + w < dw + sl && e.clientX + sl + 15 || e.clientX +sl-8 - w, top = e.clientY + st +17 + h < dh + st && e.clientY + st + 17 || e.clientY + st - 5 - h;
	sug.css({
		left: left,
		top: top,
		visibility: 'visible'
	});
	jQuery(document).bind('mousemove',function(e){
		var e = e || window.event, st = document.documentElement.scrollTop || document.body.scrollTop, sl = document.documentElement.scrollLeft || document.body.scrollLeft;
		var left = e.clientX +sl +17 + w < dw + sl && e.clientX + sl + 15 || e.clientX +sl-8 - w, top = e.clientY + st +17 + h < dh + st && e.clientY + st + 17 || e.clientY + st - 5 - h;
		sug.css({
			left: left,
			top: top
		});
	});
	
	
}
/**
function openErr(msg, url){
	var div = document.createElement('div'), url=url? url: 'https://6.cn/login.php';
	div.id='tmpDiv';
	div.style.position='absolute';
	div.style.left='-10000px';
	div.innerHTML='<form name="tmpf" method="post" target="about:blank" action="/error.php">\
				<input type="hidden" name="msg" value="'+msg+'" />\
				<input type="hidden" name="url" value="'+url+'" />';
	document.body.appendChild(div);
	document.tmpf.submit();

	setTimeout(function(){document.body.removeChild(document.getElementById('tmpDiv'))}, 1000);
}
**/
function createIframeBg (pars){
	var ifr = document.createElement('iframe');
		ifr.id = pars.id?pars.id:'';
		ifr.frameborder=0;
		ifr.style.position='absolute';
		ifr.style.zIndex = pars.zIndex?pars.zIndex:9
		ifr.style.display = 'none';
		ifr.style.width = pars.width;
		ifr.style.height = pars.height;
		ifr.style.opacity=0;
		ifr.style.display='none';
		ifr.style.filter='alpha(opacity=0)';
		ifr.style.left = pars.left?pars.left:0;
		ifr.style.top = pars.top?pars.top:0;
		return ifr;
}

function getMask(){
	var div = document.createElement('div');
		div.id='loginMask';
		div.style.background='black';
		div.style.filter='alpha(opacity=50)';
		div.style.opacity=0.5;
		div.style.position='absolute';
		div.style.zIndex=555;
		div.style.left=0;
		div.style.top=0;
		var sh = document.documentElement.scrollHeight, sw = document.documentElement.scrollWidth;
		var nh = screen.height, nw = screen.width;

		var hh = (sh>nh?sh:nh)+'px';
		div.style.height=hh;
		div.style.width='100%';
		var ifr = createIframeBg({id:'loginMaskBg', width:'100%', height:hh, zIndex:550});
		document.body.appendChild(ifr);
		document.body.appendChild(div);
}

function getPageList ($params){ // 翻页连接 $pargms: { page: curPage, total_page: totalPages, nextPageStr:nextPageStr, block_page:10}
	var $nextPageStr = $params.nextPageStr, $pageImg = '<img src="//vr0.6rooms.com/imges/space.png" />';
	if($params.prevImg){
		var $prevImg=$params.prevImg, $nextImg=$params.nextImg;
	}else{
		var $prevImg=$nextImg=$pageImg;
	}
	if(!arguments.showLink){
		arguments.showLink = function($n, $text, $showlink){
			return '<a href="#" onclick="'+$nextPageStr+'('+$n+');return false"'+(!$showlink ? 'class="on"' : '')+'>'+$text+'</a>';
		}
	}

	var $page = Number($params.page), $total_page = $params.total_page;
	$block_page = $params.block_page||10; // 最多显示几个连接页

	if ($page=='' || !$total_page)
	{
		return '';
	}



	var  $ret = '';
	if ($total_page <= 1) return '';

	// 尾页
	//$ret_end = $page<$total_page ? arguments.showLink( $baseurl+$pageExtra+$total_page+$suffix, '尾页' ) : '';

	// 上一页
	var $ret_pre = $page > 1 ? '<a href="#" onclick="'+$nextPageStr+'('+($page-1)+'); return false" class="pre">'+$prevImg+'</a>': '' ;

	// 下一页
	var $ret_next = $page < $total_page ? '<a href="#" onclick="'+$nextPageStr+'('+($page+1)+'); return false" class="next">'+$nextImg+'</a>' : '';

	// 当前显示段
	var $start = $page - Math.floor( ($block_page-1)/2 );
	var $end = $page + Math.floor( ($block_page+1)/2 );

	if( $start < 1 )
	{
		$start = 1 ;
		$end = ( $block_page <= $total_page ) ? $block_page : $total_page ;
	}
	else if ($end > $total_page)
	{
		$end = $total_page ;
		$start = ( $total_page - $block_page >= 0 ) ? $total_page - $block_page + 1 : 1 ;
	}

	// 当前段
	var $ret_middle = '' ;
	for(var $i=$start ; $i<=$end ; $i++ )
	{
		$ret_middle += arguments.showLink( $i, $i, ( $i==$page ) ? false : true ) ;
	}

	var $lastTip = '' ;
	if($end < $total_page) $lastTip = '<b>...</b>' ;

	// 显示
	var $ret = $ret_pre+$ret_middle+$lastTip+$ret_next;
	return $ret;
};

//设置昵称弹层
var modnickname;
(function(){
var $ = jQuery;
modnickname= {
	sendApi:'/user/aliasname.php',
	initialize: function(){
		var _index_class = $('#userPanel_index')[0]?' nickname-index':'';
		this.box = $('<div/>',{
			'class':'nickname'+_index_class,
			'html':'载入中...',
			mouseover: $.proxy(this.yvisible, this),
			mouseout: $.proxy(this.yhidden,this)
		}).appendTo(document.body);
		this.boxInit();
	},
	//<p class="editeNick">当前签名：<strong>'+(_puser.mood || '暂无')+'</strong></p><p class="editeInput">修改签名：<input type="text" id="moodName" /><span class="editeBtn"><button type="button" id="moodNameBtn">确定</button></span></p>
	//<p class="eidteInfo"><strong>注：</strong>修改后，原昵称有可能被抢注</p>
	boxInit: function(){
		this.box.html('<div class="arrow"><i class="i1">◆</i><i class="i2">◆</i></div><div class="box"><p class="editeUser">用户名：'+_puser.username+'</p><p class="editeNick">我的昵称：<strong>'+_puser.nickname+'</strong></p><p class="editeInput">修改昵称：<input type="text" id="nNickname" alt="3至10个字符" /><span class="editeBtn"><button type="button" id="nNicknameBtn">确定</button></span></p><p class="editeNick">我的签名：<strong>'+(_puser.mood || '暂无')+'</strong></p><p class="editeInput">修改签名：<input type="text" id="moodName"  alt="最多10个字符"/><span class="editeBtn"><button type="button" id="moodNameBtn">确定</button></span></p><p class="eidteInfo"><strong>*</strong>拥有VIP可在房间公聊区显示签名</p></div>');
		this.nNickname = $('#nNickname');
		this.nNicknameBtn = $('#nNicknameBtn');
		this.nNicknameBtn.bind('click', $.proxy(this.send,this));
		//this.sidebg = this.box.find('div.sidebg');
		this.moodName = $('#moodName');
		this.moodNameBtn = $('#moodNameBtn');
		this.moodNameBtn.on('click', $.proxy(this, 'sendMood'));
		$.each(this.box.find('input'), function(){
			var ipt = $(this);
			var placeholder = ipt.attr('alt');
			ipt.val(placeholder);
			ipt.on('focus blur', function(e){
				if(e.type=='focus'){
					ipt.addClass('focus');
					if(ipt.val() == placeholder) ipt.val('');
				}else{
					if(ipt.val()==''){
						ipt.removeClass('focus');
						ipt.val(placeholder);
					};
				}
			})
		});
	},

	t_v:0,
	yvisible: function(btn){
		if(!this.box) {
			this.initialize();
		}
		clearTimeout(this.t_v);
		if(this.vis) return;
		this.t_v = setTimeout($.proxy(this.visible,this,btn), 200);
	},
	yhidden: function(){
		clearTimeout(this.t_v);
		if(this.vis){
			this.t_v = setTimeout($.proxy(this.iHidden,this), 50);
		}
	},
	btn:0,
	visible: function(btn){
		var _btn = $(btn), 
			_ww=_btn.offset().left+3;

		_btn.addClass('change-name-on');
		this.btn = _btn;
		
		var _pos = _btn.offset();
		this.box.css({
			'left': _pos.left + _btn.width() - 254,
			'top': Math.max(24, _pos.top + _btn.height() - 10)
		}).addClass('nickname-open');
		this.vis = 1;
	},
	iHidden: function(){
		this.box.removeClass('nickname-open');
		this.vis = 0;
		this.btn.removeClass('change-name-on');
	},

	callback: function(obj){
		var noop = function(){};
		var jump = function(){
			window.location.href= window.location.href.replace(/#.*$/,'');
		};

		Prompt.alert(obj.content, (obj.flag=='001') ? jump : noop);
	},

	send: function(){
		var name = $.trim( this.nNickname.val() );
		var alt = this.nNickname.attr('alt');
		if(name=='' || name == alt){
			Prompt.alert('请输入昵称！');
			return;
		}
		this.nNickname.val('');
		this.yhidden();
		$.getJSON( this.sendApi, {'act':'p', 'alias': name}, this.callback);
	},
	sendMood: function(){
		var mood = $.trim( this.moodName.val());
		var alt = this.moodName.attr('alt');
		if(!_puser.mood){//无签名，设置签名
			if(!mood || mood == alt){
				Prompt.alert('请输入签名！');
				return;
			}
			this.moodName.val('');
			this.yhidden();
		};
		//有签名，可以置空
		$.getJSON( '/user/setUserMood.php', {'mood': (mood == alt ? '' : mood)}, this.callback);
	}
};
})();

//六币六豆弹层
var getCoinPop;
(function(){
var $ = jQuery;
getCoinPop = {
	initialize: function(){
		var _index_class = $('#userPanel_index')[0]?' getcoin-pop-index':'';
		this.box = $('<div/>',{
			'class':'getcoin-pop'+_index_class,
			'html':'<div class="arrow"><i class="i1">◆</i><i class="i2">◆</i></div>\
					<div class="box">\
					<p id="coin"><i></i>六币:<em class="num">'+numF(_puser._6b)+'</em><a class="btn" href="/user/payshow.php?i=1" target="_blank" data-tracing="ipvafi3p">充值</a></p>\
					<p id="coin6"><i></i>六豆:<em class="num">'+numF(_puser._6d)+'</em><a class="btn" href="/user/exchange.php" target="_blank" data-tracing="ipvafi3q">兑换</a></p>\
					</div>',
			mouseover: this.yvisible,
			mouseout: this.yhidden
		}).appendTo(document.body);		
	},
	t_v:0,
	yvisible: function(btn){
		var _getcoin = getCoinPop;
		if(!_getcoin.box) {
			_getcoin.initialize();
			$(btn).on('mouseout', _getcoin.yhidden);
		}
		clearTimeout(_getcoin.t_v);
		if(_getcoin.vis) return;
		_getcoin.t_v = setTimeout(function(){
			_getcoin.visible(btn)
		}, 200);
	},
	yhidden: function(){
		var _getcoin = getCoinPop;
		clearTimeout(_getcoin.t_v);
		if(_getcoin.vis){
			_getcoin.t_v = setTimeout(_getcoin.iHidden, 50);
		}
	},
	btn:0,
	visible: function(btn){
		var _getcoin = getCoinPop,
			_btn = $(btn); 
		_getcoin.btn=_btn;

		//刷新六豆六币
		_getcoin.box.find('#coin .num').html(numF(_puser._6b));
		_getcoin.box.find('#coin6 .num').html(numF(_puser._6d));

		_getcoin.btn.addClass('my-coin-on');
		var _pos = _btn.offset();
		_getcoin.box.css({
			'left': _pos.left + _btn.width() - 90,
			'top': Math.max(24, _pos.top + _btn.height() - 10)
		}).addClass('getcoin-pop-open');

		_getcoin.vis = 1;
	},
	iHidden: function(){
		var _getcoin = getCoinPop;
		_getcoin.box.removeClass('getcoin-pop-open');
		_getcoin.vis = 0;
		_getcoin.btn.removeClass('my-coin-on');
	}
}
})();

//设置在线状态弹层
var setCloaking;
(function(){
var  $ = jQuery;
setCloaking = {
	sendApi:'/user/prop/listPriv.php',
	initialize: function(){
		this.cloaking = $('#cloaking a:eq(0)');
		var _index_class = $('#userPanel_index')[0]?' cloaking-box-index':'';
		this.box = $('<div/>',{
			'class':'cloaking-box'+_index_class,
			'html':'<div class="arrow"><i class="i1">◆</i><i class="i2">◆</i></div><div class="box setCloaking"><div id="setCloaking"><a class="setOnline" data-tracing="ipvafi3s"><span></span>显身</a><a class="setOffline" data-tracing="ipvafi3t"><span></span>隐身</a></div></div>',
			mouseover: this.yvisible,
			mouseout: this.yhidden
		}).appendTo(document.body);
		$('#setCloaking').find('a.setOffline, a.setOnline').bind('click', this.send);
		//this.sidebg = this.box.find('div.sidebg');
	},

	t_v:0,
	yvisible: function(btn){
		var _cloak = setCloaking;
		if(!_cloak.box) {
			_cloak.initialize();
			$(btn).bind('mouseout', _cloak.yhidden);
		}
		clearTimeout(_cloak.t_v);
		if(_cloak.vis) return;
		_cloak.t_v = setTimeout(function(){
			_cloak.visible(btn)
		}, 200);
	},
	yhidden: function(){
		var _cloak = setCloaking;
		clearTimeout(_cloak.t_v);
		if(_cloak.vis){
			_cloak.t_v = setTimeout(_cloak.iHidden, 50);
		}
	},
	btn:0,
	visible: function(btn){
		var _cloak = setCloaking,
			_btn = $(btn); 
		_cloak.btn=_btn;

		_cloak.btn.parents('li').addClass('cloaking-on');
		//_cloak.sidebg.find('span').attr('class', $('#cloaking a').attr('class') );
		var _pos = _btn.offset();
		_cloak.box.css({
			'left': _pos.left + _btn.innerWidth() - 61,
			'top': Math.max(24, _pos.top + _btn.innerHeight() - 10)
		}).addClass('cloaking-box-open');
		_cloak.vis = 1;
	},
	
	iHidden: function(){
		var _cloak = setCloaking;
		_cloak.box.removeClass('cloaking-box-open');
		_cloak.vis = 0;
		_cloak.btn.parents('li').removeClass('cloaking-on');
	},
	callback: function(obj){
		if(obj.flag=='001'){
			_puser.cloaking = setCloaking.cloaking.hasClass('offline')?0:1, btnStr = _puser.cloaking?'隐身':'显身', btnClass = _puser.cloaking?'offline':'online';
			setCloaking.cloaking.html('<span>当前'+btnStr+'</span>');
			setCloaking.cloaking.attr('class', btnClass);
			setCloaking.cloaking.attr('title', '当前'+btnStr);
		}else{
			Prompt.create({
				'delay': 5000,
				'content': obj.content
			});
		}
	},

	send: function(_e){
		_e.preventDefault();
		var _cloak = setCloaking;
		_cloak.yhidden();
		var _act = $(this).hasClass('setOffline')?1:0;
		var _online = setCloaking.cloaking.hasClass('offline');
		if( ( _online&& _act) || (!_online && !_act) ) return; //当前状态不用设置
		var args = {act:'p', priv:7, status:_act}
		$.getJSON( setCloaking.sendApi, args, setCloaking.callback);
	}
};
})();


/**
function toMyFamily(obj){
	if(!obj.init){
		$(obj);
		var div = document.createElement('div');
		div.className='userFamilyBox';
		div.innerHTML = '<ul><li><a href="/f/'+pageMessage.userFamilyId+'" target="_blank">家族房间</a></li><li><a href="/family/home/index.php?f='+pageMessage.userFamilyId+'" target="_blank">家族后院</a></li></ul>';
		document.body.appendChild(div);
		obj.box = visBlock(null, div, 'userFamilyBox');
		obj.init = 1;
	}

	obj.box.vis?obj.box.iHidden() : obj.box.visible(obj,0,5);
}
**/

/**
 * passport.6.cn 使用的极验SDK
 *
 * passport 升级了极验 SDK，新版 SDK 验证流程和接口较之前有所不同，
 * 前端也需要相应调整。
 * 
 */
var GeetestPassport = function(wrap, gt) {
    gt = gt || {};
    this._wrap = wrap;
    this._challenge = gt.challenge || '';
    this._offline = !gt.success;
    this._geetest = null;
    this._callback = [];
    this._callbackname = 'geetest_' + String.uniqueID();
    this._sdkReady = jQuery.proxy(this, '_sdkReady');
    this._loadSdk();
    this.init();
};

GeetestPassport.prototype = {
    init: function() {
        if (typeof Geetest != 'undefined' && this._challenge) {
            var geetest = this._geetest = new Geetest({
                gt: '6afb5fbb4998793df3c0a75732dedbdc',
                challenge: this._challenge,
                product: 'float',
                offline: this._offline,
                sandbox: false
            });

            // if (this._callback.length > 0) {
            //     geetest[this._callback[i][0]] &&
            //         geetest[this._callback[i][0]](this._callback[i][1])
            // }
            var callback = this._callback;
            if (callback.length > 0) {
                for(var i=0;i<callback.length;i++){
                    geetest[callback[i][0]] && geetest[callback[i][0]](callback[i][1]);
                };
            };
            this._wrap.empty();
            geetest.appendTo(this._wrap[0]);
        }
    },

    destroy: function() {
        this._wrap.empty();
        this._geetest = this._callback = window[this._callbackname] =
            this._wrap = null;
    },

    getCode: function() {
        return this._geetest.getValidate();
    },

    on: function(event, callback) {
        //this._geetest[event] && this._geetest[event](callback);
        if(this._geetest){
            this._geetest[event] && this._geetest[event](callback);
        }else{
            this._callback.push([event, callback]);
        };
    },

    refresh: function() {
        this._geetest.refresh();
    },

    _loadSdk: function() {
        if (typeof Geetest == 'undefined') {
            var script = document.createElement('script');
            var src = 'https://api.geetest.com/get.php?callback=' +
                this._callbackname;
            window[this._callbackname] = this._sdkReady;
            script.src = src;
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    },

    _sdkReady: function() {
        if (this._challenge && !this._geetest) {
            this.init();
        }
    }
};

/**
 * 六间房产品中心使用的极验 SDK
 *
 * 产品中心使用老版的 SDK，此处封装，使其与新版基本一致。
 * 
 */
var GeetestV6CN = function(wrap) {
    this._wrap = wrap;
    this._callback = {};
    this._completeHandler = jQuery.proxy(this, '_completeHandler');
    this.init();
};

GeetestV6CN.prototype = {
    init: function() {
        var src = 'https://api.geetest.com/get.php?gt=' +
            '1b477861ca5ce50507d0ed393c602173';
        var script = document.createElement('script');

        window.gt_custom_ajax = this._completeHandler;
        script.src = src;
        this._wrap.html('')
        this._wrap[0].appendChild(script);
    },

    destroy: function() {
        this._wrap.empty();
        this._wrap = this._callback = window.gt_custom_ajax = null;
    },

    getCode: function() {
        var wrap = this._wrap;
        var geetest_challenge =
            wrap.find('input[name=geetest_challenge]').val();
        var geetest_validate = 
            wrap.find('input[name=geetest_validate]').val();
        var geetest_seccode = 
            wrap.find('input[name=geetest_seccode]').val();

        return {
            geetest_challenge: geetest_challenge,
            geetest_validate: geetest_validate,
            geetest_seccode: geetest_seccode
        };
    },

    on: function(event, callback) {
        this._callback[event] = callback;
    },

    refresh: function() {
        var refreshButton = this._wrap.find('.gt_refresh_button');

        refreshButton.each(function(index, elem) {
            elem && elem.click();
        });   
    },

    _completeHandler: function(result) {
        if (result == 1) {
            this._callback['onSuccess'] && this._callback['onSuccess']();
        } else {
            this._callback['onError'] && this._callback['onError']();
        }
    }
};

/**
	数美机器指纹识别

	获取deviceId，通过以下两步：
		SM_fingerprints.init();
    	var deviceId = SM_fingerprints.getDeviceId();
**/
var SM_fingerprints = {
    timeoutTimer: null,
	init:function(callback){
		if(typeof SMSdk == 'undefined'){
			window._smConf = {
				organization:'TKWQ4vmgC3PJLGDTMIoJ',//公司标识
				staticHost:'static.fengkongcloud.com',//CDN
				originHost:'static2.fengkongcloud.com'//源服务器
			};
		};
		
		this._loadSdk(callback);
	},
	getDeviceId: function(event) {
		var deviceid = window.SMSdk ? encodeURIComponent(window.SMSdk.getDeviceId()) : '';

		if(deviceid == ''){
			this._tongji();
		};
        return deviceid;
    },
    _hackIE:function(){
    	var ua = navigator.userAgent.toLowerCase();
    	var isHttps = 'https:' === document.location.protocol;
    	var isWinXP = /windows\s(?:nt\s5.1)|(?:xp)/.test(ua);
		var isLowIE = /msie\s[678]\.0/.test(ua);

		return isHttps && isWinXP && isLowIE;
    },
	_loadSdk:function(callback){
        var self = this;
		//xp下ie678跳过CDN直接指向源服务器
		var src = 'https://' + window._smConf[this._hackIE() ? 'originHost' : 'staticHost'] + '/fpv2.js'; 

        clearTimeout(self.timeoutTimer);
        $LAB.script(src).wait(function() {
            clearTimeout(self.timeoutTimer);
            if (typeof callback == 'function') {
                setTimeout(callback, 600);
            }
        });
        if (typeof callback == 'function') {
            self.timeoutTimer = setTimeout(callback, 4 * 1000);
        }
	},
	//统计deviceId失效的情况
	_tongji:function(){
		(new Image()).src='https://sclick.6rooms.com/w.html?&act=33&ua=&deviceid=';
	}
};

/**
 * [SMCaptcha 数美验证]
 * @param {string} wrapId   验证码容器id
 * @param {object} config 配置项
 * @param {string} config.product 验证模块的前端展现形式，
 *      float：浮动式（默认值），
 *      embed：嵌入式, 
 *      popup: 弹出式，需要额外设置宽度，不需要wrapId默认append到body，onReady后调用instance.verify()显示浮层
 * @DEMO http://dev.v.6.cn/smSverify.php
 */
var V6SMCaptcha = function(wrapId, config){
	this._id = wrapId;
    this._wrap = jQuery('#' + wrapId);
    this._config = config || {};
    this._smCaptcha = null;
    this._callback = [];
    this._sdkReady = jQuery.proxy(this, '_sdkReady');
    this._loadSdk();
};

V6SMCaptcha.prototype = {
	on: function(event, callback) {
        if(this._smCaptcha){
            this._smCaptcha[event] && this._smCaptcha[event](callback);
        }else{
            this._callback.push([event, callback]);
        };
    },
    getCode: function() {
        var ret = this._smCaptcha.getResult();
        //只返回验证成功的结果，兼容下geetest
	    return (ret.rid && ret.pass) ? ret : null;
    },
    getSdk: function(){
    	return this._smCaptcha;
    },
    refresh: function() {
        this._smCaptcha.reset();
    },
    destroy: function() {
        this._wrap.empty();
        this._smCaptcha = this._id = this._callback = this._wrap = null;
    },
    _loadSdk: function() {
    	var self = this;
    	var conf = jQuery.extend({
    		https: location.host.indexOf('dev') > -1 ? false : true,
			organization: 'TKWQ4vmgC3PJLGDTMIoJ', //组织机构代码
	    	appendTo: self._id, //验证码容器id
	        product: 'float' //验证码展现形式
		}, this._config);

        if (typeof initSMCaptcha == 'undefined') {
            $LAB.script('//castatic.fengkongcloud.com/pr/v1.0.1/smcp.min.js').wait(function(){
            	//console.log('reload-sm-sdk');
            	initSMCaptcha(conf, self._sdkReady);
            });
        } else {
        	setTimeout(function(){
        		initSMCaptcha(conf, self._sdkReady);
        	}, 0);
        };
    },
    _sdkReady: function(instance) {
    	//console && console.log(instance)
        if (!this._smCaptcha) {

        	this._smCaptcha = instance;

        	var callback = this._callback;
            if (callback.length > 0) {
                for(var i=0;i<callback.length;i++){
                    this._smCaptcha[callback[i][0]] && this._smCaptcha[callback[i][0]](callback[i][1]);
                };
            };
        };
    }
};


var loginFast;

(function(){
var $ = jQuery;


loginFast = {
    ie6:($.browser.msie && $.browser.version =='6.0'),
    domain:_domain,
	weixin_login : {
		callback: null,
		appid: null,
		state: null,
		init: function(){
			this._loadWeixin($('#loginwithWeixin'));
		},

	    _loadWeixin: function(wrap) {
	        $LAB.script(JSF.weixin).wait(function(){
		        $.ajax({
		        	type: 'post',
		        	dataType: 'json',
		        	url: '/coopapi/partner/accredit.php?taye=1073&json=1&next_action='+encodeURIComponent(loginFast._nextAction || location.href.replace(/#.*$/,'')) + '&tracing=' + pageMessage._tracing,
		        	success: function(data){
		        		this.callback = data.content.callback;
		        		this.appid = data.content.appid;
		        		this.state = data.content.state;

						var obj = new WxLogin({
						  id:"weixin_wrap", 
						  appid: this.appid, 
						  scope: "snsapi_login", 
						  redirect_uri: this.callback,
						  state: this.state,
						  style: "",
						  href: ""
						});
						$('#loginNav').css('display', 'none');
						$('#weixin_base').css('display', 'block');    		
		        	}
		        })
		    })
	    },
	    clear: function(){
			$('#loginNav').css('display', 'block');
	    	$('#weixin_base').css('display', 'none');
	    	$('#weixin_wrap').find('iframe').remove();
	    }    	
	},


    LR:{
        event_pic: '<img src="https://v.6.cn/loginBorderImage.php" alt=""/>', //登陆框右边图片
        event_link: '<a></a>', //登陆框右边链接
        footer:'</div>',
        header: function(){
			//var nextUrl = encodeURIComponent(location.href.indexOf('logins')>-1?'//v.6.cn':location.href);
			//<a href="/auth/wxLogin.php?bgurl='+nextUrl+'" class="mobile-btn">手机登录</a>\
						
            return '<div class="loginMask_box"></div><div class="loginMask">\
            <em class="close" onclick="loginFast.cancel()" title="关闭">关闭</em>\
					<div class="login-nav" id="loginNav">\
						<a href="javascript:;" class="login-btn">登录</a>\
						<a href="javascript:;" class="reg-btn">注册</a>\
						<i class="underline"></i>\
					</div>';
        },
        loginHtmlstr:function (){
                    var preset_username = loginFast.preset_username||'';
					var nextUrl = encodeURIComponent(location.href.indexOf('logins')>-1?'//v.6.cn':location.href);
                    return '<div class="overFrameContent fix"><div class="side"><p>\
                    <span>第三方账号登录</span><span class="partner"><a href="//v.6.cn/coopapi/partner/accredit.php?taye=1047&amp;next_action='+encodeURIComponent(loginFast._nextAction || window.location.href) + '&tracing=' + pageMessage._tracing + '" class="loginWith loginWith-qq" title="使用QQ登录"><i class="icon"></i><em class="bg"></em></a><a href="//v.6.cn/coopapi/partner/accredit.php?taye=1003&amp;next_action='+encodeURIComponent(loginFast._nextAction || window.location.href) + '&tracing=' + pageMessage._tracing +'" class="loginWith loginWith-sina" title="使用微博登录"><i class="icon"></i><em class="bg"></em></a><a href="/auth/wxLogin.php?bgurl='+nextUrl+'" onclick="loginFast.weixin_login.init(); return false" class="loginWith loginWith-weixin" id="loginwithWeixin"  title="使用微信账号登录" ><i class="icon"></i><em class="bg"></em></a></span></p>\
                    <div class="login_event_link" id="login_event_link">'+loginFast.LR.event_link+'</div></div>\
                    <div class="vlogin">\
                    <div id="weixin_base"><a href="#" class="weixin_close" onClick="loginFast.weixin_login.clear();return false;">返回</a><div style="margin:-18px 56px 0;" id="weixin_wrap"></div></div>\
                    <form method="post" class="LRFrame_quick" name="loginFrame_quick" id="loginFrame_quick" action="https://6.cn/login.php">\
                    <input type="hidden" value="login" name="action"><input type="hidden" value="live" name="from_act"><input type="hidden" value="'+loginFast.domain+'/uloginTwo.php" name="url">\
                    <dl>\
                    <dd class="ddusr fix">\
                    <label><em><i></i></em></label>\
                    <div class="input"><input type="text" name="username" class="focus" value="'+preset_username+'" id="member-login-un" placeholder="用户名/手机号"><span class="user-placeholder">用户名/手机号</span></div>\
                    </dd>\
                    <dd class="ddpsw fix">\
                    <label><em><i></i></em></label>\
                    <div class="input"><input type="password" name="passwd" class="focus"  id="member-login-pd" placeholder="密码"><span class="user-placeholder">密码</span></div>\
                    <div class="cap"><span class="arrow"><i class="i1">◆</i><i class="i2">◆</i></span>Caps Lock键处于启用状态，请注意区分大小写。</div>\
                    </dd>\
                    <dd class="fix" id="member-login-picsig-field" style="display:none;">\
                    <label><span>验证码</span><em><i></i></em></label>\
                    <div class="input" >\
                    <div id="geetest_login" class="fix" style="margin-bottom:5px;"></div>\
                    <div class="forget"><span id="geetest_login_reload" style="color:#999;padding:0;">看不到验证码？<a style="cursor:pointer;color:#fd3000">点击刷新</a></span></div>\
                    </div>\
                    </dd>\
                    <dd class="user-select">\
                    <div class="protocol fix">\
                    <a class="checked_focus" onclick="if(this.className==\'unchecked_focus\'){this.className=\'checked_focus\'; jQuery(\'#cookie_check\')[0].checked=true}else{this.className=\'unchecked_focus\'; jQuery(\'#cookie_check\')[0].checked=false}"><i></i>30天内自动登录</a>\
                    <input type="checkbox" checked="checked" id="cookie_check" style="display:none" class="nobstyle"  />\
                    </div>\
                    <div class="forget"><a class="forget" href="' + _toDomain + '/user/userinfo/losepass.php" target="_blank" tabindex="9999">忘记密码</a><span class="forget">|</span>\
                    <a class="forget" href="' + _toDomain + '/user/userinfo/losename.php" target="_blank" tabindex="9999">忘记用户名</a></div>\
                    </dd>\
                    <dt class="loginbtn">\
                    <input type="submit" value="立即登录" class="loogerbtn">\
                    </dt></dl></form></div>\
                    <div class="middle"><i></i></div></div>'
                },

        regHtmlstr:function(){
                    return '<div class="overFrameContent fix"><div class="side"><p>\
                    <span>第三方账号登录</span><span class="partner"><a href="//v.6.cn/coopapi/partner/accredit.php?taye=1047&next_action='+encodeURIComponent(loginFast._nextAction || window.location.href) + '&tracing=' + pageMessage._tracing + '" class="loginWith loginWith-qq" title="使用QQ登录" ><i class="icon"></i><em class="bg"></em></a>\
                    <a href="//v.6.cn/coopapi/partner/accredit.php?taye=1003&next_action='+encodeURIComponent(loginFast._nextAction || window.location.href) + '&tracing=' + pageMessage._tracing +'" class="loginWith loginWith-sina" title="使用微博登录" ><i class="icon"></i><em class="bg"></em></a>\
                    <a href="#" class="loginWith loginWith-weixin" id="loginwithWeixin"  title="使用微信账号登录" onclick="loginFast.weixin_login.init(); return false;"><i class="icon"></i><em class="bg"></em></a></span></p>\
                    <div class="login_event_link" id="login_event_link">'+loginFast.LR.event_link+'</div></div>\
                    <div id="weixin_base"><a href="#" class="weixin_close" onClick="loginFast.weixin_login.clear();return false;">返回</a><div style="margin:8px 56px 0;" id="weixin_wrap"></div></div>\
                    <div class="vreg">\
                    <form  method="post" id="regFrame_quick" name="reg_form" class="LRFrame_quick"  action="https://6.cn/reg.php">\
                    <input name="email" value="abc@6.cn" type="hidden" id="member-signup-email"  /><input type="hidden" value="reg" name="action"><input type="hidden" value="live" name="from_act"><input type="hidden" value="'+loginFast.domain+'/uloginTwo.php" name="url">\
                    <dl class="reg-type"></dl>\
                    <dl>\
                    <dd class="protocol fix">\
                    <a class="unchecked_focus" onclick="if(this.className==\'unchecked_focus\'){this.className=\'checked_focus\'; jQuery(\'#login-agree\')[0].checked=true}else{this.className=\'unchecked_focus\'; jQuery(\'#login-agree\')[0].checked=false}"><i></i>我已阅读并同意</a>\
                    <input type="checkbox" class="nobstyle" style="display:none"  value="checkbox" id="login-agree" name="agree"> \
                     <a href="https://v.6.cn/about.php?ac=agreement" target="_blank" class="txt">六间房使用协议</a>\
                     <a href="https://v.6.cn/user/agreement.php?type=7" target="_blank" class="txt">六间房账号管理规则</a>\
                    </dd>\
                    <dt>\
                    <input name="submitreg" type="submit" value="提交注册" class="regbtn">\
                    </dt></dl></form></div>\
                    <div class="middle"><i></i></div></div>'
        },

        mobileHtmlStr:function(username){
            return '<em class="close" title="关闭" onclick="loginFast.cancel()">关闭</em>\
                    <div class="mobelBox">\
                    <h5 class="mobelTit">手机密保验证</h5>\
                    <p class="info">由于本账号登录状态异常，为确保账户安全，请进行手机密保验证。<br />验证成功前，您的账号将暂时无法使用。</p>\
                    <p class="mBtn" id="mobelGetCode"><button>获取验证码</button><span class="callInfo">验证码每天最多获取5次</span></p>\
                    <p class="mBtn" id="mobelPutCode"><input class="focus" type="text" value="填写收到的6位验证码" /><button>提交验证</button><span class="callInfo error">验证码输入有误，您还可以重试7次</span></p>\
                    <p class="warn">如1分钟内您的手机没有收到验证码，您可以重新发送验证码，验证码在首次发送后15分钟内有效</p>' +
                    (username ? ('<p class="warn">您的用户名是<strong>' + username + '</strong>，如果您的手机无法接收验证码，请联系客服</p>') : '') + '</div>';
        }
    },

    set_pos: function(){
        var _box = $('#loginBox');
        _box.css({
            marginTop: '-260px',
            top:'50%',
            opacity: 1,
            transform: 'translate(0, 0)'
        });

        var _t = 0,
            _height = $(window).height()/2;
        if(this.ie6){
            $(window).bind('scroll', function(){
                _t = $(window).scrollTop()+_height;
	            _box.css({
	                position: 'absolute',
	                top: _t
	            });
            });
        }
    },
    create_box: function(_html, reg){
        this.cancel();
        Mask.create();
        $('<div/>',{
            id:'loginBox',
            'class':reg?'loginBox':'loginBox loginBox290',
            'style':'position:fixed; left:50%; top:100px; z-index:99999',
            html:_html
        }).appendTo(document.body);

        setTimeout(this.set_pos, 100);

        if(this.ie6){
            $('#loginBox').css('position', 'absolute');
            $('body,html').scrollTop(this.set_pos);
        }
    },

    login: function(reg, next){
        var self = this;
        this._passwordHandler = $.proxy( this._passwordHandler, this);
        this._nextAction = next || '';
        this.create_box(this.LR.header() 
        	+ '<div style="margin-top:60px; text-align:center;">加载中...</div>' 
        	+ this.LR.footer, reg);

        $LAB.script(JSF.sso).wait(function() {
            var content =  reg == 1 ? self.LR.regHtmlstr() : self.LR.loginHtmlstr();
            $('#loginBox').html(self.LR.header() +content + self.LR.footer);

            if (reg == 1) {
            	$('#loginBox').find('.login-nav i.underline').css({'left':'74px'});
            	$('#loginBox').addClass('regBox').find('.reg-btn').addClass('on');
                self.initReg();
            } else {
            	$('#loginBox').find('.login-btn').addClass('on');
                self.initLogin();
                //document.forms.loginFrame_quick.username.focus();
            }

            SM_fingerprints.init();//加载数美sdk
    		self.inputFocus();

            var _tab = $('#loginBox').find('.login-nav a');
            _tab.on('click', function(){
            	var _reg = 0;
            	$(this).addClass('on').siblings().removeClass('on');
            	if($(this).hasClass('login-btn')){
            		_reg = 0;
            		$('#loginBox').find('.login-nav i.underline').animate({'left':0},300);
            		$('#loginBox').removeClass('regBox');
            		$('#loginBox').addClass('loginBox290');
            	}else{
            		_reg = 1;
            		$('#loginBox').find('.login-nav i.underline').animate({'left':74},300);
            		$('#loginBox').addClass('regBox');
            		$('#loginBox').removeClass('loginBox290');
            	}
            	var _html = _reg == 1 ? self.LR.regHtmlstr() : self.LR.loginHtmlstr();
            	$('#loginBox').find('.overFrameContent').html(_html);
            	
	            if (_reg == 1) {
	                self.initReg();
	            } else {
	                self.initLogin();
	                //document.forms.loginFrame_quick.username.focus();
	            }
	            self.inputFocus();
            });

        });
        return false;
    },

    mobile: function(ticket, username, prod){
        var self = this, secs = 60, ticket = ticket;

        this.create_box(this.LR.header() + self.LR.mobileHtmlStr(username) + this.LR.footer);

        //倒计时
        var countDown = function(node, secs){
            var node = node, secs = secs;
            if(!secs){
                node.html('获取验证码');
                node.removeClass('disabled');
                node.prop("disabled",false);
            }else{
                secs--;
                node.html('('+secs+'秒后)重新获取');
                setTimeout(function() {
                    countDown(node, secs);
                }, 1000)
            }
        };

        var getBtn = $('#mobelGetCode button'), putBtn = $('#mobelPutCode button'), putText = $('#mobelPutCode input');

        //获取手机验证码
        getBtn.bind('click', function(){
            getBtn.prop("disabled",true);
            $.getJSON('//'+ document.domain +'/auth/getAuthCode.php', {act:'login', ticket:ticket}, function(obj){
              if(obj.flag == '001'){
                  countDown(getBtn, 60);
                  getBtn.addClass('disabled');
                  $('#mobelGetCode span:eq(0)').html(obj.content);
              }else{
                  alert(obj.content);
                  getBtn.prop("disabled", false);
              }
          });
        });

        putText.bind('focus', function(){
            if(putText.val() == '填写收到的6位验证码'){
                putText.val('');
            }
            putText.css('color','#333');
        });

        //提交手机验证码
        putBtn.bind('click', function(){
            if(isNaN(putText.val()) || putText.val().length != 6){
                $('#mobelPutCode span:eq(0)').html ('<i></i>请输入正确的6位数字验证码');
                $('#mobelPutCode span').css('visibility','visible');
                putText.focus();
                return false;
            }

            putBtn.prop("disabled",true);

            /**
             * 刘柱说，异地登录输入手机验证码后自动登录。
             * 所以改成 iframe 的方式，方便 php 跳转到悬停通知页面。
             * 
             */
            
            window.__auth_loginCheckError = function(obj) {
            	$('#mobelPutCode span:eq(0)').html('');
                //$('#mobelPutCode span:eq(0)').html('<i></i>验证码输入有误，您还可以重试'+obj.times+'次');
                alert(obj.content);
                putBtn.prop('disabled', false);
            };
            var search = window.location.search;
            var matchobj = /(?:\?|\&)prod\=(\d+)\&?/.exec(search)
            var form = SSOController.createForm('/auth/loginCheck.php?autologin=1',
                'loginCheck', 'POST', 'emptyIframe');
            SSOController.addInput(form, {
                code: putText.val(),
                ticket: ticket,
                prod: matchobj ? matchobj[1] : (prod || '')
            });
            form.submit();
        });
    },

    cancel: function(){
        if(!$('#loginBox')[0]) {
            return;
        }
        if(this.ie6){
            $(window).unbind('scroll', this.set_pos);
        }

        Mask.remove();

        $('#loginBox').remove();
    },

    initReg: function(){
        //注册统计
        try{
            (new Image).src='https://sclick.6rooms.com/w.html?act=10';
        }catch(e){}

        var self = this;
        var regGeetest = null;
        var form = $('#regFrame_quick');
        var needVerify = true;

        //倒计时
        var countDown = function(node, secs){
            var node = node, secs = secs;
            if(!secs){
                node.html('获取验证码');
                node.removeClass('disabled');
            }else{
                secs--;
                node.html('重新获取('+secs+')');                
                setTimeout(function() {
                    countDown(node, secs);
                }, 1000)
            }
        };

        //手机号注册
        (function(){
        	
        	var _mobileHtml = '<dd class="mobile-num fix">\
                <label class="l1"><em><i></i></em></label>\
                <div class="input">\
                <div class="select-box">\
                <select id="member-signup-country">\
                	<option data-code="86" data-attern="^(86-){0,1}1\\d{10}$" value="1">中国</option>\
                </select>\
                </div>\
                <div class="input-box">\
                	<span class="code">+<i id="member-signup-code">86</i></span>\
                	<span class="user-placeholder">手机号码</span>\
                	<input type="text" id="member-signup-mobile" placeholder="手机号码" class="focus" maxlength="15" name="phone">\
                </div>\
                <a class="get-mcode disabled">获取验证码</a>\
                </dd>\
                <dd class="fix" id="member-register-picsig-field" style="display:none;">\
                <label class="l2"><span>验证码</span><em><i></i></em></label>\
                <div class="input fix">\
                <div id="geetest_reg" style="width:312px;float:left;"></div>\
                <div class="remind"><span id="geetest_reg_reload">看不到验证码？<a style="cursor:pointer">点击刷新</a></span></div>\
                </div>\
                </dd>\
                <dd class="login-mobile-code fix">\
                <label class="l1"><em><i></i></em></label>\
                <div class="input"><input type="text" id="member-signup-mcode" placeholder="手机验证码" maxlength="6" class="focus" name="mcode">\
                <span class="user-placeholder">手机验证码</span></div>\
                </dd>';

        	var _nameHtml = '<dd class="fix">\
                    <label class="l1"><em><i></i></em></label>\
                    <div class="input"><input type="text" id="member-signup-un" placeholder="用户名注册后不可更改" class="focus" maxlength="15" name="username">\
                    <span class="user-placeholder">用户名注册后不可更改</span></div>\
                    </dd><dd class="ddpsw fix">\
                    <label><em><i></i></em></label>\
                    <div class="input"><input type="password" id="member-signup-pw" placeholder="密码区分大小写" name="passwd" class="focus">\
                    <span  class="user-placeholder">密码区分大小写</span></div>\
                    <div class="cap"><span class="arrow"><i class="i1">◆</i><i class="i2">◆</i></span>Caps Lock键处于启用状态，请注意区分大小写。</div>\
                    </dd>\
                    <dd class="fix">\
                    <label class="l1"><em><i></i></em></label>\
                    <div class="input"><input type="password" id="member-signup-pwag" placeholder="密码确认" class="focus" name="passwd2">\
                    <span class="user-placeholder">密码确认</span>\
                    </div>\
                    </dd>';
            

            var _box = $('#loginBox'),
                _type = _box.find('.reg-type');
                // _tab = _box.find('.reg-tab'),
                // _sentPhoneCodeGeetest;


       //      _tab.on('click', 'a', function(e){
       //      	var _a = $(this);        		

       //      	_a.siblings().removeClass('on');
       //  		_a.addClass('on');

       //  		if(_a.hasClass('tab-name')){
       //  			_box.removeClass('reg-mobile');
       //  			_type.html(_nameHtml);
       //  		}else{
       //  			_box.addClass('reg-mobile');
       //  			_type.html(_mobileHtml);
       //  		}
	    		// self.inputFocus();

       //  	});



       		_type.html(_nameHtml + _mobileHtml);
            _type.on('click', 'a.get-mcode', function(e){
            	e.preventDefault();
            	var _a = $(this);
            	if(_a.hasClass("disabled")) return;
            	var _mrel = validater['member-signup-mobile']();   
            	    	
            	if(_mrel){
            		var _mobile = $('#member-signup-mobile').val();
            		var _code = $('#member-signup-code').text();
            		var _num = _code + '-' + _mobile;

	            	//_input.attr("disabled", true);
	            	var param = {
                        act:"user_register",
                        prod:20000, // pc端
                        mobile:_num
                    };
                   	
                   	//需要验证
                   	if(needVerify){
                   		if(!regGeetest){
		                    return reload_geetest_handler();
		                };

		                if(!regGeetest.getCode()){
		                    return alert('请滑动验证');
		                };

                   		$.extend(param, regGeetest.getCode());
                   	};

                   	_a.addClass('disabled');

                   	$.getJSON('//'+ document.domain + '/auth/getAuthCode.php', param, function(obj){
		                if(obj.flag == '001'){
		                    countDown(_a, 60);
		                    error($('#member-signup-mobile'), obj.content, 1);
		                }else{
		                    alert(obj.content);
		                    _a.removeClass('disabled');
		                    regGeetest && regGeetest.refresh();
		                   // _input.attr("disabled", false);
		                }
		            });   
            	}
            });

            //区号
            var select = $('#member-signup-country');
            var codebox = $('#member-signup-code');
       		select.on('change', function(e){
       			var op = $(this).find('option:selected');
       			var code = op.attr('data-code');

       			codebox.text(code);
       		});

       		//获取国家列表
       		$.getJSON('/user/getInternationCode.php').done(function(json){
       			if(json.flag == '001'){
       				var arr = [];
       				$.each(json.content, function(i, k){
       					var selected = (i == '86' )? 'selected' : '';//默认中国
       					$.each(k, function(index, value){
       						arr.push('<option '+selected+' data-code="'+ i +'" data-attern="'+value.pattern+'" value="'+i+'">'+value.title+'</option>')
       					});
       				});
       				select.html(arr.join(''));
       			}
       		});
       		

        })();

        var validater = {
            'member-signup-un': function() {
            	var input = $('#member-signup-un');
                var value = $.trim(input.val());

            	var checkUser = {
            		name: function(){
            			var rusername = /^[\da-z\u4E00-\u9FA5]+$/i;
            			if(value.length < 2){
		                    error(input,'用户名不符合规范');
		                    return false;
		                }

		                if(!rusername.test(value)) {
		                    error(input, '您的用户名包含了特殊字符，不能注册。用户名仅允许使用中文、英文和数字');
		                    return false;
		                }   

		                return true;
            		}
            	}                
       
                if(value == ''){
                    return;
                }

                if(!checkUser.name()) return false;
                
                if (input[0].last && input[0].last == value) {
                    return input[0].status;
                }

                input[0].last = value;

                error(input, '检测重名...', 1);

                SSOController.checkUsername(value, function(available, data) {
                    if (available) {
                        error(input);
                        input[0].status = true;
                        form.find('a.get-mcode').removeClass('disabled');
                    } else {
                        error(input, '用户名已被占用');
                        input[0].status = false;
                        form.find('a.get-mcode').addClass('disabled');
                    }

                });
                return false;
            },
            'member-signup-pw': function() {
                var input = $('#member-signup-pw');
                var value = input.val();
                if(value == ''){
                    return;
                }
                if (value.length < 4) {
                    error(input, '密码太短，最少4位');
                    return;
                }
                if (value.length > 12) {
                    error(input, '密码太长，最多12位');
                    return;
                }
                error(input);
                return true;
            },
            'member-signup-pwag': function() {
                var input = $('#member-signup-pwag');
                var value = input.val();
                var first = $('#member-signup-pw').val();
                if(value == ''){
                    return;
                }
                if(value != first){
                    error(input, '两次密码不一致');
                    return false;
                }
                error(input);
                return true;

            },
            'member-signup-mobile': function() {
                var input = $('#member-signup-mobile');
                var value = input.val();

                if(value == ''){
                    return;
                }

                var op = $('#member-signup-country option:selected');
                var reg = op.attr('data-attern');
                var code = op.attr('data-code');
                
            	if(!new RegExp(reg).test(code + '-' + value)) {
			    	error(input, '请输入正确的手机号');
                	return false; 
			    };

			    // var _mobilenum = /^1\d{10}$/;
			    // if(!_mobilenum.test(value)) {
			    // 	error(input, '请输入正确的手机号');
       //          	return false; 
			    // };
			    error(input);
			    return true;
            },
            'member-signup-mcode': function() {
            	if(!$('#member-signup-mcode')[0]) return true; //用户名注册返回

                var input = $('#member-signup-mcode');
                var value = input.val();

                if(value == ''){
                    return;
                }

                var _re = /^\d{6}$/;
                if(!_re.test(value)){
                    error(input, '请输入正确的6位数字验证码');
                    return false;
                }

                error(input);
                return true;

            },
            'login-agree': function(){
                var input = $('#login-agree');
                if(!input[0].checked){
                    alert('未同意六间房使用协议');
                    return false;
                }
                return true;
            }
        };

        var error = function (input, msg, normal){
            var dd = $(input).parents('dd');
            var notice = dd.find('em');

            if (normal) {
                notice.removeClass('invalid').removeClass('valid');
                notice.html(msg);
                return;
            }

            if (msg) {
                var msg = '<i></i>' + msg;
                notice.addClass('invalid').removeClass('valid');
                notice.html(msg);
                input.css('borderColor', 'red');

            } else {
                notice.addClass('valid').removeClass('invalid');
                notice.html('<i></i>OK');
                input.css('borderColor', '');
            }
        };

        var regSuccess = function(data) {
            if(this.next_url){
                location.href=this.next_url;
                return;
            }
            if (window.top.location.href.indexOf('logins.php') > -1) {
                window.top.location = '/';
            } else {
                window.top.location.reload(true);
            }
        };

        var regError = function(data) {
            self.enableForm();
            regGeetest && regGeetest.refresh();
            alert(SSOController.getErrorMsg(data.retcode));
        };

        var showVerifyCodeField = function(type, data) {
        	//获取验证码类型
        	regGeetest && regGeetest.destroy();
    		regGeetest = null;

    		if(type == 1){//极验验证
    			regGeetest = new GeetestPassport($('#geetest_reg'), data);
    			regGeetest.on('onSuccess', function(){
	            	hideVerifyCodeField();
	            });
    		}else{//数美验证
    			//浮动显示层级不够，
    			$('#geetest_reg').css({ position: 'relative', zIndex:4});

    			regGeetest = new V6SMCaptcha('geetest_reg', {
    				width:300
    			});
    			regGeetest.on('onSuccess', function(ret){
		    		if(ret.pass){
						hideVerifyCodeField();
		    		};
	            });
    		};

            $('#member-register-picsig-field').css('display', 'block');
        };	

        var hideVerifyCodeField = function() {
        	form.find('a.get-mcode').trigger('click');
            $('#member-register-picsig-field').css('display', 'none');
            regGeetest && regGeetest.destroy();
            regGeetest = null;
        };

        var reload_geetest_handler = function() {
    		//获取验证类型，0 不显示验证码，1 为极验，2为数美
    		$.getJSON('//'+ document.domain + '/auth/getVerifyCodeType.php').done( function(json){
            	if(json.flag == '001'){
            		if(json.content > 0){//需要验证
            			needVerify = true;

            			if(json.content == 1){// 极验验证
            				//获取极验流水号
            				$.getJSON('/getGeeGt.php?prod=20000', function(data){
				        		if(data.flag == '001'){
				        			showVerifyCodeField(json.content, data.content);
				        		}else{
				        			alert(data.content);
				        		};
				        	}); 
            			}else{// 数美验证
            				showVerifyCodeField(json.content);
            			};
            			
            		}else{//不需要使用滑动验证码
            			needVerify = false;
            			hideVerifyCodeField();
            		};
            	}else{
            		alert(json.content);
            	};
            });
        };

        form.on('blur', 'input.focus', function(event){
            var input = event.target;
            var id = input.id;
            validater[id] && validater[id]();
        });

        form.bind('submit', function(event){
            event.preventDefault();
            try{ //提交注册统计
                (new Image).src='https://sclick.6rooms.com/w.html?act=11';
            }catch(e){}
            
            var ret=false;
            $.each( validater, function(n,v){
                if(typeof v=='function'){
                     return !!(ret = v());
                }
            });

            if (ret) {
                var username = $('#member-signup-un').val();
                var password = $('#member-signup-pw').val();
                var password2 = $('#member-signup-pwag').val();
                var code = $('#member-signup-code').text();
                var mobile = $('#member-signup-mobile').val();
                var phone = code + '-' + mobile;
                var mcode = $('#member-signup-mcode').val();  //手机验证码
                var email = 'abc@6.cn';
                var domain = document.domain;

                if(username=='' || password=='' || password2==''){
                    alert('请填写完整表单再提交');
                    return;
                }

                var register = function(){
                    var param = {
                        'username': username,
                        'password': password,
                        'password2': password,
                        'phone': phone,
                        'code': mcode,
                        'email': email,
                        'domain': domain,
                        'agree': 'checkbox',
                        // record register original
                        'p1': location.host + location.pathname + location.search,
                        'p3': pageMessage._tracing || '',
                        'deviceId': SM_fingerprints.getDeviceId()
                    };

	                SSOController.register(param, {
	                    'appRegisterURL': '//' +window.location.host + '/login_test.php',
	                    'domain': document.domain,
	                    'success': regSuccess,
	                    'error': regError
	                });
	                self.disableForm();
                }

                register();

            }
        });

        $('#member-signup-pw').bind('keypress', this._passwordHandler);
        $('#member-signup-pw').bind('blur', this.hidCap);
        $('#geetest_reg_reload').on('click', function(){
        	if(regGeetest){//已加载，直接刷新
        		regGeetest.refresh();
        	}else{//加载验证码失败，重新加载
        		reload_geetest_handler();
        	}
        });
    },

    initLogin: function() {
        var form = $('#loginFrame_quick');
        var self = this;
        var domain = window.location.host;
        var loginGeetest = null;
        var needVerify = true;

        var success = function(data) {
        	
            if(this.next_url){
                location.href=this.next_url;
                return;
            }
            if (location.href.indexOf('logins.php') > -1) {
                location.href = '/';
            } else {
                location.reload(true);
            }
        };

        var error = function(data) {
            /*-1111 手机验证*/
            if(data.retcode  == '-1111'){
                self.mobile(data.ticket, '', data.prod);
                return false;
            }

            reload_geetest_handler(data.username);
            alert(SSOController.getErrorMsg(data.retcode));
            self.enableForm();
        };

        var whetherUsernameNeedVerify = function(username, callback) {

        	SSOController.preloginUsername = {};//清除用户名geetest缓存信息，其会导致流水号过旧
            SSOController.needVerify(username, function(need, data) {
            	//console.log(username, need, data)
            	//返回值中添加 vc 字段，如果为 0 不显示验证码，1 为极验，2为数美
            	// 不用need，无缝兼容下passport，待passpost上线后可以优化下
            	var vc = data.verifycode || Number(data.vc);

                if (!!vc) {
                    needVerify = true;
                    showVerifyCodeField(vc, data.gt);
                } else {
                    needVerify = false;
                    hideVerifyCodeField();
                }
                callback && callback();
            });
        }

        var showVerifyCodeField = function(type, data) {
            var field = $('#member-login-picsig-field');
            var geetestWrap = $('#geetest_login');

            field.css('display', 'block');

            //获取验证码类型
        	loginGeetest && loginGeetest.destroy();
    		loginGeetest = null;
    		
    		//自动显示验证层
    		var showCaptchaLayer = function(node, classname){
    			geetestWrap.off().on('mouseenter mouseleave', function(event){
            		var target = $(this).find(node);
            		target[event.type == 'mouseenter' ? 'addClass' : 'removeClass'](classname);
            	});
            	geetestWrap.trigger('mouseenter');
    		};

    		if(type == 1){//极验验证
    			loginGeetest = new GeetestPassport(geetestWrap, data);
    			// //显示验证大图
	            loginGeetest.on('onReady', function(){
	            	showCaptchaLayer('.gt_widget', 'gt_show');
	            });
    		}else if(type == 2){//数美验证
    			//浮动显示层级不够，
    			geetestWrap.css({ position: 'relative', zIndex:4});

    			loginGeetest = new V6SMCaptcha('geetest_login', {
    				width:300
    			});

    			loginGeetest.on('onReady', function(){
    				showCaptchaLayer('.shumei_captcha_img_wrapper', 'shumei_show');
    			});
    		};
        };

        var hideVerifyCodeField = function() {
            $('#member-login-picsig-field').css('display', 'none');
        };

        var reload_geetest_handler = function(username) {
        	//每次都要请求下，username验证码是否显示可能不一样
            whetherUsernameNeedVerify(username || String.uniqueID());
        };

        var loginAction = function() {
            var username = $('#member-login-un').val();
            var password = $('#member-login-pd').val();
            var savestate = $('#cookie_check')[0].checked;
            var tologin = function(){
	            SSOController.config({
	                extraParameter: jQuery.extend({}, (needVerify ? loginGeetest.getCode() : {}), {
		               	deviceId: SM_fingerprints.getDeviceId()
		            })
	            });
	            
	            SSOController.login(username, password, savestate ? '1' : '0');
            };

            if(!username || !password) {
                alert('请输入用户名和密码');
                self.enableForm()
                return;
            }

            //验证码已显示，需要验证
            if (loginGeetest) {
        		if(!loginGeetest.getCode()){
        			alert('请滑动验证');
                	self.enableForm();
                	return;
        		};

        		tologin();
            }else{
            	//询问是否需要验证码
            	whetherUsernameNeedVerify(username, function(){
            		if(!needVerify){//不需要直接登录
            			tologin();
            		}else{
            			//需要显示验证码
            			//alert('账号异常，请滑动验证');
	                	self.enableForm();
            		};
            	});
            };
        };
        
        SSOController.config({
            domain: domain,
            appLoginURL: '//' + window.location.host + '/login_test.php',
            success: success,
            error: error,
            next_url:this._nextAction
        });

        $('#member-login-pd').bind('keypress', this._passwordHandler);
        $('#member-login-pd').bind('blur', this.hidCap);
        $('#geetest_login_reload a').on('click', function(event){
        	event.preventDefault();
        	reload_geetest_handler($('#member-login-un').val()); 
        });

        form.bind('submit', function(event) {
            event.preventDefault();
            self.disableForm();
            loginAction();
            
        });
    },

    checkCapsLock: function(event) {
        var code = event.which || event.keyCode;
        var c = String.fromCharCode(code);
        var shift = event.shiftKey;
        var result = false;

        if (c.toUpperCase() === c && c.toLowerCase() !== c && !shift) {
            result = true;
        }
        return result;
    },

    hidCap: function(){
        var tip = $('#loginBox div.cap');
        if ( !tip[0]) {
            return;
        }
        tip.css('display', 'none');
    },

    _passwordHandler: function(event) {
        var tip = $('#loginBox div.cap');
        if ( !tip[0]) {
            return;
        }
        if (this.checkCapsLock(event)) {
            tip.css('display', 'block');
        } else {
            tip.css('display', 'none');
        }
    },

    disableForm: function() {
        this._formState(true);
    },

    enableForm: function() {
        this._formState(false);
    },

    _formState: function(status) {
        var regForm = $('#regFrame_quick');
        var loginForm = $('#loginFrame_quick');
        var button;
        if (regForm[0]) {
            regForm.find('input').prop('disabled', status);
            button = regForm.find('.regbtn')
            if(status){
                button.val('正在提交...');
                button.addClass('regbtn-disabled');
            }else{
                button.val('提交');
                button.removeClass('regbtn-disabled');
            }
        }
        if (loginForm[0]) {
            loginForm.find('input').prop('disabled', status);
            button = loginForm.find('.loogerbtn');
            if(status){
                button.val('正在登录...');
                button.addClass('loogerbtn-disabled');
            }else{
                button.val('登录');
                button.removeClass('loogerbtn-disabled');
            }
        }
    },

    inputFocus: function(){
    	$.each($('#loginBox').find('form input.focus'), function(i, k){
    		var input = $(this);
    		var placeholder = input.attr('placeholder');
    		
    		if(placeholder && !('placeholder' in document.createElement('input'))){
    			var user_placeholder = input.parent().find('span.user-placeholder');
    			user_placeholder.css('display', 'block');
	    		input.on('focus' , function(){
					user_placeholder.css('display','none');
		        }).on('blur' , function(){
					if(input.val()) return;
					user_placeholder.css('display','block');
		       	});
	    	}
    	});

		// $('#loginBox .input').on('click', function(e){
		// 	e.preventDefault();
		// 	$(this).find('input.focus').focus();
  //   	});
    }
};

})();

/**
function createStore(obj, py){
	if(!obj.init){
		$(obj);
		var div = createPopBox();
			div.id='stroreBox';
			div.style.zIndex=101;
			div.content.innerHTML = '<ul>\
					<li><a href="/user/shopid.php" target="_blank">抢靓号</a><br /></li>\
					<li><a href="/user/shopvip.php" target="_blank">升到VIP</a><br /></li>\
					<li><a href="/user/gift.php" target="_blank">兑礼品</a></li>\
				</ul>';

			document.body.appendChild(div);

			document.mfn = function(event){
				var e = event.target;
				while(e){
					if(e==this || e==this.menu) return;
					e = e.parentNode;
				}
				this.menu.style.display = 'none';
				$(document.body).removeEvent('click', document.mfn);
				this.v=0;
			}.bind(obj);

			obj.v=0;
			obj.init = 1;
			obj.menu = div;
			obj.h = obj.offsetHeight;
			switch(py){
				case 1:
					obj.sp=3;
					break;
				case 2:
					obj.sp=190;
					break;
				default:
					obj.sp=0;
			}
			py==1?obj.sp=3:obj.sp=0;
			var pos = obj.getPosition();
			obj.oldLeft = pos.x;
			//obj.oldTop = pos.y+obj.h+obj.sp;
			obj.oldTop = py==1?63:48;
	}

	if(!obj.v){
		if(!Browser.ie6 && !/\.6\.cn\/?(\?.*)?#*$/.test(location.href)){
				//var sp = document.documentElement.scrollTop;
				obj.menu.style.left = obj.oldLeft+'px';
				var sh = document.body.scrollTop || document.documentElement.scrollTop;
				obj.menu.style.top = obj.oldTop+sh+'px';
			}else{
				var pos = obj.getPosition();
				obj.menu.style.left = pos.x+'px';
				obj.menu.style.top = pos.y+obj.h+obj.sp+'px';
		}

		obj.menu.style.display='block'
		$(document.body).addEvent('click',document.mfn);
		obj.v=1;
	}else{
		obj.menu.style.display='none';
		$(document.body).removeEvent('click', document.mfn);
		obj.v=0;
	}
	return false;
}

**/


// tab切换 只有index.source在用，考虑去掉
function tab_change(tabs, rel, cur){
	var tabs=jQuery(tabs), _rels = [], rel = rel||'rel', cur=cur||'on';
	tabs.each(function(i){
		_rels.push(jQuery(this).attr(rel));
		jQuery(this).bind('click', function(e){
			e.preventDefault();
			jQuery(_rels).css('display','none');
			jQuery('#'+jQuery(this).attr(rel)).css('display','block');
			tabs.removeClass(cur);
			jQuery(this).addClass(cur);
		});
	});
	_rels = '#'+_rels.join(',#');
}


/**
//tab切换02 arr = [tab01, tab02]
function tab_change02(arr){
	var cur = null;
	for(var i=0; i<arr.length; i++){
		if(arr[i].className == 'on') cur = arr[i];
		arr[i].box = $6(arr[i].getAttribute('rel'));
		arr[i].rel = arr[i].getAttribute('rel'); // 统计用
		arr[i].change = function(){
			if(cur==this) return false;
			cur.className = '';
			cur.box.style.display='none';
			this.className = 'on';
			this.box.style.display = 'block';
			cur = this;
			return false;
		}
		arr[i].onclick = arr[i].change;
	}
}
**/

 function scriptLoad(url,callback){
	var script=document.createElement('script');
	var head=document.getElementsByTagName('head')[0];
	script.type='text/javascript';
	script.src=url;
	script.onload=script.onreadystatechange=function(){
		if(!this.readyState||this.readyState=='complate'||this.readyState=='loaded'){
			callback&&callback();
			script.onload = script.onreadystatechange = null;
		}
	}
	head.appendChild(script);
}
/*
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('3 Q={r:\'R\',S:8(){4.6={};s 4},T:8(t){$U(\'.\'+4.r).u(8(9){5(9.c(\'a\')[0])4.6[9.V]={\'v\':9.c(\'a\')[0].v,\'7\':9.c(\'z\')[0]?9.c(\'z\')[0].7:9.c(\'a\')[0].W}},4);3 A=\'/X/\'+t+\'.Y?Z=\'+(b B()).11();12(A)},i:8(j){3 C=D(j).13(\'.\');3 E=D(j).14-1-C;3 w=15.16(10,E);3 F=w*j;5(17(1,w)<=F)s G;H s 18},19:8(6){3 1a=6.I;3 1b=6.x;3 1c=b B();6.I.u(8(e){5(e.d&&e.f){J{3 d=k.l.m(e.d.n(\',\'))();3 f=k.l.m(e.f.n(\',\'))()}K(e){3 d=0;3 f=0}3 o=4.r+e.t;5(p.q>d&&p.q<f&&4.6[o]){5(e.L){5(4.i(e.L))b y().7=4.6[o].7}5(e.M){5(4.i(e.M))b y().7=4.6[o].v}}}},4);6.x.u(8(e){5(e.g&&e.h){J{3 g=k.l.m(e.g.n(\',\'))();3 h=k.l.m(e.h.n(\',\'))()}K(e){3 g=0;3 h=0}5(p.q>g&&p.q<h){5(e.N){5(4.i(e.N)&&e.7){5(e.1d==2)b 1e(\'1f\').1g(\'<O 1h="4.1i.1j=\\\'\\\'" 1k="1l:P; 1m:P;1n:1o;1p:-1q;" 1r="x" 1s="0" 1t="G" 7="\'+e.7+\'"></O>\').1u(1v.1w);H b y().7=e.7}}}}},4)}};',62,95,'|||var|this|if|obj|src|function|ele||new|getElementsByTagName|start1||end1|start2|end2|getOdd|num|aptime|toTime|pass|split|idName|pageMessage|curTime|className|return|type|each|href|smx|no|Image|script|url|Date|index|String|onum|smm|true|else|yes|try|catch|r1|p1|p2|iframe|1px|mdFor2|ays|init|get|ES|id|rel|mdfor|js|stamp||getTime|scriptLoad|indexOf|length|Math|pow|getRand|false|back|yes_arr|no_arr|dateObj|s2|Element|div|setHTML|onLoad|parentNode|innerHTML|style|width|height|position|absolute|left|3000px|scrolling|rameborder|allowtransparency|injectInside|document|body'.split('|'),0,{}));
*/

/** han 2014-10-17
function iframeSend(url, date, func, method){
	var method=method?method:'get';
	if(!$6('sendTmp')){
		//var logo = document.getElementById('logo');
		var div = document.createElement('div');
			div.id='sendTmp';
			div.style.position = 'absolute';
			div.style.left = '-9999px';
			div.style.top = '-9999px';
		var hiddens = [];
		for(var pro in date){
			hiddens.push('<input type="hidden" name="'+pro+'" value="'+date[pro]+'" />');
		}
		div.innerHTML='<form name="formtmp" method="'+method+'" action="'+url+'" target="ifrtmp">'+hiddens.join('')+'</form><iframe name="ifrtmp" id="ifrtmp" frameborder=0></iframe>';

		document.body.appendChild(div);
	}else{
		var fo = document.forms.formtmp;
		fo.method=method;
		fo.setAttribute('action',url);
		var tmp = document.createDocumentFragment();
		for(var pro in date){
			var hid = document.createElement('input');
				hid.name=pro;
				hid.value=date[pro];
			tmp.appendChild(hid);
		}
		fo.innerHTML='';
		fo.appendChild(tmp);
	}

	var ifr = $6('ifrtmp');
	//frames.ifrtmp.location.href='about:blank';
	if(document.attachEvent){
		ifr.onreadystatechange = function(){
			if (ifr.readyState == '4' || ifr.readyState == 'loaded' || ifr.readyState == 'complete'){
				func(frames.ifrtmp.document.body.innerHTML);
			}
		}
	}else{
		ifr.onload = function(){
			func(frames.ifrtmp.document.body.innerHTML);
		}
	}
	document.forms.formtmp.submit();
}
**/


function iframeLoad(url, func){
	//var logo = document.getElementById('logo');
	var ifr = document.createElement('iframe');
		ifr.style.position = 'absolute';
		ifr.style.left = '-9999px';
		ifr.style.top = '-9999px';
		ifr.src = url;

		document.body.appendChild(ifr);
		if(document.attachEvent){
			ifr.onreadystatechange = function(){
				if (ifr.readyState == '4' || ifr.readyState == 'loaded' || ifr.readyState == 'complete'){
					func() ;
					ifr.parentNode.removeChild(ifr);
				}
			}
		}else{
			ifr.onload = function(){
				func();
				ifr.parentNode.removeChild(ifr);
			}
		}
}

/** han 2014-10-17
function timeFormat2(t){ // 天，小时
	if(!t) return 0;
	t = Number(t);
	var utypeDay	= Math.ceil(t/86400);
	if (utypeDay <= 1){
		utypeDay	= Math.floor(t/3600);
		return utypeDay+'小时';
	}
	else{
		return utypeDay+'天';
	}
}
**/

var ControlCenter;
(function(){
 var $ = jQuery;
ControlCenter = function(){
	this.initialize.apply(this, arguments);
}; 

$.extend(ControlCenter.prototype, {
		toDomain:_toDomain,
		vis:0,
		delay: 2000, // out
		t: null,
		is_init:0,
		btn:null,
		initialize: function(args){
			var btn = $(args.centerBtn);
			btn.bind('mouseover', $.proxy(this.yvisible, this, btn)).bind('mouseout', $.proxy(this.yhidden, this));

			// 换昵称
			var _cname_btn = $('#changename');
			_cname_btn.bind({
				'mouseover': $.proxy(modnickname.yvisible, modnickname, _cname_btn),
				'mouseout': $.proxy(modnickname.yhidden, modnickname)
			});

			
		},

		boxInit: function(){
			var myRoom = _puser.rid?_toDomain+'/'+_puser.rid:'#', myHome=_puser.uid?_toDomain+'/profile/index.php?rid='+_puser.rid:'#';
			//等级
			var _medal=  '<i class="star'+_puser.rank+'"></i> <i class="rich'+_puser.rich+' rich-'+_puser.uid+'"></i>';
				var _index_class = $('#userPanel_index')[0]?' ucontrol-pop-index':'';
			this.centerBox = $('<div/>',{
				'id': 'controlCenter',
				'class':'ucontrol-pop'+_index_class,
				'html':'<div class="arrow"><i class="i1">◆</i><i class="i2">◆</i></div>\
					<div class="box fix">\
					<div class="userinfo">\
					<div class="user-form">\
					<div class="name"><a href="'+myRoom+'" data-tracing="ipvafi3u"><em>'+_puser.nickname+'</em><span>('+_puser.rid+')</span></a></div>\
					<div class="level fix"><span><em>主播：</em><i class="star'+_puser.star+'"></i></span><span><em>富豪：</em><i class="rich'+_puser.rich+' rich-'+_puser.uid+'"></i></span></div>\
					</div>\
					<div class="logout" data-tracing="ipvafi3w">'+Login.logoutHtml+'</div>\
					<div class="links"><a class="to-room" href="'+myRoom+'" target="_blank" data-tracing="ipvafi3y">直播房间</a></div>\
					</div>\
					<div class="profile">\
					<p class="pic"><a id="roomLink02" href="'+myRoom+'" data-tracing="ipvafi3u"><img src="'+_puser.pic+'" /></a></p>\
					<p class="uploadAvatar"><a href="#" onclick="changePic.visible(); return false;" data-tracing="ipvafi3z">上传头像</a></p>\
					<p class="reset-pw"><a href="' + _toDomain + '/user/userinfo/uinfo.php?step=safe" target="edit" data-tracing="ipvafi40">修改密码</a></p>\
					<p class="set-pw"><a href="' + _toDomain + '/user/userinfo/uinfo.php?step=phone" target="edit" data-tracing="ipvafi41">设置密保</a></p>\
					<p style="display:none;"><a href="'+_toDomain+'/coopapi/partner/sets.php" target="_blank">账户互通</a></p>\
					<p class="help"><a href="/help.php" target="_blank" data-tracing="ipvafi42"><i></i>帮助</a></p>\
					</div>\
					<div class="control">\
					<ul class="fix">\
					<li class="a1"><a href="'+_toDomain+'/user/payshow.php?i=1" target="_blank" data-tracing="ipvafi4d"><i></i>充值商城</a></li>\
					<li class="a2"><a href="'+myRoom+'" target="_blank" data-tracing="ipvafi3y"><i></i>进入房间</a></li>\
					<li class="a3"><a href="'+_toDomain+'/user/listFamily.php" target="_blank" data-tracing="ipvafi43"><i></i>我的家族</a></li>\
					<li class="a4"><a href="'+_toDomain+'/army/myArmy.php" target="_blank" data-tracing="ipvafi44"><i></i>我的军团</a></li>\
					<li class="a5"><a href="'+_toDomain+'/user/im/list.php" target="_blank" data-tracing="ipvafi45"><i></i>我的好友</a></li>\
					<li class="a6"><a href="'+_toDomain+'/user/roomadmin.php" target="_blank" data-tracing="ipvafi46"><i></i>我的房管</a></li>\
					<li class="a7"><a href="'+_toDomain+'/user/fans.php" target="_blank" data-tracing="ipvafi47"><i></i>粉丝守护</a></li>\
					<li class="a8"><a href="'+_toDomain+'/user/favorite.php" target="_blank" data-tracing="ipvafi48"><i></i>关注的人</a></li>\
					<li class="a9"><a href="'+_toDomain+'/user/listrid.php" target="_blank" data-tracing="ipvafi49"><i></i>我的靓号</a></li>\
					<li class="a10"><a href="'+_toDomain+'/user/prop/list.php" target="_blank" data-tracing="ipvafi4a"><i></i>我的道具</a></li>\
					<li class="a11"><a href="'+_toDomain+'/user/mygame.php" target="_blank" data-tracing="ipvafi4c"><i></i>我的游戏</a></li>\
					<li class="a12"><a href="'+_toDomain+'/user/detail.php" target="_blank" data-tracing="ipvafi4b"><i></i>来往账单</a></li>\
					<li class="a13"><a href="'+myHome+'" target="_blank" data-tracing="ipvafi3x"><i></i>个人主页</a></li>\
					<li class="a14"><a href="'+_toDomain+'/user/exchange.php#t31" target="_blank" data-tracing="ipvafi4e"><i></i>兑换六币</a></li>\
					</ul></div></div>',
				
				'mouseover':$.proxy(this.yvisible, this),
				'mouseout': $.proxy(this.yhidden, this)
			}).appendTo(document.body);
			this.is_init=1;
		},
		t_v:0,
		yvisible: function(btn){
			clearTimeout(this.t_v);
			if(this.vis) return; // 在显示状态
			this.t_v = setTimeout($.proxy( this.visible, this,btn), 200);
		},
		yhidden: function(){
			clearTimeout(this.t_v);
			if(this.vis){
				this.t_v = setTimeout($.proxy( this.iHidden, this), 50);
			}
		},

		visible: function(btn){
			if(!this.is_init) this.boxInit();
			if(this.t) clearTimeout(this.t);
			if(this.btn == btn) return this.iHidden();
			this.btn = $(btn);
			this.btn.addClass('user-name-on');

			var _pos = this.btn.offset(), 
				_size= { width:this.btn.innerWidth(), height:this.btn.innerHeight()}, 
				_left = _pos.left-504+_size.width/2;

			this.centerBox.css({
				left: _left,
				top: Math.max(24, _pos.top + _size.height - 10)
			}).addClass('ucontrol-pop-open');
			
			//this.centerBox.slideDown(200);
			this.vis = 1;
			return false;
		},
	
		iHidden : function(){
			this.btn.removeClass('user-name-on');
			this.btn = null;
			if(this.t) clearTimeout(this.t);
			if(!this.centerBox) return false;
			//this.centerBox.slideUp(200);
			this.centerBox.removeClass('ucontrol-pop-open');
			this.vis = 0;
			return false;
		}
	});

})();


var changePic = {
	content:'<h5 class="htitle">\
				<span>上传头像</span>\
				<a onClick="changePic.iHidden()" class="close_big">关闭</a>\
			</h5>\
			<div class="avatarcont fix">\
				<ul class="subNav">\
					<li><a data-rel="custom" class="on">本地上传<em></em></a></li>\
					<li><a data-rel="default">官方推荐<em></em></a></li>\
				</ul>\
				<div class="p"  style="display:none" >\
					<iframe name="imgPrev" id="imgPrev" scrolling="no" frameborder="0" allowtransparency="true" style="background-color=transparent"></iframe>\
				</div>\
                <form id="form1" name="form1" enctype="multipart/form-data" method="post" target="imgPrev" action="' + _toDomain + '/user/userinfo/upimg.php">\
                    <input type="hidden" value="'+_domain+'" name="next_action">\
                    <div class="buttoncont">\
                        <p class="choosebtn">\
                        	<a title="上传图片">选择文件</a>\
                            <span class="uploadbtn" >\
                            <input name="file" type="file" id="changePicBox-filebtn" />\
                            </span>\
                        </p>\
                        <P class="tip">支持jpg、jpeg、png格式，文件小于2M。</p>\
                    </div>\
                </form>\
			</div>',
	popBox:0,
	init: function(){
        var $ = jQuery;
        var div = $('<div>', {
            'class': 'changePicBox',
            'id': 'changePicBox'
        })
		this.popBox = div;
		this.popBox.html(this.content);
		div.appendTo(document.body)

		//PicUploader开始
		var uploader = new PicUploader($('#changePicBox-filebtn')[0], {
		    param: {
		        pid: '1003',
		        size: 'c1'
		    },

		    onReady: function(filename) {
		        if (!this.checkType(filename, ['jpg', 'jpeg', 'png'])) {
		            alert('格式不对');
		            return false;
		        }
		        this.upload();
		    },

		    onStart: function() {
		        $('#form1').addClass('loading');
		    },

		    onComplete: function(obj) {
              $('#form1').removeClass('loading');
		      if(obj.flag == '001'){
		      	$('#imgPrev').attr('src', '/user/userinfo/upimg.php?img=' + 
                    obj.content.url.link
                    + '&width=' + obj.content.url.width + '&height=' + 
                    obj.content.url.height)
                div.find('.p').css('display', 'block');
                $('#form1').css('display', 'none');
		      }else{
		          alert(obj.content);
		      }
		    }
		});

        div.find('.subNav').on('click', function(event) {
            var target = $(event.target);
            var currentTarget = event.currentTarget;

            if ($.nodeName(target[0], 'a')) {
                event.preventDefault();
                if (target.hasClass('on')) {
                    return;
                }
                $(currentTarget).find('a[data-rel]').removeClass('on')
                target.addClass('on')
                if (target.data('rel') == 'default') {
                    div.find('.p').css('display', 'block')
                    $('#form1').css('display', 'none');
                    var src = $('#imgPrev').attr('src');
                    if (!src || src.indexOf('defaultface') < 0) {
                        $('#imgPrev').attr('src', '/user/userinfo/defaultface.php?next_action='+_domain)
                    }
                } else {
                    div.find('.p').css('display', 'none')
                    $('#form1').css('display', 'block');                   
                }
            }
        });
	},

	visible: function(){
		getMask();
		if(!this.popBox) this.init();
		this.popBox.css('display', 'block');
	},
	change: function(){ //提交成功！
		location.reload();
	},
	iHidden: function(){
		this.popBox.css('display', 'none');
		document.body.removeChild($6('loginMask'));
		document.body.removeChild($6('loginMaskBg'));
	}

}
function toHomeTab(f){ // 首页定位列表块
		try{
			getLives.setList(f);
			return false;
		}catch(e){
			return true;
		};
}


function myOpen(args){
	var obj = args.obj, w = args.width, h = args.height;
	var sw = window.screen.availWidth, sh = window.screen.availHeight;
	var left = (sw-w)/2, top = (sh-h)/2-20;
	window.open(obj.href, '', 'height='+h+', width='+w+', top='+top+', left='+left+', toolbar=no, menubar=no, scrollbars=no, status=no');
	return false;
}


// 合建直播提交
function pscheSubmit(obj){
	var sel = obj.getElementsByTagName('select');
	obj.stm.value = sel[1].value+'-'+sel[2].value+'-'+sel[3].value+' '+sel[4].value+':'+sel[5].value+':00';
	obj.submit();
}


// tr增加class=on事件
function addOn(){
	var trs = $$('tr');
	if(!trs.length) return;
	for(var i=0,len=trs.length; i<len; i++){
		if(trs[i].cells[0].tagName.toLowerCase()=='th') continue;
		trs[i].addEvent('mouseover', function(){this.className = 'on'});
		trs[i].addEvent('mouseout', function() {this.className = ''})
	}
}

// 增加on事件
function addEventOn(es){
	for(var i=0; i<es.length; i++){
		es[i].onmouseover = function(){ this.className= 'on'}
		es[i].onmouseout = function(){ this.className = ''}
	}
}





// pay

function chkNum(e, obj){
	var e = e||window.event, k = e.which||e.keyCode;
	return (k>47 && k<58) || k==8 || k==37 || k==39;
}

function getMoney6b(obj){
	var money6b = $6('money6b');
		var val = obj.value;
			val = val.replace(/\D/g,'');
			obj.value = val;
		var ws = String(val/100).split('.'), w=ws[0].split('').reverse().join('').replace(/(\d{3})(?=\d)/g,'$1 ,').split('').reverse().join('');
		money6b.innerHTML = w+(ws[1]?'.'+ws[1]:'');
}

/* 去掉 Prompt代替 han _2012_07_04
function Alert(args){
	if($('alert')) return;
	var msg = args.msg, url=args.href, x=args.left|0, y=args.top||0;
	var div = new Element('div',{
			id:'alert',
			html: '\
				<b class="rtop"><b class="r1"></b><b class="r2"></b><b class="r3"></b><b class="r4"></b></b>\
				<div class="rcontent">\
				<p>'+msg+'</p>\
				<p class="act"><a href="'+url+'" target="_blank" class="ok" title="进入充值页面">确 定</a><a href="#" class="cancel">取 消</a></p>\
				<p><a href="#" class="close" title="关闭">关闭</a></p>\
				</div>\
				<b class="rbottom"><b class="r4"></b><b class="r3"></b><b class="r2"></b><b class="r1"></b></b>\
				',
			events:{
				click: function(e){
					var _a = e.target;
					if(!_a.className) return;
					var _cls=_a.className;
					if(_cls=='close' || _cls=='cancel' || _cls=='ok'){
						$('alert').destroy();
						return _cls=='ok'?true:false;
					}
				}
			}
		});

		if(x) {
			div.style.left = x+'px';
			div.style.top = y+'px';
		}
		document.body.appendChild(div);
		window.scroll(0,0);
}
*/


// popBox
function createPopBox(content){
	var div = document.createElement('div');
	div.className= 'popBox2';
	if(!content) {
		var content = '';
	}
	div.innerHTML = '<table><tr class="top"><td class="l"></td><td class="m"></td><td class="r"></td></tr>\
					<tr class="middle"><td class="l"></td><td class="m">\
					<div class="content">'+content+'</div>\
					</td><td class="r"></td></tr>\
					<tr class="bottom"><td class="l"></td><td class="m"></td><td class="r"></td></tr>\
					</table>';
	div.content = div.getElementsByTagName('div')[0];
	return div;
}

/*去掉 2012_07_04 han
// 礼物框
function createPopBox_gift(content){
	var div = document.createElement('div');
	div.className= 'popBox-gift';
	if(!content) {
		var content = '';
	}
	div.innerHTML = '<div class="content">'+content+'</div>';
	div.content = div.getElementsByTagName('div')[0];
	return div;
}


*/


function createHpop(content, title){
	var div = document.createElement('div');
		div.className='Hpop';
		if(!content) content = '';
		if(title) title = '<p class="mt">'+title+'</p>';
		div.innerHTML = '<div class="ph"><span></span></div><img class="close" onclick="this.parentNode.vis()" alt="关闭" src="//vr0.6rooms.com/imges/pixel.gif"/>\
		<div class="pm pastNotice">'+title+content+'</div>\
		<div class="pf"><span></span></div>';
		div.v=0;
		div.vis = function(){
			if(this.v){
				this.style.display = 'none';
				this.v = 0;
			}else{
				this.style.display = 'block';
				this.v = 1;
			}
		}
		div.content = div.getElementsByTagName('div')[1];
		return div;
}

/* 主页点击主播等级　暂时取消 2011-09-19
function userLevel2(obj){
	if(!document.metal){
		var box = createPopBox('');
			box.getElementsByTagName('table')[0].style.width='260px';
		document.body.appendChild(box);
		document.metal = visBlock('', box, 'wealtMain');
	}
	if(!obj.init){
		$(obj);
		var ms = obj.getAttribute('malt').split('|');
		obj.next =  Number(ms[0])+1;
		obj.coin6 = ms[1];
		obj.init=1;
		obj.s = ms[2];
	}
	if(document.metal.btn==obj) return document.metal.iHidden();
	if(obj.s == 'star'){
		document.metal.content.innerHTML = '主播等级，距 <img src="//vr0.6rooms.com/imges/pixel.gif" class="star'+obj.next+'" /> 还差 '+obj.coin6+' 六豆';
	}else{
		//if(obj.next>10) document.metal.content.innerHTML = '已经顶级';
		//else
		document.metal.content.innerHTML = '富豪等级，距 <img src="//vr0.6rooms.com/imges/pixel.gif" class="rich'+obj.next+'" /> 还差 '+obj.coin6+' 六币';
	}
	document.metal.visible(obj);
}
*/

// userpanel位置
/** 去掉 2014-05-22 han
function headerScroll(){
	if(!Browser.ie6) return;
	var ph = $('ph'), phPos = ph.getPosition();
	ph.style.top = 0;
	ph.style.left = phPos.x;
	ph.style.position='absolute';
	var sT=null, sTT=null;

	function autoScroll(){
		clearTimeout(sTT);
		sTT = setTimeout(function(){
			clearInterval(sT);
			var ny =document.documentElement.scrollTop+1;
			sT = setInterval(function(){
					var my = ph.offsetTop, y = (ny-my)*0.25;
					ph.style.top = my+y;
				}, 25);
		}, 25);
	}

	window.addEvent('scroll', autoScroll);
	window.addEvent('resize', autoScroll);
}
**/

//播放器下文字链广告
var playerAd=function(str){
	if(!$6('playerAd')){
		return;
	}

	var ul=$$('#playerAd ul')[0],
		fx=new Fx.Tween(ul,{property:'margin-top',fps:12,duration:'short'}),
		tall=0,    //总高度
		height=25, //单行高度
		marginTop=0, //为了减少dom操作（读取ul的marginTop属性 ,用一个数字存储）
		timer=0,
	scroll=function(){
		var from=marginTop,
			to=from-25;

		fx.start(from,to);
		marginTop=to;
		timer=window.setTimeout(scroll,5000);
	};

	fx.addEvent('complete',function(){
		tall=tall==0?ul.offsetHeight:tall;
		if(marginTop<=-Math.round(tall/2)){
			marginTop=0;
			fx.set('margin-top',0);
		}
	});


	ul.innerHTML=str+str;
	ul.style.marginTop='0';
	$('player').addClass('hasAd');
	scroll();

	$$('#playerAd .close')[0].addEvent('click',function(){
		window.clearTimeout(timer);
		timer=0;
		scroll=null;
		fx=null;
		ul=null;
		$('player').removeClass('hasAd');
		$('playerAd').destroy();
	});
}

/**
 * 是否显示广告的条件判断函数
 * @param {Number} rank 用户等级，超过或等于此等级的用户不显示广告
 */




//公用统计
function vStatistics(act){
	new Image().src = 'https://6.cn/x.php?f=0&op=' + act;
}

/**
//只有首页在用
var FocusAni;
(function(){
var $=jQuery;
FocusAni = function(){
	this.initialize.apply(this, arguments);
};
$.extend(FocusAni.prototype, {
	delay: 10*1000,
	pics:[],
	lis: [],
	t:0,
	loaded:0,
	loadImages:[],
	link:0,
	img:0,
	initialize:function(obj){
		this.delay = obj.delay && obj.delay*1000||this.delay;
		var _focus = this,
			_box = $(obj.box),
			imgs = _box.find('img');
		if(imgs.length<2) return;
		jQuery.each(imgs, function(){
			var _img = this;
			_focus.pics.push({src:_img.src, href:_img.parentNode.href});
		});
		
		
		_box.html ( '<a href="'+_focus.pics[0].href+'" target="_blank"><img src="'+_focus.pics[0].src+'" /></a><span class="close"></span>' );
		_focus.link = _box.find('a:eq(0)');
		_focus.img = _box.find('img:eq(0)');
		_focus.link.bind('mouseover',  $.proxy(_focus.pause, _focus))
					.bind('mouseout', $.proxy(_focus.start, _focus));

		var len =_focus.pics.length, 
			numBox = $('<div class="numBox"></div>').on('click mouseover mouseout', 'a', function(e){
				e.preventDefault();
				if(e.type=='click') {
					_focus.next($(this).attr('index'));
				}else if(e.type=='mouseover'){
					_focus.pause();
				}else{
					_focus.start();
				}
			});

		var prevHtml = $('<a class="focus_slider_prev"></a>').on('click mouseover mouseout', 'a', function(e){
				e.preventDefault();
				if(e.type=='click') {
					_focus.next($(this).attr('index'));
				}else if(e.type=='mouseover'){
					_focus.pause();
				}else{
					_focus.start();
				}
			});
		var nextHtml = $('<a class="focus_slider_next"></a>').on('click mouseover mouseout', 'a', function(e){
				e.preventDefault();
				if(e.type=='click') {
					_focus.next($(this).attr('index'));
				}else if(e.type=='mouseover'){
					_focus.pause();
				}else{
					_focus.start();
				}
			});

		_box.find('span.close').bind('click', function(){
			_focus.close();
		});

		var _pages = [];
		for(var i=0; i<len; i++){
			_pages.push('<a href="#" index="'+i+'">'+(i+1)+'</a>');
		}

		numBox.html(_pages.join(''));
		numBox.appendTo(_box);
		prevHtml.appendTo(_box);
		nextHtml.appendTo(_box);
		numBox = null;
		_focus.box = _box;
		_box = null;
		_focus.btns = _focus.box.find('.numBox a');
		_focus.btns.eq(0).addClass('cur');
		_focus.imgLoad();
	},

	close: function(){
		this.pause();
		this.box.css('display','none');
	},

	imgLoad: function(){
		var _focus = this;
		$.each( _focus.pics, function(i,_img){
			_focus.loadImages[i] = new Image();
			_focus.loadImages[i].onload = function(){
				_focus.loaded++;
				//this = null;
				if(_focus.loaded == _focus.pics.length){
					_focus.start();
				}
			};
			_focus.loadImages[i].src = _img.src;
		});
		for(var i=0; i<this.pics.length; i++){
			this.loadImages[i] = new Image();
			this.loadImages[i].onload = $.proxy(function(){
				this.loaded++;
				if(this.loaded==this.lis.length){
					this.start();
				}
			}, this);
			this.loadImages[i].src = this.pics[i].src;
		}
	},

	next: function(n){
		clearTimeout(this.t);
		if(n=='n'){
			this.pos = this.pos<this.pics.length-1 ? ++this.pos : 0;
		}else{
			this.pos = n;
		}
		this.btns.removeClass('cur').eq(this.pos).addClass('cur');
		this.link[0].href=this.pics[this.pos].href;
		this.img[0].src=this.pics[this.pos].src;
		this.start();
	},

	start: function(){
		clearTimeout(this.t);
		this.t = setTimeout($.proxy(this.next, this,'n'), this.delay);
	},

	pause: function(){
		clearTimeout(this.t);
	}
})

})();
**/


(function(){
    if(!document.body){
        setTimeout(arguments.callee, 1000);
        return;
    }
 // 页面需要一个空IFRAME
    if(!frames['emptyIframe']){
        var ifr ;
        var body = document.body;
        var div = document.createElement('div');
        //为什么用innerhtml
        //@see https://stackoverflow.com/questions/2105815/weird-behaviour-of-iframe-name-attribute-set-by-jquery-in-ie
        div.innerHTML = '<iframe name="emptyIframe" style="display:none" ></iframe>';
        ifr = div.firstChild;
        body.insertBefore(ifr, body.firstChild);
    }
})();

/** han 2014-10-23
//批量关注
var BatchFollow;
(function(){
var $ = jQuery;
BatchFollow = function(){
	this.initialize.apply(this, arguments);
}; 

$.extend(BatchFollow.prototype, {
	initialize:function(container,fetch){
		var container=$('#'+container);
		if(container.attr('id')){
			this.container=container.attr('id');
		}else{
			this.container=String.uniqueID();
			container.attr('id',id);
		}

		this._clickHandler=$.proxy(this._clickHandler, this);

		container.bind('click',this._clickHandler);
		container.css('display','block');
		if(fetch){
			this._getBack=$.proxy(this._getBack, this);
			this.get();
		}

	},

	get:function(){
		$.getJSON( '/top/starDayTop.php', this._getBack);
	},
	_clickHandler:function(event){
		var target=$(event.target),
			selectArea;

		if(target.hasClass('js_followBtn')){
			event.preventDefault();
			target.addClass('disabled');
			this._follow();
		}

		if(selectArea=target.parents('div.js_selectArea')){
			event.preventDefault();
			if(selectArea.hasClass('on')){
				this._unselect(selectArea);
			}
			else{
				this._select(selectArea);
			}
		}
	},
	_select:function(elem){
		elem.addClass('on');
		elem.find('input').val(elem.attr('data-id'));
	},
	_unselect:function(elem){
		elem.removeClass('on');
		elem.find('input').val('');
	},
	_serialize:function(){
		var container=$('#'+this.container),
			inputs=container.find('input'),
			ar=[];

		inputs.each(unction(i,elem){
			var v=elem.val();
			if(v){
				ar.push(v);
			}
		});

		return ar.join();
	},
	_follow:function(){
		if(!_puser.uid){
			loginFast.login();
			return;
		}
		var data=this._serialize();
		
		$.getJSON( '/message/follow_add.php?act=p&format=json&tuids='+data, this._followBack);
	},
	_followBack:function(responseText){
		//var data=JSON.decode(responseText);
		alert('关注成功');
	},
	_getBack:function(data){
		//var data=JSON.decode(responseText);

		if(data.flag!='001'){
			alert(data.content);
			return;
		}

		var template=$('#recommendStarTemplate').val(),
			fragment=document.createDocumentFragment(),
			reg=new RegExp(['\{ID\}','\{PIC\}','\{RID\}','\{NAME\}','\{FANS\}'].join('|'),'g');

		$.each(data.content,function(d){
			var str=template.replace(reg,function(word){

				switch(word){
					case '{ID}':
						return d.cid;
					case '{PIC}':
						return d.pic;
					case '{RID}':
						return d.rid;
					case '{NAME}':
						return d.username;
					case '{FANS}':
						return d.fansNum;
				}
			});

			var li=document.createElement('li');
			li.innerHTML=str;
			fragment.appendChild(li);
		});

		$('#'+this.container).find('.loading').remove();;
		$('#'+this.container).find('ul').append(fragment);
	}
});

})();
**/

/* 没用了 2016-6-13
//关键字联想
var SearchThink = {
	input:'', //input节点
	url:'', //请求网址
	keytxt:'', //搜索关键字
	box:0,//关键字盒子
	t:0, //请求状态
	init: function(input, url){ //初始化,input节点,url关键字请求地址
		this.input = input||this.input;
		this.url = url||this.url;
		this.box = jQuery('#videoThink');
		this.event();
	},
	event: function(){ //input获取焦点后，监听鼠标和键盘事件
		var self = this;
		var selClass = 'select';		

		this.input.keyup(function(e){
			var key = e.which;
			switch(key){
				case 38: //上
					if(self.box.find('ul').length == 0) return;
					var li = self.box.find("li."+selClass);
					if(li.length == 0){
						self.box.find("li").last().addClass(selClass);
						self.keytxt = self.box.find("li").last().find("span.txt").text();
						self.input.val(self.keytxt);
					}else if(li.prev().length == 0){
						li.removeClass();
						self.box.find("li").last().addClass(selClass);
						self.keytxt = self.box.find("li").last().find("span.txt").text();
						self.input.val(self.keytxt);
					}else{
						li.removeClass();
						li.prev().addClass(selClass);
						self.keytxt = li.prev().find("span.txt").text();
						self.input.val(self.keytxt);
					}
					break;
				case 40:// 下
					if(self.box.find('ul').length == 0) return;
					var li = self.box.find("li."+selClass);
			 		if(li.length == 0){
						self.box.find("li").first().addClass(selClass);
						self.keytxt = self.box.find("li").first().find("span.txt").text();
						self.input.val(self.keytxt);
			 		}else if(li.next().length == 0){
						li.removeClass();
						self.box.find("li").first().addClass(selClass);
						self.keytxt = self.box.find("li").first().find("span.txt").text();
						self.input.val(self.keytxt);
			 		}else{
						li.removeClass();
						li.next().addClass(selClass);
						self.keytxt = li.next().find("span.txt").text();
						self.input.val(self.keytxt);
			 		}
					break;
				case 13:// 回车
					self.box.fadeOut("fast");
					break;
				default:
					if(self.input.val() !== self.keytxt){
						self.keytxt = self.input.val();
						self.create();
					}
					break;
			}
		}).focus(function(){
			if(self.box && self.box.find('li').length>0){
				self.box.addClass("search-think-open");
			}
		}).blur(function(){
			if(self.box){
				setTimeout(function(){
					self.box.removeClass("search-think-open");
				}, 200);					
			}
		});		

		this.box.on('hover', 'li', function(){
			self.box.find("li").each(function(){
				jQuery(this).removeClass();
			});
		}).on('click', 'li', function(){
			self.keytxt = jQuery(this).find("span.txt").text();
			self.input.val(self.keytxt);
			jQuery('#searchForm').submit();
		})
	},
	create: function(){ // 建立联想字列表盒子
		var self = this;
		clearTimeout(this.t);
		this.t = setTimeout(function(){
			self.get()
		}, 500);

		this.box.addClass("search-think-open");
	},
	get: function(){ //AJAX请求联想字
		var self = this;
		this.geting = 1;
		jQuery.ajax({
			dataType: "json",
			cache: false,
			type: "get",
			url: self.url + self.keytxt,
			success: function(obj){
				if(obj.flag == "001" && obj.content.length != 0){
					self.geting = 0;
					self.box.find('ul').remove();
					var html ='<ul>';
					for(var i=0; i<obj.content.length; i++){
						html += '<li><span class="txt">'+obj.content[i]+'</span></li>';
					}
					html += '</ul>';
					jQuery(html).appendTo(self.box);
				}else{
					self.geting = 0;
					self.box.find('ul').remove();
				}
			}
		})
	}
}

jQuery(function(){
	var $ = jQuery;
	if(!$('#searchForm')[0]) return;
	if($('#searchTxt')[0] && $('#input_type').val == 'video'){
		SearchThink.init($('#searchTxt'), '/video/search.php?act=json&key=')
	}

	$('#searchTxt').on('focus', function(e){
		$('#searchForm').parent().addClass('search-focus');
  	})
	$('#searchTxt').on('blur', function(e){
		$('#searchForm').parent().removeClass('search-focus');
  	})
});

//头部搜索
var searchBox;
(function(){
var $ = jQuery;
searchBox = {
	submit: function(_f){
		console.log(_f);
		if(_f.type.value=='changzhan'){
			location.href="https://v.6.cn/changzhan/search.php?key="+_f.key.value;
			return false;
		}else if(_f.type.value=='roomid'){
			if(_f.key.value.length < 2){
				alert('搜索房号必须输入2位以上数字');
				return false;
			}else if(isNaN(_f.key.value)){
				alert('搜索房号只能输入数字');
				return false;
			}
			return true;
		}else{
			return true;
		}
	},
	select:0, // 大容器
	key:0, //关键字显示容器
	key_input:0, // 关键字input_hidden
	setOption: function(){
		if(!this.select){ // 初始化工作
			this.select = $('#so_option');
			this.key = $('#so_type');
			this.key_input = $('#input_type');

			//给ul列表里的a设置点击事件
			this.select.find('ul a').bind('click', function(_e){
				_e.preventDefault(); // 中止a的默认动作
				searchBox.key.html(this.innerHTML); // this == a
				searchBox.key_input.val(this.className);
				if(searchBox.key_input.val() == 'video'){
					//$(window).bind('domready', function(){
						if($('#searchTxt')[0]){
							SearchThink.init($('#searchTxt'), '/video/search.php?act=json&key=', 156)
						}
					//});
				}else{
					//$(window).bind('domready', function(){
						if($('#searchTxt')[0]){
							$('#searchTxt').unbind("keyup");
							$('#searchTxt').unbind("focus");
						}
					//});
				}
				searchBox.select.attr('class','soOption');

				$('#nickThink, #videoThink').html(''); //清空联想字
			});
		}

		this.select.attr('class','soOptionAct'); //根据当前的class设置CLASS
		this.select.bind('mouseleave', function(){ //mouseenter
			searchBox.select.attr('class','soOption'); 
		});
	}
}
})();
*/

var Prompt;
(function(){

var $ = jQuery;
Prompt = {

	//'class': {1:'zhuabiePop', 2:'pm_changzhan'},
	box:0,
	mask:0,
	queue:[],
	ie6:($.browser.msie && $.browser.version =='6.0'),
	t:0, //延时关闭
	html:'<div class="popInner">$btn_close<h3>$title</h3><div class="popCon">$content</div><div class="popBtn"><p>$btn_sure $btn_cancel</p></div></div>',
	title:'六间房提示您', //标题
		/**
		_obj参数：
		class_name:'', //附加样式
		content:'', //内容
		callback: function(){} // 回周方法 返回 0,1
		btn_sure:0, //确定按钮 {text:'', link:'', target:''} 有link时为连接 target:默认为 _self
		btn_cancel:0, //取消按钮 同上
		onCreateAfter: function(){}, //创建完窗口后的动作
		onSubmit: function(){ return 0}, //提交表单用
		delay: 0, // 计时关闭
		opacity:0, //北京层透明度
		width:0 //宽度
		**/

	create: function(obj){ //
		if(this.box){
			this.queue.push(obj)
		}else{
			this.callback = obj.callback;
			var _btn_sure = obj.btn_sure?'<a class="sure" href="'+(obj.btn_sure.link||'')+'" target="'+(obj.btn_sure.target||'_self')+'">'+(obj.btn_sure.text||'确定')+'</a>':'',
				_btn_cancel= obj.btn_cancel?'<a class="cancel" href="'+(obj.btn_cancel.link||'')+'" target="'+(obj.btn_cancel.target||'_self')+'">'+(obj.btn_cancel.text||'取消')+'</a>':'',
				_btn_close = obj.btn_cancel&&obj.btn_cancel.link?'<a class="cancel close-big" href="'+obj.btn_cancel.link+'" target="'+(obj.btn_cancel.target||'_self')+'">取消</a>':'<a class="close-big cancel _xxx">取消</a>';
			
			var _html = this.html.replace('$title', obj.title||this.title)
							.replace('$content', obj.content||'')
							.replace('$btn_close', _btn_close)
							.replace('$btn_sure', _btn_sure)
							.replace('$btn_cancel', _btn_cancel);

			this.box = $('<div/>', {
				'class': 'promptbox',
				html:_html
			}).appendTo(document.body).addClass(obj.class_name||'');

			//张智点击统计
			if(obj.tracing){
				this.box.attr('data-tracing', obj.tracing);
			}

			this.box.find('img').on('load', function(){
				Prompt.setPos();
			});

			this.setPos();
			this.box.css('visibility', 'visible');
			if(obj.onCreateAfter) obj.onCreateAfter(this.box);
			if(this.ie6){
				this.box.css('position', 'absolute');
				$(window).bind('scroll', this.setPos);
			}

			 //宽度重新设定
			if(obj.width){
				var _w = Math.floor(obj.width/2);
				this.box.css({
					width:obj.width,
					'margin-left':-_w
				});
			}

			this.box.on('click', 'a.cancel, a.cancel_xxx, a.sure', function(_e){
				var _cls = _e.target.className;
				if(_cls=='sure'){
					//连接直接跳转
					if(obj.btn_sure && obj.btn_sure.link){
						// 充值来源统计
                        if (obj.btn_sure.link.indexOf('payshow.php') > -1) {
                            $.cookie('pay_tracing', pageMessage._tracing || 'null', {
                                path: '/',
                                domain: $.browser.msie ? '' : '6.cn'
                            });
                        }
						setTimeout(function(){ Prompt.close(1) }, 200);
						return true;
					}
					_e.preventDefault();
					if(obj.onSubmit){//通常为验证表单 不通过
						//var _inps = Prompt.get_inps();
						if(!obj.onSubmit()) return;
					}
					Prompt.close(1);
					return false;
				}else if(_cls.indexOf('cancel')>-1){
					if(obj.btn_cancel && obj.btn_cancel.link){
						setTimeout( Prompt.close, 200);
						return true;
					}
					_e.preventDefault();
					Prompt.close(0, _cls.indexOf('_xxx')>-1 ); // 点的 x 还是按钮
					return false;
				}
				return true;
			});

			Mask.create(obj.opacity>-1&&obj.opacity||false);

			if(obj.delay){
				this.t = setTimeout(this.close, obj.delay);
			}
			return this.box;
		}
	},

	setPos: function(){
		var _hash = location.hash,
			_hash_num=parseInt(_hash.replace(/#.*v6hash/,'')),
			_is_ifr  = _hash.indexOf('v6hash')>-1;
		var _t = Prompt.ie6?$(window).scrollTop():0;
		Prompt.box.css({
			'margin-top': -Math.floor(Prompt.box.height()/2)-50+_t,
			'top':_is_ifr?100+_hash_num+parseInt(Prompt.box.height()):'50%'
		});
	},
	/**
		_act: 是或否传给回调方法
	**/
	close: function(_act, xxx){
		var _prompt = Prompt,
			_act = _act || 0;
		if(_prompt.callback){
			//var _inps = _prompt.get_inps();
			_prompt.callback(_act, xxx);
		}
		clearTimeout(_prompt.t);
		if(_prompt.ie6)$(window).unbind('scroll', _prompt.setPos);
		_prompt.box.remove();
		Mask.remove();
		_prompt.callback = null;
		_prompt.box = null;
		var _obj = _prompt.queue.shift();
		if(_obj) _prompt.create(_obj);
	},
	/**
	get_inps: function(){
		var inps = this.box.find('input,textarea'),
			_args = {};
		inps.each(function(){
			_args[$(this)[0].name] = this;
		});
		return _args;
	},
	**/
	alert: function(msg, delay, fn){
		Prompt.create({
			btn_sure:1,
			delay: jQuery.type(delay)=='number'?delay:5000,
			content: '<div style="padding:12px 0">' + msg + '</div>',
			callback: jQuery.type(delay)=='function'? delay: (jQuery.type(fn)=='function'?fn:jQuery.noop)
		});
	},
	confirm: function(msg, callback){
		Prompt.create({
			btn_sure: 1,
			btn_cancel: 1,
			content: msg,
			callback: callback
		});
	}
}
})();

/*
 *	userInfo Card
*/

UserInfoCard = {
	//<div class="userCardPop">
	html:'<a class="refresh" href="javascript:;"></a>\
    <div class="box">\
    <div class="record">\
    <div class="pic">\
    <a target="_blank" href="//v.6.cn/profile/index.php?rid={rid}">{upic}</a>\
    <span class="safe-num">{safenum}人守护</span>\
    <span class="name"><a class="alias" href="//v.6.cn/profile/index.php?rid={rid}" target="_blank">{alias}<span>({rid})</span></a>{tag}</span>\
    {userMood}\
    </div>\
    <p class="info"><span class="name">备注：{vip}<span class="remark"><em>{umark}</em><a class="medit" title="添加备注名称" data-tracing="iqg9rucu"></a><input type="text" value="{umark}"><a class="rconfirm">确定</a><a class="rcancel">取消</a></span></span>\
    <span class="upgrade"><span class="this">主播：{star} </span><span class="next fixpng">还差{wealtlate}六豆升级</span></span>\
    <span class="upgrade"><span class="this">富豪：{rich} </span><span class="next fixpng" {rich-next-v}>还差{coin6late}六币升级</span></span>\
    <span>家族：{fpic}</span><span>军团：{gpic}</span>\
    <span class="badge{badge} fix"><em>徽章：</em><em class="badge-pic">{uico}</em></span>\
    </p>\
    </div>\
    <div class="link fix">\
    <p class="goroom"><a href="//v.6.cn/{rid}" target="_blank" data-tracing="iqg9rucv">进入房间</a></p>\
    <p class="foll" data-tracing="iqg9rucw">\
    <span class="folldesc">有{fans}人关注了Ta</span>\
    <span class="follow{follow}"><i class="fadd">关注</i><em class="unfollow"><i class="following">已关注</i><i class="fcancel">取消</i></em></em></span>\
    </p>\
    </div>\
    </div><em class="arrow"></em><span class="close_big"><i class="cancel"></i></span><div class="loading"></div>',
	//<span class="send_msg"><a class="send_msg_pri" href="https://v.6.cn/user/secretmail/sendMail.php?roomId={rid}&alias={alias2}" target="_blank"><i></i>密信</a></span>
	style:'', //btn:位置以btn为准 win:位置以win为参考居中
	uid:0,
	//创建信息层
	createCard: function(){
		if(this.card) {
			return this.card
		};
		this.card = jQuery('<div class="userCardPop popCancel userCarLoad"></div>').appendTo(document.body);
		this.card.bind('click', this.click);
		if( this.style!='win'){
			this.html = this.html.replace(/<a.+?<\/a>/,'');
		}
		return this.card;
	},

	click: function(_e){
		var _btn = jQuery(_e.target);
		_e.stopPropagation();
		switch(_btn.attr('class')){
			case 'medit': //编辑备注
				UserInfoCard.mEdit.edit(_btn);
				_e.preventDefault();
				break;
			case 'rconfirm': //备注确定
				UserInfoCard.mEdit.submit();
				_e.preventDefault();
				break;
			case 'rcancel': // 取消编辑备注
				UserInfoCard.mEdit.cancel();
				_e.preventDefault();
				break;
			case 'fadd': //关注
				UserInfoCard.F.follow(_btn, UserInfoCard.uid);
				_e.preventDefault();				
				break;
			case 'fcancel': //取消关注
				UserInfoCard.F.cancel(_btn, UserInfoCard.uid);
				_e.preventDefault();
				break;
			case 'refresh':
				var _uid = UserInfoCard.uid;
				UserInfoCard.uid=0;
				UserInfoCard.getCard(_uid);
				break;
			case 'cancel': //关闭 card
				UserInfoCard.hCard();
				_e.preventDefault();
				break;
			case 'send_msg_pri'://发密信 游客提示登录
				if(!_puser.uid) {
					Login.toLogin();
					_e.preventDefault();
					break;
				}else{
					return true;
				}
		}
		return true;
	},

	/*
	*	uid:用户uid, _btn:auto模式鼠标
	*/
	getCard: function(_uid, _btn){
		//神秘人忽略
		if(!_uid || _uid/1>1900000000) return;

		if(this.uid == _uid){ //数据已经有直接显示 鼠标在同一个用户名间移动
			this._vCard(_uid, _btn);
			return;
		}else{
			if(this.is_get) return; 
			//myAlert('aaa');
			//this.card.getElements('p,em,div,img,b,span,a').destroy();
			try{this.card.find('div.box').remove();}catch(e){};
			this.card.html(this.html);

			if(this.style=='win')this._vCard('userCarLoad'); //显示加载过程
			this.is_get = 1;
			var _card = this;
			jQuery.ajax({
				type: 'GET',
				dataType: 'json',
				url: '/message/userinfo.php?rand='+(new Date).getTime(),
				data: {tuid:_uid, uid:_puser.uid||0},
				success: function(U){
					_card.is_get=0;
					_card._setCard(U, _btn);
				}
			})
		}
	},
	_setCard: function(obj,_btn){

		if(obj.flag=='001'){
			var U = obj.content;
			this.uid=U.uid;

			//设置内容 徽章统一
			//家族
			var _family = '暂无';
			if(U.fid.length>0){
				_family='';
				jQuery.each(U.fid, function(i,_fid){
					_family += '<a href="'+_toDomain+'/family/rewriteIndex.php?id='+_fid+'" target="_blank"><img src="https://vi0.6rooms.com/live/family/'+_fid+'.png"></a>';
				});
			};
			//军团
			var _army = '暂无';
			if(U.gid && U.gid.length>0){

				var _am = U.gid[0].toString().split('-'); // 图片-类型-等级 // 65\/64\/920000111_75117
				_army = '<a href="'+_toDomain+'/a/'+_am[0].replace(/^.+\//,'').split('_')[0]+'" target="_blank"><em class="army_level" style="background:url(https://vi0.6rooms.com/live/army/'+_am[0]+'.png)"><i class="army'+_am[2]+'"></i></em></a>';
			}

			//徽章
			var _uicos = '', _badge='nobadge';
			if(U.prop.length>0){
				_badge = '';
				jQuery.each(U.prop, function(i,_e){
					//_uicos += '<i class="uIco badge_'+_e+'"></i>';
					
					_uicos += Badge.get_ico_img(_e);
				});
			}
			//达人徽章
			// var _master = '', _mbadge = 'master-badge-no';
			// if(U.master && U.master.length > 0){
			// 	_mbadge = 'master-badge';
			// 	jQuery.each(U.master, function(i,_e){
			// 		_master += '<img src="//vr0.6rooms.com/imges/live/CSSIMG/event/operations/master_badge_s_'+_e+'.gif" alt="">';
			// 	});
			// };

			// var _mline = 'master-line-no';
			// if(_uicos && _master){
			// 	_mline = 'master-line';
			// }

			var _star = U.wrank/1?'<i class="star'+U.wrank+'"></i>':'暂无',
				_rich = U.crank/1?'<i class="rich'+U.crank+' rich-'+U.uid+'"></i>':'暂无',
				_vip = U.vip && U.vip.length?'<i class="'+Pres[U.vip[0]].cls+'"></i>':'',
				_tag = [];

			if(!!U.approveTag){
				jQuery.each(U.approveTag, function(i, e){
					_tag.push('<a class="tag" '+e.id+'>'+e.name+'</a>');
				});				
			}
						
			//心情
			var userMood = U.userMood ? '<p class="mood-box"><span class="mood">'+U.userMood+'<em class="l"></em><em></em></span></p>' : '';
			var _html = this.html.replace(/\{uid\}/g, U.uid)
				.replace(/\{rid\}/g, U.rid)
				.replace(/\{upic\}/, '<img src="'+U.userpic+'">')
				.replace('{tag}', _tag.join(''))
				.replace(/\{vip\}/, _vip)
				.replace(/\{alias\}/, U.alias)
				.replace(/\{alias2\}/, encodeURIComponent(U.alias))
				.replace(/\{umark\}/g, U.remark)
				.replace(/\{star\}/, _star)				
				.replace(/\{star_next\}/, U.wrank+1)
				.replace(/\{wealtlate\}/, U.wealtlate)
				.replace(/\{rich\}/, _rich)
				.replace(/\{rich_next\}/, U.crank+1)				
				.replace(/\{fpic\}/, _family)
				.replace(/\{gpic\}/, _army)
				.replace(/\{uico\}/, _uicos)
				.replace(/\{fans\}/, U.fansnum)
				.replace(/\{follow\}/,(U.isFav?' followed':'') )
				.replace(/\{badge\}/,_badge)
				.replace(/\{userMood\}/, userMood)
				.replace(/\{safenum\}/, U.safeNum);
			// 神以上等级， 只能自己看到距下一级所需6豆
			if(U.crank>24 && _puser.uid != U.uid){
				_html = _html.replace('{rich-next-v}', 'style="display:none"');
			}else{
				_html = _html.replace(/\{coin6late\}/, U.coin6late);
			}
			
			this.card.empty().html(_html);
			
			if(U.crank == 31){
				/*
				this.card.find('.next:eq(1)').html('万众期待 <img src="/api/godUserNextImg.php?uid='+U.uid+'"/>');
				if(U.istop1 == 1) this.card.find('.next:eq(1)').css('display', 'none');
				*/
				this.card.find('.next:eq(1)').css('display', 'none');
			}

			if(this.style=='win'){//弹出层
				this.card.removeClass('userCarLoad');
			}else{ // 浮动层
				this._vCard(U.uid,_btn);
			}

			// 临时矫正位置
			// var _tagNode = this.card.find('.pic a.tag');
			// if(_tagNode.length>0){
			// 	_tagNode.parents('span.name').css('margin-right', -39*_tagNode.length);				
			// }	

		}else{
			this.hCard();
		}
	},

	_vCard: function(_uid,_btn){
		var _cls='popCancel';
		if(this.style=='win'){ //居中并加蒙板
			_cls = _cls+' '+_uid; // _uid为加载的样式 load
			
			
			/**
			//蒙板
			var _hw = {
				x: document.documentElement.scrollWidth,
				y: document.documentElement.scrollHeight
			}
			var _hs = screen.height, _h = _hw.y>_hs?_hw.y:_hs;

			this.mask = jQuery('<div class="promptbg" sytle="height:'+ _h +'"></div>').appendTo(document.body).css('visibility', 'visible');
			**/
;
			this.card.css({
				'top': '50%',
				'left': '50%',
				'position': 'fixed',
				'margin-left': -Math.floor(jQuery(this.card).width()/2)
			})

			//设置位置
			this.setPos();
			if(jQuery.browser.msie && jQuery.browser.version =='6.0'){
				this.card.css('position', 'absolute');
				jQuery(window).bind('scroll', this.setPos);
			}
		}else{
			if(this.uid != _uid) return; //载入慢 UID已经换
				var _card = {
					x: this.card.width(),
					y: this.card.height()
				},
				_pos = {
					x: parseInt(jQuery(_btn).offset().left),
					y: parseInt(jQuery(_btn).offset().top)
				},
				_es = {
					x: jQuery(_btn).width(),
					y: jQuery(_btn).height()
				},
				_wSize = {
					x: jQuery(window).width(),
					y: jQuery(window).height()
				},
				_wScroll = {
					x: jQuery(window).scrollLeft(),
					y: jQuery(window).scrollTop()
				}
				_bx = (_wScroll.x+_wSize.x)-(_pos.x+_es.x)<(_card.x+5),
				_by = _pos.y-_wScroll.y< _card.y,
				_mc='arrowBL',
				_x = _pos.x, _y = _pos.y-_card.y-30;
				if(_bx){
					_mc = 'arrowBr'; // 右下
					_x = _pos.x-_card.x+_es.x;
				}
				if(_by){
					_mc = 'arrowTL'; // 左上
					_y = _pos.y + _es.y+10;
				}
				if(_bx && _by)_mc = 'arrowTR'; // 右上

				this.card.css({'position':'absolute', 'margin': '0', 'left': _x, 'top': _y})

				_cls = _mc;
		}

		this.card.attr('class', 'userCardPop '+_cls);
		this.card.css('visibility', 'visible');
	},

	hCard: function(){
		this.card.css('visibility', 'hidden');

		if(this.style=='win'){ //窗口模式 删除蒙板
			this.style='';
			//this.mask.remove();
			if(jQuery.browser.msie && jQuery.browser.version =='6.0') jQuery(window).unbind('scroll', this.setPos);
		}
	},

	setPos: function(){
		var _t , _card = UserCard_win.card.card;

		if(jQuery.browser.msie && jQuery.browser.version =='6.0'){
			_t = jQuery(document.body).scrollTop();
		}else{
			_t = 0;
		}

		var imb = -(Math.floor(jQuery(_card).height()/2)+30) + _t;
		_card.css('margin-top', imb);
	},

	mEdit: {
		edit: function(_btn){
			this.editBox = jQuery(_btn).parent();
			this.input = this.editBox.find('input');
			this.editBox.addClass('remark-edit');
			this.input.focus();
		},
		submit: function(){
			this.editBox.removeClass('remark-edit');
			var _mark = jQuery.trim(this.input.val()), _this = this;

			jQuery.ajax({
				type: 'GET',
				dataType: 'json', 
				url: '/user/editremark.php',
				data:{tuid:UserInfoCard.uid, remark:_mark},
				success: function(obj){
					if(obj.flag=='001'){
						_this.editBox.find('em').html(_mark);
					}else if(obj.flag=='203'){
						UserInfoCard.hCard();
						Login.toLogin();
					}else{
						alert(obj.content);
						_this.editBox.addClass('remark-edit');
						_this.input.focus();
					}					
				}
			});
		},
		cancel: function(){
			this.editBox.removeClass('remark-edit');
			this.editBox = null;
			this.input = null;
		}

	},

	F: {
		sending:0,
		follow:function(_btn, _uid){
			if(this.sending) return;
			this.sending = 1;
			var _f = this

			jQuery.ajax({
				type: 'GET',
				dataType: 'json',
				data: {act:'p',tuid:_uid},
				url: '/message/follow_add.php',
				success: function(data){
					_f.sending = 0;
					if(data.flag == '001'){
						var _ff = jQuery(_btn).parents('.follow');
						if(_ff)_ff.addClass('followed');
					}else if(data.flag=='203'){
						Login.toLogin();
					}else{
						alert(data.content);
					}					
				}
			});
		},
		cancel:function(_btn, _uid){
			if(this.sending) return;
			this.sending = 1;
			var _f = this;

			jQuery.ajax({
				type: 'GET',
				dataType: 'json',
				data:{tuid:_uid},
				url: '/message/follow_del.php',
				success: function(data){
					_f.sending = 0;
					if(data.flag == '001'){
						var _ff = jQuery(_btn).parents('.follow');
						if(_ff)_ff.removeClass('followed');
					}else{
						alert(data.content);
					}				
				}
			});			
		}
	}
}

UserCard_win = {
	card:UserInfoCard,
	isInit:0,
	init: function(){
		if(this.isInit) return;
		this.isInit=1;
		this.card.createCard();
	},
	getCard: function(_uid){
		this.card.style='win';
		this.init();
		this.card.getCard(_uid);
	}
}



var ReMark = {
	edit: function(_btn, _uid){
		var _par = jQuery(_btn).parent();
		this.mark = _par.find('em:eq(0)');
		var _mark_str = this.mark.html(),
			_nikeName = _par.parent().find('.nameit').html();
		var _form = Prompt.create({
				title: _nikeName,
				btn_sure:{text:'确定'},
				btn_cancel:{text:'取消'},
				content: '添加备注：<input type="" value="'+(_mark_str=='空'?'':_mark_str)+'" id="mark_val" size="25" />',
				onSubmit: function(){
					var _mark = jQuery.trim(jQuery('#mark_val').val());
					if(_mark==''){
							Prompt.alert('备注名不能为空');
							return 0;
					}
					jQuery.getJSON('/user/editremark.php', {tuid: _uid, remark: _mark}, function(obj){
						if(obj.flag=='001'){
							ReMark.setMark(_mark);
						}else if(obj.flag=='203'){
							Login.toLogin();
						}else{
							alert(obj.content);
						}
					});
					return 1;
				}
			});
			jQuery('#mark_val').focus();
	},

	setMark: function(_mark){
		this.mark.html(_mark);
	}
}

/*
 *	userInfo Card END
*/

/**
// Simple Mediator Pattern Implement
var Mediator = new Class({
	Implements: [Events],

	publish: function() {
		var args = Array.from(arguments);
		var topic = args.shift();
		this.fireEvent(topic, args);
	},

	subscribe: function(topic, fn) {
		this.addEvent(topic, fn);
	}
});

Object.append(Mediator, new Mediator());
**/
var Mediator = {
	publish: function(){
		var args = jQuery.makeArray(arguments);
		var topic = args.shift();
		if(this[topic]){
			this[topic].apply(null, args);
		}
		//this.fireEvent(topic, args);
	},
	subscribe: function(topic, fn) {
		this[topic] = jQuery.proxy(fn, this);
		//this.addEvent(topic, fn);
	}
};

/** 干掉  2016-02-17
//小黄条
var Tooptip 
(function(){
	var $ = jQuery;
	Tooptip= {
	flag: null,
	init: function(){
		if(!$('#myMailTool')[0]) return;
		if($('#mail_flagger')[0]) Tooptip.flag = $('#mail_flagger').attr('value');
		$.getJSON( "/user/secretmail/getUnReadCount.php", function(data){
			var mailp = '您有 <span style="color:#f09">' + data + ' </span>封未读密信';
			if(data > 0){
				if(Tooptip.flag !== 1){Tooptip.show(mailp);}
					$('#myMailTool').addClass('myMailNew');
			}
		});

		$(window).bind('resize', function(){
			Tooptip.resize();
		});
	},
	show: function(content) {

		var HTML = '<div class="notice-badge_z" id="mailTipbox">\
			<div class="arrow"><em>◆</em><span>◆</span></div>\
			<em class="close" title="关闭"></em>\
			<div class="con">\
			<a href="/user/secretmail/mailList.php" target="_blank" class="text">'+ content + '</a>\
			</div>\
			</div>';

		var elem = $(HTML);
		var doup = $('div.header_room, div.pheader, div.header');
		setTimeout(function(){
			if(!$('#myMailTool')[0]) return;
			var _left = $('#myMailTool').offset().left, _top = $('#myMailTool').offset().top;
			elem.css('left', _left - 93);
			elem.css('top', _top + $('#myMailTool').outerHeight());
			elem.appendTo($('body'));
		}, 3000);

		elem.bind('click', function(event) {
			var target = $(event.target);

			if (target.hasClass('close')) {
				Tooptip.hide();
			}
		});
	},

	hide: function(cookiehide) {
		var elem = $('#mailTipbox');

		if (elem[0]) {
			elem.remove();
		}
	},

	resize: function () {
		if(!$('#myMailTool')[0] || !$('#mailTipbox')[0]) return;

		var _left = $('#myMailTool').offset().left, _top = $('#myMailTool').offset().top;
		$('#mailTipbox').css({
			'left':  _left - 93,
			'top': _top + $('#myMailTool').outerHeight()
		});
	}
}
})();

Tooptip.init();
**/


// 手机密保，异地登陆提醒
var mobileSafe;
(function(){

var $ = jQuery;
mobileSafe = {
	init: function(){
		var html, elem;
		var that = this;
		var notice;
		//profile jquery未扩展cookie
		try{
			notice = $.cookie('mobBdNotice');
		}catch(e){}
		//var notice = $.cookie('mobBdNotice');

		var dateFormat = function(date){
			var dateArr = date.split(':')
			return dateArr[0]+'年'+dateArr[1]+'月'+dateArr[2]+'日 '+dateArr[3]+':'+dateArr[4];
		}

		if(notice == '1'){
			html = '<p>手机密保提醒：<a href="/user/userinfo/uinfo.php?step=phone">免费绑定手机</a> 有效提升账号安全，快速找回密码。<a class="mobile_notice_safe" href="#">不再提醒</a> <a onclick="mobileSafe.close(); return false" href="#">以后提醒我</a></p>';
		}else if(notice == '2'){
			html = '<p>该帐号曾经在其它地点登录，本机退出登录状态。请留意您的帐号安全。<a onclick="mobileSafe.close(); return false" href="#">关闭提醒</a></p>'
		}else if(notice){
			notice = decodeURIComponent(notice);
			var _arr = notice.split('|');
			var loginInfo = {
				username:	_arr[0],
				date:		dateFormat(_arr[1]),
				lastip:		_arr[2],
				lastcity:	_arr[3],
				ip:			_arr[4],
				city:		_arr[5]
			};
			html = '<p><strong>异常登录提醒：</strong><br />尊敬的用户 '+loginInfo.username+' 您好！</p>\
			<p style="margin-top:8px;">您上次登录的时间：'+loginInfo.date+'<br/>登录地点IP：<em>'+loginInfo.lastip+'（'+loginInfo.lastcity+'）</em></p>\
			<p style="margin-top:8px;">您本次登录IP：'+loginInfo.ip+'（'+loginInfo.city+'）</p>\
			<p style="margin-top:8px;">您的账号可能存在被盗用的风险，为降低盗号风<br />险，建议您马上 <a href="/user/userinfo/uinfo.php?step=phone">绑定密保手机</a>有效提升账号安<br />全，还能快速找回密码。</p>\
			<p style="text-align:right"><a class="mobile_notice_local" href="#">下次不再提醒</a> <a onclick="mobileSafe.close(); return false" href="#">我知道了</a></p>';
		}else{
			return;
		}

		this.show(html);
		elem = $('#noticeMobile');
		if(!elem[0])return;
		elem.find('.close').bind('click', function(_e){
			_e.preventDefault();
			that.close();
		});
		if(elem.find('a.mobile_notice_local')[0]){
		  elem.find('a.mobile_notice_local').bind('click', function(_e){
			  _e.preventDefault();
			  that.send('foot');
		  });
		}
		if(elem.find('a.mobile_notice_safe')[0]){
		  elem.find('a.mobile_notice_safe').bind('click', function(_e){
			  _e.preventDefault();
			  that.send('head');
		  });
		}
	},
	send: function(type){
		$.getJSON( '/auth/cancelNotice.php', {type:type}, function(obj){
			if(!obj.retcode){
				mobileSafe.delCookie('mobBdNotice');
				mobileSafe.close();
			}else{
				alert('操作失败，请重试或关闭');
			}
	  });
	},
	show: function(html){
		var userPanel = $('#userPanel_index, #userPanel');
		if(!userPanel[0]) return;
		
		var div = $('<div/>', {
			id:'noticeMobile',
			'class':'notice_mobile_wrap',
			html: '<div class="inner"><div class="notice_mobile">'+html+'<em class="close" title="关闭"></em></div></div>'
		}).appendTo(document.body);

		setTimeout(function(){
			var _pos = userPanel.offset(), _right = _pos.left + userPanel.width(), _top = _pos.top;
			div.css('left', _right - div.width() - 6);
			if($('#userPanel')[0]){
				div.css('top', _top  + 8);
			}else{
				div.css('top', _top);
			}
		}, 5000);
	},
	close: function(){
		$('#noticeMobile').remove();
		mobileSafe.delCookie('mobBdNotice');
	},
	delCookie: function(name){
		var cval = $.cookie(name);
		if(cval){
			$.cookie(name, 0, {expires:-1, path:'/'});
		}
	}
};
})();

jQuery(function(){
	mobileSafe.init();
});


/**
 * ImageOverlay
 *
 * 查看照片浮层
 *
 * - singleton , 多次 new 只返回同一实例.
 *
 * - 事件：
 * 		show(): 打开浮层
 * 		hide(): 关闭浮层
 * 		click(event): 浮层有点击事件
 *
 * - 主要方法：
 * 		show(src[, width, height]): 显示图片浮层，src 必选，
 * 			width, height 可选，如果没有传入 width/height ，将通过图片 onload 事件获得
 *
 * - 快速使用：
 * 		new ImageOverlay().show(src);
 */
var ImageOverlay;
(function(){
	var $ = jQuery;
	ImageOverlay = function(){
		if (ImageOverlay.instance) {
			return ImageOverlay.instance;
		}
		ImageOverlay.instance = this;
		this.initialize.apply(this, arguments);
	};
	$.extend(ImageOverlay.prototype, {
		HTML: '<div class="bigShowbox">' +
			'<div class="mask"></div>' +
			'<div class="bigShow">' +
			'<em title="关闭" class="close">关闭</em>' +
			'<div class="imgbox">' +
			'<img />' +
			'</div>' +
			'</div>' +
			'</div>',

		MAX_WIDTH: 658,

		MAX_HEIGHT: 428,

		initialize: function() {
			
			this.elem = this._create();
			this._attacheEvent();
			
		},

		show: function(src, width, height) {
			var elem = this.elem;
			var img = this.elem.find('img');

			if (width && height) {
				this.scaleImage(width, height);

			} else {
				this.getImageSize(src, this.scaleImage);
			}

			img.attr('src', src);
			elem.css('display', 'block');
			this.justifyPos();
			//this.fireEvent('show');
		},

		hide: function() {
			var elem = this.elem;
			var img = elem.find('img');

			elem.css('display', 'none');
			img.removeAttr('src');
			img.removeAttr('width');
			img.removeAttr('height');
			//this.fireEvent('hide');
		},

		justifyPos: function() {
			var _height = this.elem.height();
			var _scrollTop = $(window).scrollTop();
			var _wheight = $(window).height();

			this.elem.css('top', Math.max(_scrollTop + (_wheight - _height) / 2, 0));
		},

		scaleImage: function(width, height) {
			var maxWidth = this.MAX_WIDTH;
			var maxHeight = this.MAX_HEIGHT;
			var ratio = width / height;
			var canvasRatio = maxWidth / maxHeight;
			var image = this.elem.find('img');

			if (width <= maxWidth && height <= maxHeight) {
				// do nothing

			} else if (ratio >= canvasRatio) {
				width = maxWidth;
				height = width / ratio;

			} else {
				height = maxHeight;
				width = height * ratio;
			}

			image.attr('width', width);
			image.attr('height', height);
		},

		getImageSize: function(src, callback) {
			var img = new Image();

			img.onload = function() {
				callback && callback(this.width, this.height);
				this.onload = null;
			}
			img.src = src;
		},

		_create: function() {
			var div = document.createElement('div');
			var elem;

			div.innerHTML = this.HTML;
			elem = div.firstChild;
			document.body.appendChild(elem);
			return $(elem);
		},

		_attacheEvent: function() {
			this.justifyPos = $.proxy( this.justifyPos, this);
			this.scaleImage = $.proxy(this.scaleImage, this);

			this.elem.bind('click', $.proxy(this._clickHandler, this));
		},

		_clickHandler: function(event) {
			var target = $(event.target);

			//this.fireEvent('click', event);
			if(target.hasClass('close')) {
				this.hide();
			}
		}
	});

})();



/**
 * Search Suggest 昵称联想
 */

;(function(win) {
var $  = jQuery;
var INPUT_ID = '#searchInput';
var SUGGEST_ID = '#searchThink';
var elem = $(SUGGEST_ID);

if (!$(INPUT_ID)[0] || !$(SUGGEST_ID)[0]) {
	return;
}

var suggest_index = -1;
var timer = null;

var showSuggest = function(list) {
	var str = '';

	$.each(list, function(i,item) {
		str += '<a>' + item + '</a>'
	});
	
	elem.find('.s-list').html(str);
	elem.fadeIn(200);
	elem.addClass('search-think-open');
	suggest_index = -1;
};

var hideSuggest = function() {
	elem.fadeOut(200);
	elem.removeClass('search-think-open');
	//$(SUGGEST_ID).css('display', 'none');
};

var navigateSuggest = function(direct) {

	/*
	if (elem.css('display') != 'block') {
		return;
	}*/

	if(elem.hasClass('search-think-open')) return;

	var list = elem.find('.s-list a');
	var length = list.length;
	var current;

	/*
	if (current = list.eq(suggest_index)) {
		current.removeClass('select');
	}
	*/

	suggest_index = suggest_index + (direct > 0 ? 1 : -1);
	if (suggest_index < 0) {
		suggest_index = length -1;

	} else if (suggest_index >= length) {
		suggest_index = 0;
	}

	//list.eq(suggest_index).addClass('select');
	$(INPUT_ID).val( list.eq(suggest_index).html() );
};

var getSuggest = function(word) {
	$.getJSON( '/api/su.php?wd=' + encodeURIComponent(word), getSuggestBack);
};

var getSuggestBack = function(data) {
	if (data.flag == '001' && data.content.s.length > 0 &&
		$(INPUT_ID).val() == data.content.q) {
		showSuggest(data.content.s);

	} else {
		hideSuggest();
	}
};

var suggest = function(word) {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
	timer = setTimeout(function() {
		getSuggest(word);
		timer = null;
	}, 200);
};

$(INPUT_ID).on('keyup', function(event) {

	var input = $(event.target);
	var code = event.which;

	// down arrow
	if (code == 40) {
		navigateSuggest(1);

	// up arrow
	} else if (code == 38) {
		navigateSuggest(-1);

	} else if (code == 27 || input.val().length < 1) {
		hideSuggest();

	} else {
		suggest(input.val());
	}

}).focus(function(){
	if(elem && elem.find('.s-list a').length>1){
		elem.fadeIn(200);
		elem.addClass('search-think-open');
	}

	if($(this).val() == '昵称'){
		$(this).val('').removeClass('input-def');
	}
}).blur(function(){
	if(elem){
		setTimeout(function(){
			elem.fadeOut(200);
			elem.removeClass('search-think-open');
		}, 200);		
	}
	if($(this).val() == ''){
		$(this).val('昵称').addClass('input-def');
	}
});

$(SUGGEST_ID).find('.s-list').on('click', function(event) {
	var target = $(event.target);

	if ( target.is('a') ) {
		$(INPUT_ID).val(target.html());
		$(INPUT_ID).parents('form').submit();
	}
});
$(SUGGEST_ID).find('.s-more').on('click', function(){
	$(INPUT_ID).parents('form').submit();
})

})(window);



/**
*	Image Uploader
*/

var PicUploader;
(function(){
 var $ = jQuery;
PicUploader = function(){
	this.initialize.apply(this, arguments);
}; 

$.extend(PicUploader.prototype, {
	CALLBACK_URL: location.protocol + '//' + document.domain + '/profile/transferStation.html',

	options: {
		// hosts 122.70.141.143 live_pic.com devpic.6rooms.com
		api: location.protocol + (location.hostname.indexOf('dev.v.6.cn') > -1 ? '//live_pic.com/api/uploadForGeneral.php' : '//pic.v.6.cn/api/uploadForGeneral.php'),
		SWF: '/apple/flashComponent/FileIO2.1.swf',
		/*
		1001 微博相关（报告个人和粉丝吧、家族）
		1002 个人相册类
		1003 个人头像类（网页上传和客户端上传）
		1004  Im聊天类
		1005  房间聊天类
		1006  家族类
		1007  海报类
		1008  账号辅助类（交易图片）
		1009  自定义礼物类
		

		'c1'=> (350, 250), 	//上传头像第一步
		'c2'=> (128, 128), 	//上传头像第二步
		'c3'=> (176, 108), 	//前台家族图标上传
		'c4'=> (50, 32), 		//自定义礼物
		'c5'=> (240, 180), 	//生成主播直播海报
		's1'=> (70, 70),		//im聊天小图后缀
		's2'=> (228, 166),	//相册,微博小图后缀
		's3'=> (253, 195),	//主播海报小图后缀，制片人海报小图后缀
		'b1'=> (980, 550),	//微博,相册大图后缀
		*/
		param: {},

		// (filename)
		onReady: null,

		// no arguments
		onStart: null,

		onProgress: null,//之前名字onprogress，写错了，已修复

		// (resultData)
		onComplete: null,

		xhr: null,
		Flash: null,
		progress: 0
	},
	fireEvent: function(fn, args){
		var _fn = this.options['on'+fn];
		if(_fn) {
			_fn.call(this, args);
		}
	},

	initialize: function(fileinput, option) {
		for(var p in option){
			var _fn = option[p];
			
			//不在这里代理this了，改到fireEvent中代理
			//解决实例不能循环创建的BUG
			//if($.type(_fn)=='function'){
				//_fn = $.proxy( _fn, this);
			//}
			this.options[p] = _fn;
		}

		
		this.fileinput = $(fileinput);
		this._callbackFun = String.uniqueID();
		this._changeHandler = $.proxy(this._changeHandler, this);
		this._back = $.proxy(this._back, this);
		this._uploadProgress = $.proxy(this._uploadProgress, this);
		this._uploadDone = $.proxy(this._uploadDone, this);
		this._revitalize();

		if(option.onProgress !== null && $.browser.msie){ //flash进度条上传
			swfobject.embedSWF(this.options.SWF + '?_=' + new Date().getTime(), this.fileinput.attr('id'), 
					'321', '123', '10', '', {
				'type': 'image',
				'userfile': this.fileinput.attr('name'),
				'url': encodeURIComponent(this.options.api),
				'id': this.fileinput.attr('id')
			}, {
				'wmode': 'transparent',
				'AllowScriptAccess': 'always'
			});
			this.fileinput.remove(); //删掉dom
			this.options.Flash = swfobject.getObjectById(this.fileinput.attr('id'));

			//flash直接调用的方法
			var that = this;
			window.openBrowse = function(id, filename, filesize){
				that.options.Flash.startUpload(that.options.api, that._serialize(that.options.param))
			}	
			window.upLoadProgress = function(id, loaded, total){
				that.flashUpload(loaded, total);
			}
			window.uploadCompleteData = function(id, data){
				data = that.parseResponseText(data);
				that._back(data);
			}	
			window.Error = function(id, errorstr){
				alert(errorstr);
			}	
		}
	},

	upload: function() {
		if(this.options.onProgress && !$.browser.msie){ 
			this.progressUpload();
		}else if(!this.options.onProgress){ //form上传
			var fileinput = this._revitalize();

			var form = this._createForm($.extend(this.options.param, {
				callbackUrl: this.CALLBACK_URL,
				callbackFun: 'window.parent.' + this._callbackFun
			}));
			form.append(fileinput);
			form.appendTo(document.body);
			window[this._callbackFun] = this._back;
			
			form.submit();
			this.fireEvent('Start');
		}
	},

	progressUpload: function(){
		var param = this.options.param, fd = new FormData();

			fd.append('file', this.fileinput[0].files[0]);
			for (var p in param) {
				fd.append(p, param[p]);
			}

	        var xhr = this.xhr = new XMLHttpRequest();
	        xhr.upload.onprogress = this._uploadProgress;
	        xhr.onreadystatechange = this._uploadDone;
	        xhr.open("POST", this.options.api);
	        xhr.send(fd);
	},	

	_uploadProgress: function(evt){
        this.fireEvent('Progress', evt);
	},

	_uploadDone: function(){
		var xhr = this.xhr;
		if (xhr.readyState == 4 && xhr.status == 200) {
			var data = this.parseResponseText(xhr.responseText);
			this.fireEvent('Complete', data);
		}
	},

	flashUpload: function(loaded,total){
		var evt = {};
		evt.lengthComputable = 1;
		evt.loaded = loaded;
		evt.total = total;
		this.fireEvent('Progress', evt);
	},

	parseResponseText: function(responseText) {
		var result;
		var	rresponseBodyCall = /\(\s*(.*?)\s*\)\;\s*$/m;
		var	rresponseBodyRedirect = /\&json=(.*)\&/;		

		if (result = (rresponseBodyCall.exec(responseText) || 
			rresponseBodyRedirect.exec(responseText))) {
			return $.parseJSON(result[1]);

		} else {
			return $.parseJSON(responseText);
		}		
	},

	checkType: function(filename, whitelist) {
		var extension;
		return !!(filename && (extension = /\.(\w+)$/.exec(filename)) &&
			whitelist.join().toLowerCase().indexOf(extension[1].toLowerCase()) > -1)
	},
	_getFlash: function() {
		return this.fileinput;
	},

	_serialize: function(paramobj) {
		var str = '';

		for (var p in paramobj) {
			str += p + '=' + paramobj[p] + '&';
		}
		return str.slice(0, str.length - 1);
	},	

	_back: function(data) {
		this.fireEvent('Complete', data);
	},

	_changeHandler: function() {
		this.fireEvent('Ready', this.fileinput.val())
	},

	_createForm: function(param) {
		var wrapper = $('<div/>');
		var html = '<form enctype="multipart/form-data" method="post" ' +
			'target="emptyIframe" action=" ' + this.options.api + '" style="display:none;">';

		$.each(param, function(k, v) {
			html += '<input type="hidden" name="' + k + '" value="' + v + '" />';
		});

		wrapper.html(html);
		return wrapper.find('form');
	},

	_revitalize: function() {
		var predecessor = this.fileinput;
		var successor = predecessor.clone();
			
		successor.on('change', this._changeHandler);
		predecessor.replaceWith(successor);
		this.fileinput = successor;

		return predecessor;
	}
})
})();



/**
	Mask 页面蒙板
	_poc 自定义透明度，默认0.3
**/
var Mask;

(function(){
var $  = jQuery;
Mask = {
	ie6:($.browser.msie && $.browser.version =='6.0'),
	create: function(_opc){
		if(this.box) this.remove();
		this.box = $('<div/>', {
			'id':'page_mask',
			'class':'promptbg'
		}).css({
			visibility:'visible',
			width: '100%',
			height:$(window).height(),
			position: (this.ie6&&'absolute'||'fixed'),
			top: 0,
			left: 0,
			display:'block',
			zIndex: 999,
			background: '#000',
			opacity: /\D/.test(_opc)&&0.3||_opc
		}).appendTo(document.body);
		$(window).bind('resize', this.set_size);
		if(this.ie6){
			this.set_pos();
			$(window).bind('scroll', this.set_pos);
		}
	},
	remove: function(){
		if(!this.box) return;
		$(window).unbind('resize', this.set_size);
		$(window).unbind('scroll', this.set_pos);
		this.box.remove();
		this.box=null;
	},
	set_size: function(){
		Mask.box.css('height', $(window).height());
	},
	set_pos: function(){ // for ie6
		Mask.box.css('top', $(window).scrollTop() );
	}
}
})();

/*
//判断签约主播，临时
用户cookie种完后直接判断_puser.sign即可
var __sign;
(function(){
	var $ = jQuery;
	var is_request = 0;
	__sign = {
		is_sign:0,
		init:function(callback){
			var self = this;
			if(is_request){
				callback && callback(this.is_sign);
				return;
			};
			if(_puser.sign){
				self._check(_puser.sign,callback);
			}else{
				jQuery.getJSON('/user/checkRole.php',function(obj){
					self._check(obj.content,callback);
				});
			}
		},
		_check:function(data,callback){
			is_request = 1;
			this.is_sign = (data == '1')?1:0;
			callback && callback(this.is_sign);
		}
	}
})();
*/


/**
var Fn6 = {
	get_url : function(_html){
		return _html.replace(/(?:http:\/\/)?((?:[\w.]+\.)?6\.cn(?:\/[\w/#%&=.?+-]+)?)/gim, '<a href="https://$1" target="_blank">$1</a>');
	}
} 
**/

/*
小能客服系统
文档：http://doc3.xiaoneng.cn/
配置：
	基础配置（必填）：
	{
		siteid: '', //企业id（必填）
		sellerid: '', // 商户id，秀场id
		settingid: '' // 接待组id（必填）
	}
	用户信息字段：
	{
		uid: '', //用户id
		uname:'', //用户名
		isvip: 0, //vip用户
		userlevel: 1 //用户等级
	}
	功能性字段：
	{
		itemid: 123123, //房间号
		itemparam: 'pc', //拓展参数，一般用于区分不同设备的拓展参数
		orderid: '' //订单号，一般用于支付
		orderprice: 100, //订单价格
		...
	}
	
	1、基础信息字段为必传参数。
	2、用户信息字段和功能性字段用户可以根据自己的实际业务情况传参；
	3、传递的所有参数均为字符串类型，不能为null；

 */
(function(){
	//封装下小能SDK
	window.NTKF_PARAM = {
		siteid: 'kf_10195',
		settingid: 'kf_10195_1523246787962',
		erpparam: jQuery.toJSON({
			refer: encodeURIComponent(location.href), //来路url
			fromuid: window.page && page.tpl == '2016' ? page.rid : 0 //主播UID
		})
	};

	var SRC = '//dl.ntalker.com/js/xn6/ntkfstat.js?siteid=' + NTKF_PARAM.siteid;
	var XNService = function(config){
		this._sdk = null;
		this._callback = [];
		this._config = config || {};

		this.getConf();//读取最终的配置文件
		this._loadSdk(); //加载sdk
	};

	XNService.prototype = {
		on: function(event, callback){
			this._callback.push([event, callback]);
		},
		trigger: function(event){
			var callback = this._callback;
			var args = [].slice.call(arguments);
            args.shift();

			for(var i=0; i<callback.length; i++){
				if(callback[i][0] == event){
					callback[i][1] && callback[i][1].apply(this, args);
				};
			};
		},
		open: function(id){
			this._sdk.im_openInPageChat(id);
			this.trigger('onOpen');
		},
		close: function(id){
			this.trigger('onClose');
		},
		destroy: function(){
			this._sdk = this._callback = this._config = null;
			this.trigger('onDestroy');
		},
		getConf: function(){
			return jQuery.extend(window.NTKF_PARAM, this._config);
		},
		_loadSdk: function(){
			if(typeof NTKF == 'undefined'){
				$LAB.script(SRC).wait(jQuery.proxy(this, '_sdkReady'));
			}else{
				//同步状态下，可能后绑定的事件来不及触发
				setTimeout(jQuery.proxy(this, '_sdkReady'), 0);
			};
		},
		_sdkReady: function(){
			if(!this._sdk){
				try{
					this._sdk = NTKF;
					this.trigger('onReady');
				}catch(e){
					console.log(e.message);
					setTimeout(jQuery.proxy(this, '_loadSdk'), 1000);
				};
			};
		}
	};

	window.XNService = XNService;
	
	//客服列表
	var LIST_WRAP = '<div class="service-list-wrap service-list-{size}"></div>';
	var LIST_TPL = '<a href="#" data-id={id}>{name}</a>';
	var NAMESPACE = '.xnservice';
	var LODING_CLS = 'service-loading';

	//默认位置和偏移配置
	var DEFAULT_CONF = {
		isArrow:0,//是否显示箭头，默认不显示
		size: 'default', // 列表尺寸，便于CSS控制列表样式
		offsetX: 0, //水平方向偏移
		offsetY: 5, // 垂直方向偏移
		alignX: 'center', //水平方向对齐方式
		alignY: 'bottom', // 垂直方向对齐方式
		appendTo: document.body //加载到哪个DOM，根据哪个DOM定位

	};

	var XNServiceList = function(target, data, config){
		this._vis = 0;
		this._data = data || {};
		this._config = jQuery.extend({}, DEFAULT_CONF, config || {});
		this.listbox = null;
		this.target = jQuery(target);

		this.target.on('click' + NAMESPACE, jQuery.proxy(this, '_buttonClickHanlder'));
	};

	XNServiceList.prototype = {
		visible: function(){
			if(!this.listbox) {
				return this._loadList();
			};
			
			if(!this._vis){
				this.setpos();
				this.listbox.css({visibility:'visible', zIndex: 9999});

				this._vis = 1;
				this._attchDocumentEvent();
			};
		},
		hidden: function(){
			if(this._vis){
				this.listbox.css({visibility:'hidden', zIndex: -1});

				this._vis = 0;
				this._dettachDocumentEvent();
			};
		},
		toogle: function(){
			this[ this._vis ? 'hidden': 'visible']();
		},
		setpos: function(){
			var pos = this.target.position();
			var targetWidth = this.target.outerWidth(true);
			var targetHeight = this.target.outerHeight(true);
			var listWidth = this.listbox.outerWidth(true);
			var listHeight = this.listbox.outerHeight(true);
			var offsetX = this._config.offsetX;
			var offsetY = this._config.offsetY;

			// 对齐方式
			var align = {
				top: pos.top - listHeight - offsetY,
				bottom: pos.top + targetHeight + offsetY,
				left: pos.left + offsetX,
				right: pos.left + targetWidth - listWidth - offsetX,
				center: pos.left + (targetWidth / 2) - (listWidth / 2) + offsetX
			};

			this.listbox.css({top: align[this._config.alignY], left: align[this._config.alignX] });
		},
		// 根据权限，获取客服列表
		_loadList: function(){
			var self = this;
			var uid = _puser.uid || 0;
			var uname = _puser.nickname ? _puser.nickname + '('+ uid + ')' : '';

			this.target.addClass(LODING_CLS);
			jQuery.getJSON('/api/getCustomServiceList.php', {uid: uid, t: +new Date}).done(function(json){
				if(json.flag == '001'){
					var htmlarr = [];
					//增加service-list-{size}样式，便于CSS灵活控制
					var tpl = LIST_WRAP.replace('{size}', self._config.size);

					jQuery.each(json.content.list, function(index, data){
						htmlarr.push(self._parseList(data));
					});
					if(self._config.isArrow){
							htmlarr.push('<em class="arrow"></em>');
						}

					self.listbox = jQuery(tpl).html(htmlarr.join('')).on('click', 'a', function(e){
						e.preventDefault();
						var a = jQuery(this);
						var settingid = a.attr('data-id');
						var instance = self._instance;
						
						// if(!confirm('您是否要联系在线客服（'+ a.text()+'）？')){
						// 	return;
						// };
						
						if(!instance){
							instance = self._instance = new XNService(jQuery.extend({
								uid: uid,
								uname: uname
							}, self._data ));

							instance.on('onReady', function(){
								instance.open(settingid);
							});
						}else{
							instance.open(settingid);
						};

						self.hidden();
					}).appendTo(self._config.appendTo);
					
					self.visible();
					self.target.removeClass(LODING_CLS);
				}else{
					alert(json.content);
				};
			});
		},
		_parseList: function(data){
			return LIST_TPL.replace('{id}', data.id).replace('{name}', data.name);
		},
		_buttonClickHanlder: function(e){
			e.preventDefault();
			if(!jQuery(e.target).hasClass(LODING_CLS)){
				this.toogle();
			};
		},
		_attchDocumentEvent: function(){
			jQuery(document).on('mousedown' + NAMESPACE, jQuery.proxy(this, '_documentEventHanlder'));
		},
		_dettachDocumentEvent: function(){
			jQuery(document).off('mousedown' + NAMESPACE);
		},
		_documentEventHanlder: function(e){
			var target = e.target;
			if(target == this.target[0] || jQuery.contains(this.target[0], target) || 
				jQuery.contains(this.listbox[0], target) || 
				this.listbox[0] == target) return;
			this.hidden();
		}
	};

	window.XNServiceList = XNServiceList;

	// 用例
	// var list = new XNServiceList('#demo', {
	// 	// 根据不同页面，传不同字段
	// 	// 例如充值页面传 orderid等
	// 	// 字段传递给小能客服使用
	// });

	// var list2 = new XNServiceList('#demo2', null, {
	// 	alignX: 'right',
	// 	alignY: 'top',
	// 	appendTo: jQuery('#wrap')
	// });
})();

//监测用
if(location.hash=='#regTest'){
	Login.toLogin(1);
}






