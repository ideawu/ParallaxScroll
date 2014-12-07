/**
 * @author: ideawu
 * @link: http://www.ideawu.com/
 * simulate swipe event
 */
var Swipe = function(dom){
	var s = this;
	var self = this;
	self.dom = dom;
	self.onstart = null;
	self.onswipe = null;
	self.onend = null;
	self.status = null;
	self.event = {dx:0, dy:0, preventDefault: function(){}};
	
	self.last_pos = {x: 0, y: 0};
	
	self.mousemove = function(e){
		//console.log(e);
		e.preventDefault();
		var oe = e.originalEvent;
		e.pageX = oe.pageX;
		e.pageY = oe.pageY;
		e.clientX = oe.clientX;
		e.clientY = oe.clientY;

		var pos = {x: e.pageX, y: e.pageY};
		e.dx = pos.x - self.last_pos.x;
		e.dy = pos.y - self.last_pos.y;
		self.last_pos = pos;

		e.dx = isNaN(e.dx)? 0 : e.dx;
		e.dy = isNaN(e.dy)? 0 : e.dy;
		if(e.dx == 0 && e.dy == 0){
			return;
		}

		if(e.type == 'touchmove'){
			// iOS fix
			e.originalEvent = e;
			e.preventDefault = function(){};
		}
		s.trigger(e);
	}

	self.listen = function(){
		self.dom.bind('mousewheel DOMMouseScroll', function(e){
			self.trigger(e);
		});
		self.dom.on('dragstart', function(e){e.preventDefault();});
		self.dom.bind('mousedown touchstart', function(e){
			self.last_pos = {x: e.pageX, y: e.pageY};
			self.dom.bind('mousemove touchmove', self.mousemove);
			self.dom.bind('mouseup mouseleave touchend', function(e){
				if(e.type == 'mouseleave'){
					var offset = self.dom.offset();
					if(e.pageX > offset.left && e.pageX < offset.left + self.dom.width()
						&& e.pageY > offset.top && e.pageY < offset.top + self.dom.height()){
						return;
					}
				}
				self.dom.unbind('mousemove touchmove', self.mousemove);
				self.dom.unbind('mouseup mouseleave touchend');
			});
		});
	}
	
	self.listen();

	self.timer = null;
	function settimer(){
		if(s.timer != null){
			clearTimeout(s.timer);
		}
		s.timer = setTimeout(function(){
			s.status = null;
			clearTimeout(s.timer);
			if(s.onend != null){
				s.event = {dx:0, dy:0, preventDefault: function(){}};
				s.onend(s.event);
			}
		}, 150);
	}

	// be called on mousewheel event
	s.trigger = function(e){
		if(e.type == 'mousewheel' || e.type == 'DOMMouseScroll'){
			var oe = e.originalEvent;
			e.pageX = oe.pageX;
			e.pageY = oe.pageY;
			e.clientX = oe.clientX;
			e.clientY = oe.clientY;
			e.dx = oe.wheelDeltaX || 0;
			e.dy =  oe.wheelDelta || oe.wheelDeltaY || -oe.detail * 40;
		}

		s.event = e;
		if(s.status == null){
			s.status = 'start';
			if(s.onstart != null){
				s.onstart(s.event);
			}
		}
		settimer();
		if(s.onswipe != null){
			s.onswipe(e);
		}
	}
}


