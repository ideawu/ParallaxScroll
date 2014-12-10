/**
 * @author: ideawu
 * @link: https://github.com/ideawu/ParallaxScroll
 */
var Guesture = function(dom){
	/*
	var div = $('<div></div>');
	div.css({
		top: 20,
		left: 0,
		color: '#fff',
		'position': 'absolute',
		'background': '#333',
		opacity: 0.5
	});
	$('body').append(div);
	console.log = function(){
		var args = Array.prototype.slice.call(arguments, 0);
		div.prepend(args.join(' ') + '<br/>');
	}
	*/
	if(typeof dom == 'object' && dom.selector){
		dom = dom[0];
	}
	if(typeof dom == 'string'){
		dom = document.querySelector(dom);
	}

	var self = this;
	self.dom = dom;
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

		function Quint(steps){
			var min = 1000 / 500;
			var max = 1000 / 30;
			var c = max - min;
			var x = 0;
			this.delay = function(){
				if(x++ > steps){
					return 0;
				}
				var t = x/steps;
				var y = c * t*t*t*t*t + min;
				return y;
			}
		}
		
		self.start = function(steps, tick){
			self.stop();
			self._tick = tick;
			self.running = true;
			method = new Quint(steps);
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

	self.do_swipe = function(r){
		r.dx *= 1000 / r.duration / 6;
		r.dy *= 1000 / r.duration / 6;
		if(Math.abs(r.dx) < 1 && Math.abs(r.dy) < 1){
			return;
		}
		var distance = Math.round(Math.sqrt(r.dx * r.dx + r.dy * r.dy));
		//var steps = !r.duration? 1 : Math.round(distance / r.duration * 15);
		var steps = 100;
		r.dx = r.dx / steps;
		r.dy = r.dy / steps;

		console.log('swipe begin.', 'steps', steps, 'distance', distance, 'duration', r.duration);
		event_bus.start(steps, function(){
			self.onmove(r);
		});
		
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
		
		self.dom.addEventListener('mousemove', self._mousemove, true);
		self.dom.addEventListener('touchmove', self._mousemove, true);
		
		self.dom.addEventListener('mouseup', self._mouseup, true);
		//self.dom.addEventListener('mouseleave', self._mouseup, true);
		self.dom.addEventListener('touchend', self._mouseup, true);
		self.dom.addEventListener('touchcancel', self._mouseup, true);
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
		self.dom.removeEventListener('mousemove', self._mousemove, true);
		self.dom.removeEventListener('touchmove', self._mousemove, true);
		
		self.dom.removeEventListener('mouseup', self._mouseup, true);
		//self.dom.removeEventListener('mouseleave', self._mouseup, true);
		self.dom.removeEventListener('touchend', self._mouseup, true);
		self.dom.removeEventListener('touchcancel', self._mouseup, true);

		//console.log('mouseup', JSON.stringify(self.events.items), get_pos(e));
		var r = calc_delta();
		if(r && self.onmove != null){
			var speed = Math.sqrt(r.dx*r.dx + r.dy*r.dy) / r.duration;
			console.log('speed', speed);
			if(speed > 0.4){
				// swipe
				self.do_swipe(r);
			}else{
				self.onmove(r);
			}
		}
	}

	self._listen = function(){
		//self.dom.on('dragstart', function(e){e.preventDefault();});
		self.dom.addEventListener('touchstart', self._mousedown, true);
		self.dom.addEventListener('mousedown', self._mousedown, true);
	}

	self._listen();
}


