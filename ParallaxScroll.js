function ParallaxScroll(dom){
	var self = this;
	self.dom = $(dom);
	self.x = 0;
	self.y = 0;
	self.width = parseInt($(dom).width());
	self.height = parseInt($(dom).height());
	self.max_width = self.width;
	self.max_height = self.height;
	self.scale = self.width / 639;
	ParallaxScroll.scale = self.scale;

	self.layers = [];
	
	self.load = function(confs){
		for(var i in confs){
			var layer = new Layer(self);
			layer.load(confs[i]);
			self.layers.push(layer);
			self.dom.append(layer.dom);
		}
		self.render();
	}
	
	// 实现 Sprite 接口
	self.render = function(){
		for(var i in self.layers){
			var layer = self.layers[i];
			layer.render();
			self.max_width = Math.max(self.max_width, layer.width);
			self.max_height = Math.max(self.max_height, layer.height);
		}
	}
	
	self.move = function(dx, dy){
		var y = self.y + dy;
		if(y > 0){
			y = 0;
		}
		if(y < 0 - self.max_height + self.height){
			y = 0 - self.max_height + self.height;
		}
		//dy = y - self.y;

		var x = self.x + dx;
		if(x > 0){
			x = 0;
		}
		if(x < 0 - self.max_width + self.width){
			x = 0 - self.max_width + self.width;
		}
		//dx = x - self.x;

		//console.log(self.x, self.y, 'move', dx, dy, 'max_height', self.max_height, self.height);
		
		dx = parseInt(dx);
		dy = parseInt(dy);
		self.x += dx;
		self.y += dy;
		
		for(var i in self.layers){
			var layer = self.layers[i];
			if(layer.height < self.height){
				var my = -1 * (self.height - layer.height) * dy / self.height;
			}else{
				var my = layer.height * dy / self.max_height;
			}
			if(layer.width < self.width){
				var mx = -1 * (self.width - layer.width) * dx / self.width;
			}else{
				var mx = layer.width * dx / self.max_width;
			}
			mx = parseInt(mx);
			my = parseInt(my);
			layer.move(mx, my);
			console.log('layer#' + i, layer.str(), ' move(' + mx + ',' + my + ')');
		}
		self.render();
	}
	
	function Layer(scroll){
		var self = this;
		self.scroll = scroll;
		self.dom = $('<div></div>');
		self.sprites = [];
		
		self.str = function(){
			return [self.x, self.y, self.width, self.height].join(',');
		}
		
		self.addSprite = function(sprite){
			sprite.layer = self;
			self.sprites.push(sprite);
			self.dom.append(sprite.dom);
		}

		self.load = function(conf){
			self.x = 0;
			self.y = 0;
			self.width = 0;
			self.height = 0;

			for(var i in conf.children){
				var sprite = new Sprite();
				sprite.load(conf.children[i]);
				self.addSprite(sprite);
			}

			for(var i in self.sprites){
				var sprite = self.sprites[i];
				if(i == 0){
					self.x = sprite.x;
					self.y = sprite.y;
				}else{
					self.x = Math.min(self.x, sprite.x);
					self.y = Math.min(self.y, sprite.y);
				}
			}
			for(var i in self.sprites){
				var sprite = self.sprites[i];
				sprite.x -= self.x;
				sprite.y -= self.y;
			}

			self.layout();
			
			self.dom.css({
				border: '1px solid #00f',
				//width: '100%',
				background: '#000',
				opacity: 0.5,
				position: 'absolute',
				top: self.y,
				left: self.x
			});
			if(conf.css){
				self.dom.css(conf.css);
			}
		}
		
		self.check_move = function(dx, dy){
			var y = self.y + dy;
			if(y > 0){
				dy = 0 - self.y;
			}
			if(y < -self.height + self.scroll.height){
				dy = -self.height + self.scroll.height - self.y;
			}

			var x = self.x + dx;
			if(x > 0){
				dx = 0 - self.x;
			}
			if(x < -self.width + self.scroll.width){
				dx = -self.width + self.scroll.width - self.x;
			}

			return [dx, dy];
		}

		self.move = function(dx, dy){
			self.x += dx;
			self.y += dy;
			return;
			
			var d = self.check_move(dx, dy);
			self.x += d[0];
			self.y += d[1];
		}
		
		self.layout = function(){
			for(var i in self.sprites){
				var sprite = self.sprites[i];
				sprite.layout(self.scroll.width, self.scroll.height);
				
				self.width = Math.max(self.width, sprite.x + sprite.width);
				self.height = Math.max(self.height, sprite.y + sprite.height);
			}
			self.width = parseInt(self.width);
			self.height = parseInt(self.height);
			self.dom.height(self.height);
			//self.bg.height = self.height;
			//self.bg.layout(self.scroll.width, self.scroll.height);
		}
		
		self.render = function(){
			self.layout();
			// TODO:
			self.dom.width(self.width);
			
			for(var i in self.sprites){
				var sprite = self.sprites[i];
				sprite.render(self.scroll.width, self.scroll.height);
			}

			self.dom.queue('fx', []).stop().animate({
				left: self.x,
				top: self.y
			}, 300);
		}
	}
	
	function Sprite(conf){
		var self = this;
		self.layer = null;
		self.dom = $('<div></div>');
		
		self.str = function(){
			return [self.x, self.y, self.width, self.height].join(',');
		}
		
		self.load = function(conf){
			conf.x *= ParallaxScroll.scale;
			conf.y *= ParallaxScroll.scale;
			if(conf.width == '100%'){
				self.stickWidth = true;
				conf.width = 0;
			}else{
				self.stickWidth = false;
				conf.width *= ParallaxScroll.scale;
			}
			if(conf.height == '100%'){
				self.stickHeight = true;
				conf.height = 0;
			}else{
				self.stickHeight = false;
				conf.height *= ParallaxScroll.scale;
			}

			self.html = conf.html || null;
			self.css = conf.css || null;
			self.img = conf.img || null;
			self.x = conf.x || 0;
			self.y = conf.y || 0;
			self.width = conf.width || 0;
			self.height = conf.height || 0;
			
			if(self.html){
				//console.log(self.html);
				self.dom.append($(self.html));
			}
			
			self.dom.css({
				position: 'absolute',
				overflow: 'hidden',
				width: self.width,
				height: self.height,
				top: self.y,
				left: self.x
			});
			if(self.css){
				//console.log(JSON.stringify(self.css));
				self.dom.css(self.css);
			}
		}

		function load_image(url, callback){
			var ni = new Image();
			ni.onload = function(){
				callback(this);
			};
			ni.src = url;
		}
		
		self.img_inited = false;
		
		self.load_image = function(){
			if(self.img_inited){
				return;
			}
			self.img_inited = true;
			
			if(self.img){
				var url = self.img;
				load_image(url, function(img){
					img.width *= ParallaxScroll.scale;
					img.height *= ParallaxScroll.scale;
					self.width = img.width;
					self.height = img.height;
					//console.log(img.width, img.height, img.src);
					self.dom.css({
						opacity: 0,
						backgroundImage: 'url(' + img.src + ')',
						backgroundSize: self.width + 'px ' + self.height + 'px',
						width: self.width,
						height: self.height
					});
					
					self.layer.render();
				});
			}
		}
		
		self.visible = function(width, height){
			var y = self.y + self.layer.y;
			if(y + self.height < 0 - 0 || y > height + 0){
				return false;
			}
			return true;
		}
		
		self.show = function(){
			self.dom.queue('fx', []).delay(400).stop().animate({
				opacity: 1
			}, 500);
		}
		
		self.hide = function(){
			self.dom.queue('fx', []).delay(400).stop().animate({
				opacity: 0
			}, 500);
		}
		
		self.layout = function(width, height){
			if(!self.visible(self.layer.scroll.width, self.layer.scroll.height)){
				return;
			}
			self.load_image();
		}
		
		self.render = function(width, height){
			if(self.stickWidth){
				self.width = self.layer.width;
			}
			if(self.stickHeight){
				self.height = self.layer.height;
			}
			self.dom.css({
				top: self.y,
				left: self.x,
				width: self.width,
				height: self.height
			});
			if(self.visible(self.layer.scroll.width, self.layer.scroll.height)){
				self.show();
			}else{
				self.hide();
			}
		}
	}
}
