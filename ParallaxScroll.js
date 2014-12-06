function ParallaxScroll(dom){
	ParallaxScroll.debug = false;
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
	
	if(ParallaxScroll.debug){
		self.dom.css({
			border: '3px solid #f00',
			overflow: 'visible'
		});
	}
	
	self.load = function(confs){
		for(var i in confs){
			var layer = new Layer(self);
			layer.load(confs[i]);
			self.layers.push(layer);
			self.dom.append(layer.dom);
		}
		self.render();
	}
	
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
		y = Math.min(y, 0);
		y = Math.max(y, -self.height);
		dy = y - self.y;

		var x = self.x + dx;
		x = Math.min(x, 0);
		x = Math.max(x, -self.width);
		dx = x - self.x;
		
		dx = parseInt(dx);
		dy = parseInt(dy);
		
		for(var i in self.layers){
			var layer = self.layers[i];
			if(layer.x == 0 && layer.x + layer.width == self.width){
				dx = 0;
			}
			if(layer.y == 0 && layer.y + layer.height == self.height){
				dy = 0;
			}
		}
		if(!dx && !dy){
			return;
		}
		
		self.x += dx;
		self.y += dy;
		var dx_rate = self.x / self.width;
		var dy_rate = self.y / self.height;
				
		for(var i in self.layers){
			var layer = self.layers[i];
			
			// virtual height: self.height + layer.originY
			var new_y = layer.originY + dy_rate * (layer.height - self.height + layer.originY);
			//var new_y = dy_rate * (layer.height - layer.originY - self.height);
			var my = new_y - layer.y;
			var new_x = layer.originX + dx_rate * (layer.width - self.width + layer.originX);
			var mx = new_x - layer.x;
			//mx = 0;
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
			self.x = (conf.x || 0) * ParallaxScroll.scale;
			self.y = (conf.y || 0) * ParallaxScroll.scale;
			self.width = (conf.width || 0) * ParallaxScroll.scale;
			self.height = (conf.height || 0) * ParallaxScroll.scale;
			self.originX = self.x;
			self.originY = self.y;

			for(var i in conf.children){
				var sprite = new Sprite();
				sprite.load(conf.children[i]);
				self.addSprite(sprite);
			}
			
			self.layout();
			
			self.dom.css({
				position: 'absolute',
				top: self.y,
				left: self.x
			});
			if(ParallaxScroll.debug){ // debug
				self.dom.css({
					border: '1px solid #00f',
					background: '#000',
					opacity: 0.5,
				});
			}
			if(conf.css){
				self.dom.css(conf.css);
			}
		}
		
		self.move = function(dx, dy){
			if(dx == 0 && dy == 0){
				return;
			}
			self.x += dx;
			self.y += dy;

			self.dom.queue('fx', []).stop().animate({
				left: self.x,
				top: self.y
			}, 300);
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
		}
		
		self.render = function(){
			self.layout();
			self.dom.width(self.width);
			
			for(var i in self.sprites){
				var sprite = self.sprites[i];
				sprite.render(self.scroll.width, self.scroll.height);
			}
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
			
			self.x = parseInt(self.x);
			self.y = parseInt(self.y);
			self.width = parseInt(self.width);
			self.height = parseInt(self.height);
			
			if(self.html){
				//console.log(self.html);
				//console.log($(self.html).width(), $(self.html).height());
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
				//console.log(self.img, self.y, self.height);
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
