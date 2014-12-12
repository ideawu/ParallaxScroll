/**
 * @author: ideawu
 * @link: https://github.com/ideawu/ParallaxScroll
 * Parallax Scrolling widget.
 */
function ParallaxScroll(dom, scale){
	//ParallaxScroll.debug = true;
	var self = this;
	self.dom = $(dom);
	self.x = 0;
	self.y = 0;
	self.width = Math.round($(dom).width());
	self.height = Math.round($(dom).height());
	self.max_width = self.width;
	self.max_height = self.height;
	self.scale = scale || 1;
	ParallaxScroll.scale = self.scale;

	self.layers = [];
	
	self.dom.css({
		'z-index': 1000,
		position: 'relative',
		overflow: 'hidden'
	});
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
			self.max_width = Math.max(self.max_width, layer.width + layer.originX);
			self.max_height = Math.max(self.max_height, layer.height + layer.originY);
		}
	}
	
	self.move = function(dx, dy){
		dx = dx * self.width/self.max_width;
		dy = dy * self.height/self.max_height;

		var y = self.y + dy;
		y = Math.min(y, 0);
		y = Math.max(y, -self.height)// * (1 - self.height/self.max_height));
		dy = y - self.y;

		var x = self.x + dx;
		x = Math.min(x, 0);
		x = Math.max(x, -self.width)// * (1 - self.width/self.max_width));
		dx = x - self.x;
		
		for(var i in self.layers){
			var layer = self.layers[i];
			if(layer.x == 0 && layer.x + layer.width == self.width){
				//dx = 0;
			}
			if(layer.y == 0 && layer.y + layer.height == self.height){
				//dy = 0;
			}
		}
		if(!dx && !dy){
			//console.log(dx, dy, self.x, self.y, self.height);
			return;
		}
		
		self.x += dx;
		self.y += dy;
		//console.log('scroll', self.x, 'dx', dx);

		var x_rate = (self.x / self.width);
		var y_rate = (self.y / self.height);
		for(var i in self.layers){
			var layer = self.layers[i];
			
			var nx = (layer.width + layer.originX - self.width) * x_rate;
			var mx = nx - (layer.x - layer.originX);
			
			var ny = (layer.height + layer.originY - self.height) * y_rate;
			var my = ny - (layer.y - layer.originY);
			
			//console.log('layer#' + i, layer.str(), ' move(' + mx + ',' + my + ')');
			layer.move(mx, my);
		}
		self.render();
	}
	
	function Layer(scroll){
		var self = this;
		self.scroll = scroll;
		self.dom = $('<div class="Layer"></div>');
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
			self.x = Math.round((conf.x || 0) * ParallaxScroll.scale);
			self.y = Math.round((conf.y || 0) * ParallaxScroll.scale);
			self.width = Math.round((conf.width || 0) * ParallaxScroll.scale);
			self.height = Math.round((conf.height || 0) * ParallaxScroll.scale);
			self.originX = self.x;
			self.originY = self.y;
			self.originWidth = conf.width;

			var x = Number.MAX_VALUE;
			var y = Number.MAX_VALUE;
			for(var i in conf.children){
				var sprite = new Sprite();
				sprite.load(conf.children[i]);
				self.addSprite(sprite);
				x = Math.min(x, sprite.x);
				y = Math.min(y, sprite.y);
			}
			
			self.layout();
			
			self.dom.css({
				'z-index': 100,
				position: 'absolute'
				//width: self.width,
				//height: self.height
			});
			if(ParallaxScroll.debug){ // debug
				self.dom.css({
					border: '1px solid #00f',
					background: '#000',
					opacity: 0.5
				});
			}
			if(conf.css){
				self.dom.css(conf.css);
			}
			self.move(0, 0);
		}
		
		self.move = function(dx, dy){
			self.x += dx;
			self.y += dy;
			if(0){
				self.dom.css({
					left: self.x,
					top: self.y
				});
			}else{
				// better performace
				self.dom.css({
					'-webkit-transform': 'translate3d(' + self.x + 'px, ' + self.y + 'px, 0)',
					'transform': 'translate3d(' + self.x + 'px, ' + self.y + 'px, 0)'
				});
			}
		}
		
		self.layout = function(){
			var old_w = self.wiidth;
			var old_h = self.height;
			for(var i in self.sprites){
				var sprite = self.sprites[i];
				sprite.layout(self.scroll.width, self.scroll.height);
				
				self.width = Math.max(self.width, sprite.x + sprite.width);
				self.height = Math.max(self.height, sprite.y + sprite.height);
			}
			if(old_w != self.width){
				//self.dom.width(Math.round(self.width));
				//console.log('refresh width', old_w, self.width);
			}
			if(old_h != self.height){
				//self.dom.height(Math.round(self.height));
				//console.log('refresh height', old_h, self.height);
			}
		}
		
		self.render = function(){
			self.layout();
			//if(self.originWidth){
			//	self.dom.width(self.width);
			//}
			
			for(var i in self.sprites){
				var sprite = self.sprites[i];
				sprite.render();
			}
		}
	}
	
	function Sprite(conf){
		var self = this;
		self.layer = null;
		self.dom = $('<div class="Sprite"></div>');
		
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
			
			self.x = Math.round(self.x);
			self.y = Math.round(self.y);
			self.width = self.width;
			self.height = self.height;
			
			self.dom.css({
				'z-index': 10,
				position: 'absolute',
				overflow: 'hidden',
				width: self.width,
				height: self.height,
				top: self.y,
				left: self.x
			});
		}

		function load_image(url, callback){
			var ni = new Image();
			ni.onload = function(){
				callback(this);
			};
			ni.src = url;
		}
		
		self.inited = false;
		
		self.load_image = function(){
			if(self.inited){
				return;
			}
			self.inited = true;

			if(self.html){
				self.dom.append($(self.html));
			}
			if(self.css){
				self.dom.css(self.css);
			}
			
			if(self.img){
				var url = self.img;
				load_image(url, function(img){
					img.width = Math.floor(img.width * ParallaxScroll.scale);
					img.height = Math.floor(img.height * ParallaxScroll.scale);
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
		
		self.visible = function(){
			var width = self.layer.scroll.width;
			var height = self.layer.scroll.height;
			var y = self.y + self.layer.y;
			if(y + self.height < 0 - 20 || y > height + 20){
				return false;
			}
			var x = self.x + self.layer.x;
			if(x + self.width < 0 - 20 || x > width + 20){
				return false;
			}
			//console.log(self.img, self.y, self.layer.y, height);
			return true;
		}
		
		self.show = function(){
			self.dom.css({
				opacity: 1
			});
		}
		
		self.hide = function(){
			return;
			/*
			self.dom.css({
				opacity: 0
			});
			*/
		}
		
		self.layout = function(width, height){
			if(!self.visible()){
				return;
			}
			self.load_image();
		}
		
		self.render = function(){
			// 要在 layout 之后执行
			if(self.stickWidth){
				self.width = self.layer.width;
			}
			if(self.stickHeight){
				self.height = self.layer.height;
			}
			if(self.visible()){
				if(self.stickWidth){
					self.dom.css('width', self.width);
				}
				if(self.stickHeight){
					self.dom.css('height', self.height);
				}
				self.show();
			}else{
				self.hide();
			}
		}
	}
}
