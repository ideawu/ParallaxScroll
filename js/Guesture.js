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

	function Animation(){
		var self = this;
		var timer = null;
		var method;
		self._tick = null;
		self.onend = null;
		self.oncancel = null;

		self.running = false;
		
		function Linear(steps){
			var min = 1000 / 100;
			var max = 1000 / 60;
			var delta = (max - min) / steps;
			var delay = min;
			this.delay = function(){
				if(steps -- <= 0){
					return 0;
				}
				var r = delay;
				delay += delta;
				return Math.round(r);
			}
		}
		
		self.start = function(steps, tick){
			self.stop();
			self._tick = tick;
			self.running = true;
			method = new Linear(steps);
			timer = setTimeout(fire_event, method.delay());
		}
			
		self.stop = function(){
			if(timer){
				clearTimeout(timer);
				timer = null;
			}
			self.running = false;
		}
		
		self.cancel = function(){
			self.stop();
			if(self.oncancel){
				self.oncancel();
			}
		}

		function fire_event(){
			var delay = method.delay();
			if(delay == 0){
				self.stop();
				if(self.onend){
					self.onend();
				}
				return;
			}
			if(self._tick){
				self._tick();
			}
			timer = setTimeout(fire_event, delay);
		}
	}
	
	var event_bus = new Animation();
	event_bus.onend = function(){
		self.events.clear();
		console.log('swipe end.');
	}
	event_bus.oncancel = function(){
		self.events.clear();
		console.log('swipe end(force).');
	}

	self._mousedown = function(e){
		e.preventDefault();
		if(event_bus.running){
			event_bus.cancel();
		}
		if(e.touches && e.touches.length > 1){
			return;
		}
		var pos = get_pos(e);
		self.events.push(pos);
		self.dom.bind('mousemove touchmove', self._mousemove);
		self.dom.bind('mouseup mouseleave touchend touchcancel', function(e){
			self.dom.unbind('mousemove touchmove', self._mousemove);
			self.dom.unbind('mouseup mouseleave touchend touchcancel');
			self._mouseup(e);
		});
	}
	
	self._mousemove = function(e){
		e.preventDefault();
		var pos = get_pos(e);
		self.events.push(pos);
		//console.log('mousemove', JSON.stringify(self.events.items), pos);
		var r = calc_delta();
		if(r && self.onmove != null){
			self.onmove(r);
		}
	}
	
	self._mouseup = function(e){
		e.preventDefault();
		var pos = get_pos(e);
		//console.log('mouseup', JSON.stringify(self.events.items), pos);
		var r = calc_delta();
		if(r && self.onmove != null){
			var speed = Math.sqrt(r.dx*r.dx + r.dy*r.dy) / r.duration;
			console.log('speed', speed);
			if(speed > 0.2){
				// swipe
				self.do_swipe(r);
			}else{
				self.onmove(r);
			}
		}
	}

	self.do_swipe = function(r){
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

		console.log('swipe begin.', steps, distance);
		event_bus.start(steps, function(){
			self.onmove(r);
		});
		
	}

	self._listen = function(){
		//self.dom.on('dragstart', function(e){e.preventDefault();});
		self.dom.bind('mousedown touchstart', self._mousedown);
	}

	self._listen();
}


