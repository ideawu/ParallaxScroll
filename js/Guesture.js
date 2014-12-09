/**
 * @author: ideawu
 * @link: https://github.com/ideawu/ParallaxScroll
 */
var Guesture = function(dom){
	var s = this;
	var self = this;
	self.dom = $(dom);
	self.onmove = null;
	self.status = null;
	self.event = {dx:0, dy:0, preventDefault: function(){}};
	
	function FIFO(capacity){
		var self = this;
		self.items = [];
		self.capacity = capacity || 100000;
		self.clear = function(){
			self.items = [];
		}
		self.push = function(a){
			self.items.push(a);
			if(self.items.length > self.capacity){
				self.items.shift();
			}
			//console.log(self.items.length);
		}
	}

	function get_pos(e) {
		var pos = {};
		if(e.targetTouches && e.targetTouches.length > 0) {
			pos.x = e.targetTouches[0].clientX;
			pos.y = e.targetTouches[0].clientY;
		} else {
			pos.x = e.clientX;
			pos.y = e.clientY;
		}
		pos.time = e.timeStamp;
		return pos;
	}
	
	self.events = new FIFO(3);

	self.listen = function(){
		//self.dom.on('dragstart', function(e){e.preventDefault();});
		self.dom.bind('mousedown touchstart', self.mousedown);
	}
	
	function calc_delta(){
		if(self.events.items.length < 2){
			return;
		}
		var s = self.events.items[self.events.items.length - 2];
		var e = self.events.items[self.events.items.length - 1];
		if(!s){
			s = e;
		}
		var r = {};
		r.dx = e.x - s.x;
		r.dy = e.y - s.y;
		r.duration = e.time - s.time;
		return r;
	}
	
	var timer = null;

	self.mousedown = function(e){
		e.preventDefault();
		if(timer){
			console.log('swipe end(force end)');
			clearTimeout(timer);
			timer = null;
			self.events.clear();
		}
		if(e.touches && e.touches.length > 1){
			return;
		}
		var pos = get_pos(e);
		self.events.push(pos);
		self.dom.bind('mousemove touchmove', self.mousemove);
		self.dom.bind('mouseup mouseleave touchend touchcancel', function(e){
			self.dom.unbind('mousemove touchmove', self.mousemove);
			self.dom.unbind('mouseup mouseleave touchend');
			self.mouseup(e);
		});
	}
	
	self.mousemove = function(e){
		e.preventDefault();
		var pos = get_pos(e);
		self.events.push(pos);
		//console.log('mousemove', JSON.stringify(self.events.items), pos);
		var r = calc_delta();
		if(r && self.onmove != null){
			self.onmove(r);
		}
	}
	
	self.mouseup = function(e){
		e.preventDefault();
		var pos = get_pos(e);
		//console.log('mouseup', JSON.stringify(self.events.items), pos);
		var r = calc_delta();
		if(r && self.onmove != null){
			self.do_swipe(r);
		}
	}
		
	self.do_swipe = function(r){
		// TODO: queuing swipe events
		r.dx *= 3;
		r.dy *= 3;
		if(Math.abs(r.dx) < 1 && Math.abs(r.dy) < 1){
			return;
		}
		var distance = Math.sqrt(r.dx * r.dx + r.dy * r.dy);
		var steps = r.duration;
		var dx = r.dx / steps * (Math.abs(r.dx) / distance);
		var dy = r.dy / steps * (Math.abs(r.dy) / distance);

		r.dx = dx;
		r.dy = dy;

		console.log('swipe begin', steps, distance);
		
		var interval = 1000 / 60; // TOOD: 根据算法动态改变 interval
		function fire_event(){
			if(steps-- <= 0){
				console.log('swipe end');
				clearTimeout(timer);
				timer = null;
				self.events.clear();
				return;
			}
			//console.log(steps, r);
			if(self.onmove != null){
				self.onmove(r);
			}
			timer = setTimeout(fire_event, interval);
		}
		timer = setTimeout(fire_event, interval);
	}

	self.listen();
}


