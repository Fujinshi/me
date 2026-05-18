(function(){
    'use strict';
    
    // ==================== HIRAKO CORE ====================
    var HIRAKO = {
        version: '2.0.0',
        active: false,
        panel: null,
        tools: {},
        currentTool: null,
        
        // Theme colors
        theme: {
            bg: '#1e1e2e',
            darkerBg: '#2a2a3a',
            primary: '#fff',
            accent: '#ff6b6b',
            highlight: '#4a6bff',
            border: '#3a3a4a',
            success: '#4ecdc4',
            warning: '#ffa500',
            error: '#ff6b6b'
        },
        
        // Initialize Hirako
        init: function() {
            if(this.active) return this;
            
            this.createPanel();
            this.bindEvents();
            this.active = true;
            this.log('Hirako v' + this.version + ' initialized');
            
            return this;
        },
        
        // Create main panel
        createPanel: function() {
            var panel = document.createElement('div');
            panel.id = 'hirako-panel';
            panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:' + this.theme.bg + ';color:' + this.theme.primary + ';z-index:999999;font-family:monospace;font-size:12px;border-top:3px solid ' + this.theme.accent + ';box-shadow:0 -2px 10px rgba(0,0,0,0.3);transition:all 0.3s ease;';
            
            panel.innerHTML = this.renderPanel();
            document.body.appendChild(panel);
            this.panel = panel;
            this.contentEl = document.getElementById('hirako-content');
            
            this.initTools();
        },
        
        renderPanel: function() {
            return '<div style="display:flex;background:' + this.theme.darkerBg + ';padding:8px;border-bottom:1px solid ' + this.theme.border + ';">' +
                '<div style="flex:1;display:flex;gap:10px;">' +
                '<button data-tool="inspect" class="hirako-tool-btn active" style="background:' + this.theme.accent + ';color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🔍 Inspect</button>' +
                '<button data-tool="console" class="hirako-tool-btn" style="background:' + this.theme.darkerBg + ';color:' + this.theme.primary + ';border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">📝 Console</button>' +
                '<button data-tool="elements" class="hirako-tool-btn" style="background:' + this.theme.darkerBg + ';color:' + this.theme.primary + ';border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">📄 DOM</button>' +
                '<button data-tool="storage" class="hirako-tool-btn" style="background:' + this.theme.darkerBg + ';color:' + this.theme.primary + ';border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">💾 Storage</button>' +
                '<button data-tool="info" class="hirako-tool-btn" style="background:' + this.theme.darkerBg + ';color:' + this.theme.primary + ';border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">ℹ️ Info</button>' +
                '</div>' +
                '<div><button id="hirako-close" style="background:' + this.theme.accent + ';color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">✖ Close</button></div>' +
                '</div>' +
                '<div id="hirako-content" style="height:250px;overflow:auto;padding:10px;background:' + this.theme.bg + ';"></div>' +
                '<div style="background:' + this.theme.darkerBg + ';padding:5px;font-size:10px;border-top:1px solid ' + this.theme.border + ';">' +
                '<span>🎯 Hirako v' + this.version + '</span>' +
                '<span style="margin-left:15px;">⚡ Tap elements to inspect</span>' +
                '</div>';
        },
        
        // Initialize all tools
        initTools: function() {
            this.tools = {
                inspect: new InspectTool(this),
                console: new ConsoleTool(this),
                elements: new ElementsTool(this),
                storage: new StorageTool(this),
                info: new InfoTool(this)
            };
        },
        
        // Switch between tools
        switchTool: function(toolName) {
            if(this.currentTool === toolName) return;
            
            // Update button styles
            var btns = this.panel.querySelectorAll('.hirako-tool-btn');
            btns.forEach(function(btn) {
                btn.style.background = this.theme.darkerBg;
                btn.style.color = this.theme.primary;
                btn.classList.remove('active');
            }.bind(this));
            
            var activeBtn = this.panel.querySelector('[data-tool="' + toolName + '"]');
            if(activeBtn) {
                activeBtn.style.background = this.theme.accent;
                activeBtn.style.color = '#fff';
                activeBtn.classList.add('active');
            }
            
            // Hide current tool, show new tool
            if(this.currentTool && this.tools[this.currentTool]) {
                this.tools[this.currentTool].hide();
            }
            
            this.currentTool = toolName;
            this.tools[toolName].show(this.contentEl);
        },
        
        // Bind panel events
        bindEvents: function() {
            var self = this;
            
            this.panel.querySelectorAll('.hirako-tool-btn').forEach(function(btn) {
                btn.onclick = function() {
                    self.switchTool(this.dataset.tool);
                };
            });
            
            document.getElementById('hirako-close').onclick = function() {
                self.destroy();
            };
        },
        
        // Log message
        log: function(msg) {
            console.log('[Hirako] ' + msg);
        },
        
        // Destroy panel
        destroy: function() {
            if(this.panel) this.panel.remove();
            this.active = false;
            
            // Cleanup tools
            for(var key in this.tools) {
                if(this.tools[key] && this.tools[key].destroy) {
                    this.tools[key].destroy();
                }
            }
        }
    };
    
    // ==================== INSPECT TOOL ====================
    function InspectTool(hirako) {
        this.hirako = hirako;
        this.pickerActive = false;
        this.overlay = null;
        this.tip = null;
    }
    
    InspectTool.prototype.show = function(container) {
        this.container = container;
        this.render();
        this.bindEvents();
    };
    
    InspectTool.prototype.hide = function() {
        this.deactivatePicker();
    };
    
    InspectTool.prototype.destroy = function() {
        this.deactivatePicker();
    };
    
    InspectTool.prototype.render = function() {
        this.container.innerHTML = 
            '<div style="margin-bottom:10px;">' +
            '<button id="hirako-pick-btn" style="background:#ff6b6b;color:#fff;border:none;padding:8px;border-radius:5px;margin-right:5px;cursor:pointer;">🎯 Pilih Elemen</button>' +
            '<button id="hirako-highlight-all" style="background:#4a6bff;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">✨ Highlight Semua</button>' +
            '<button id="hirako-clear-inspect" style="background:#6b6b6b;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">🗑 Clear</button>' +
            '</div>' +
            '<div id="hirako-inspect-result" style="background:#2a2a3a;padding:10px;border-radius:5px;font-size:11px;word-break:break-all;">' +
            '<i>Klik "Pilih Elemen" lalu tap elemen di halaman</i>' +
            '</div>' +
            '<div id="hirako-css-view" style="margin-top:10px;background:#2a2a3a;padding:10px;border-radius:5px;display:none;">' +
            '<b>🎨 CSS Styles</b><div id="hirako-css-content" style="font-size:11px;margin-top:5px;"></div>' +
            '</div>';
    };
    
    InspectTool.prototype.bindEvents = function() {
        var self = this;
        
        document.getElementById('hirako-pick-btn').onclick = function() {
            self.activatePicker();
        };
        
        document.getElementById('hirako-highlight-all').onclick = function() {
            self.highlightAll();
        };
        
        document.getElementById('hirako-clear-inspect').onclick = function() {
            document.getElementById('hirako-inspect-result').innerHTML = '<i>Siap untuk inspect elemen...</i>';
            document.getElementById('hirako-css-view').style.display = 'none';
        };
    };
    
    InspectTool.prototype.activatePicker = function() {
        if(this.pickerActive) return;
        this.pickerActive = true;
        
        var self = this;
        
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,107,107,0.1);z-index:1000000;cursor:crosshair;';
        document.body.appendChild(this.overlay);
        
        this.tip = document.createElement('div');
        this.tip.style.cssText = 'position:fixed;background:#ff6b6b;color:#fff;padding:5px 10px;border-radius:5px;font-size:12px;z-index:1000001;pointer-events:none;';
        document.body.appendChild(this.tip);
        
        var hoverHandler = function(e) {
            var el = e.target;
            self.tip.innerHTML = el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : '');
            self.tip.style.left = (e.clientX + 15) + 'px';
            self.tip.style.top = (e.clientY + 15) + 'px';
            el.style.outline = '2px solid #ff6b6b';
            setTimeout(function() {
                if(el.style.outline) el.style.outline = '';
            }, 100);
        };
        
        var clickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.inspectElement(e.target);
            self.deactivatePicker();
        };
        
        document.addEventListener('mouseover', hoverHandler);
        document.addEventListener('click', clickHandler);
        
        this.pickerHandlers = { hover: hoverHandler, click: clickHandler };
    };
    
    InspectTool.prototype.deactivatePicker = function() {
        if(!this.pickerActive) return;
        this.pickerActive = false;
        
        if(this.overlay) this.overlay.remove();
        if(this.tip) this.tip.remove();
        
        if(this.pickerHandlers) {
            document.removeEventListener('mouseover', this.pickerHandlers.hover);
            document.removeEventListener('click', this.pickerHandlers.click);
        }
    };
    
    InspectTool.prototype.inspectElement = function(el) {
        var rect = el.getBoundingClientRect();
        var styles = window.getComputedStyle(el);
        
        var info = '<b>📦 Element:</b> ' + el.tagName + '<br>';
        info += '<b>🆔 ID:</b> ' + (el.id || '-') + '<br>';
        info += '<b>📝 Class:</b> ' + (el.className || '-') + '<br>';
        info += '<b>📐 Size:</b> ' + Math.round(rect.width) + 'x' + Math.round(rect.height) + 'px<br>';
        info += '<b>📍 Position:</b> (' + Math.round(rect.left) + ', ' + Math.round(rect.top) + ')<br>';
        info += '<b>👶 Children:</b> ' + el.children.length + '<br>';
        info += '<b>📄 InnerHTML:</b> <span style="color:#ffa500;">' + this.escapeHtml(el.innerHTML.substring(0, 100)) + '</span><br>';
        info += '<button id="hirako-view-css" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;margin-top:5px;cursor:pointer;">🎨 Lihat CSS</button> ';
        info += '<button id="hirako-edit-element" style="background:#ffa500;color:#fff;border:none;padding:5px;border-radius:3px;margin-top:5px;margin-left:5px;cursor:pointer;">✏️ Edit HTML</button>';
        
        document.getElementById('hirako-inspect-result').innerHTML = info;
        
        var self = this;
        document.getElementById('hirako-view-css').onclick = function() {
            var css = '';
            for(var i = 0; i < styles.length; i++) {
                var prop = styles[i];
                var val = styles.getPropertyValue(prop);
                if(val && val !== 'normal' && val !== 'auto' && val !== 'none') {
                    css += prop + ': ' + val + ';\n';
                }
            }
            document.getElementById('hirako-css-content').innerHTML = '<pre style="margin:0;color:#4ecdc4;">' + self.escapeHtml(css.substring(0, 1000)) + '</pre>';
            document.getElementById('hirako-css-view').style.display = 'block';
        };
        
        document.getElementById('hirako-edit-element').onclick = function() {
            var newHtml = prompt('Edit HTML:', el.outerHTML);
            if(newHtml) {
                el.outerHTML = newHtml;
                self.inspectElement(el);
            }
        };
    };
    
    InspectTool.prototype.highlightAll = function() {
        var elements = document.querySelectorAll('*');
        var count = 0;
        var self = this;
        
        elements.forEach(function(el) {
            if(el !== self.hirako.panel && !el.id?.includes('hirako')) {
                el.style.outline = '1px solid #ff6b6b';
                count++;
            }
        });
        
        setTimeout(function() {
            elements.forEach(function(el) {
                if(el.style.outline === '1px solid #ff6b6b') el.style.outline = '';
            });
        }, 2000);
        
        this.hirako.log(count + ' elements highlighted');
    };
    
    InspectTool.prototype.escapeHtml = function(str) {
        if(!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if(m === '&') return '&amp;';
            if(m === '<') return '&lt;';
            if(m === '>') return '&gt;';
            return m;
        });
    };
    
    // ==================== CONSOLE TOOL ====================
    function ConsoleTool(hirako) {
        this.hirako = hirako;
        this.logs = [];
        this.originalConsole = {};
    }
    
    ConsoleTool.prototype.show = function(container) {
        this.container = container;
        this.render();
        this.captureConsole();
        this.bindEvents();
        this.updateDisplay();
    };
    
    ConsoleTool.prototype.hide = function() {
        this.restoreConsole();
    };
    
    ConsoleTool.prototype.destroy = function() {
        this.restoreConsole();
    };
    
    ConsoleTool.prototype.render = function() {
        this.container.innerHTML = 
            '<div style="margin-bottom:10px;">' +
            '<button id="hirako-clear-console" style="background:#ff6b6b;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">Clear Console</button>' +
            '<button id="hirako-exec-js" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;margin-left:5px;cursor:pointer;">Run JS</button>' +
            '</div>' +
            '<div id="hirako-console-output" style="background:#0a0a0f;height:180px;overflow:auto;padding:5px;font-size:10px;border-radius:5px;font-family:monospace;"></div>' +
            '<div style="margin-top:5px;display:flex;gap:5px;">' +
            '<input type="text" id="hirako-js-input" placeholder="JavaScript code..." style="flex:1;background:#2a2a3a;color:#fff;border:1px solid #ff6b6b;padding:5px;border-radius:3px;">' +
            '<button id="hirako-execute-js" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">Execute</button>' +
            '</div>';
    };
    
    ConsoleTool.prototype.bindEvents = function() {
        var self = this;
        
        document.getElementById('hirako-clear-console').onclick = function() {
            self.logs = [];
            self.updateDisplay();
        };
        
        document.getElementById('hirako-exec-js').onclick = function() {
            var code = document.getElementById('hirako-js-input').value;
            if(code) self.executeJS(code);
        };
        
        document.getElementById('hirako-execute-js').onclick = function() {
            var code = document.getElementById('hirako-js-input').value;
            if(code) self.executeJS(code);
        };
    };
    
    ConsoleTool.prototype.captureConsole = function() {
        var self = this;
        
        this.originalConsole.log = console.log;
        this.originalConsole.error = console.error;
        this.originalConsole.warn = console.warn;
        this.originalConsole.info = console.info;
        
        console.log = function() {
            var args = Array.from(arguments);
            self.logs.push(['📝 LOG', self.getTime(), args.join(' ')]);
            self.originalConsole.log.apply(console, arguments);
            self.updateDisplay();
        };
        
        console.error = function() {
            var args = Array.from(arguments);
            self.logs.push(['❌ ERROR', self.getTime(), args.join(' ')]);
            self.originalConsole.error.apply(console, arguments);
            self.updateDisplay();
        };
        
        console.warn = function() {
            var args = Array.from(arguments);
            self.logs.push(['⚠️ WARN', self.getTime(), args.join(' ')]);
            self.originalConsole.warn.apply(console, arguments);
            self.updateDisplay();
        };
        
        console.info = function() {
            var args = Array.from(arguments);
            self.logs.push(['ℹ️ INFO', self.getTime(), args.join(' ')]);
            self.originalConsole.info.apply(console, arguments);
            self.updateDisplay();
        };
    };
    
    ConsoleTool.prototype.restoreConsole = function() {
        if(this.originalConsole.log) {
            console.log = this.originalConsole.log;
            console.error = this.originalConsole.error;
            console.warn = this.originalConsole.warn;
            console.info = this.originalConsole.info;
        }
    };
    
    ConsoleTool.prototype.updateDisplay = function() {
        var output = document.getElementById('hirako-console-output');
        if(!output) return;
        
        var self = this;
        output.innerHTML = this.logs.map(function(log) {
            var color = log[0].includes('ERROR') ? '#ff6b6b' : (log[0].includes('WARN') ? '#ffa500' : (log[0].includes('INFO') ? '#4ecdc4' : '#ffffff'));
            return '<div style="border-bottom:1px solid #2a2a3a;padding:3px;"><span style="color:' + color + ';">' + self.escapeHtml(log.join(' ')) + '</span></div>';
        }).join('') || '<i>No logs...</i>';
        
        output.scrollTop = output.scrollHeight;
    };
    
    ConsoleTool.prototype.executeJS = function(code) {
        try {
            var result = eval(code);
            this.logs.push(['▶ EXEC', this.getTime(), code + ' → ' + JSON.stringify(result)]);
            this.updateDisplay();
        } catch(e) {
            this.logs.push(['❌ ERROR', this.getTime(), e.message]);
            this.updateDisplay();
        }
    };
    
    ConsoleTool.prototype.getTime = function() {
        var d = new Date();
        return d.toLocaleTimeString();
    };
    
    ConsoleTool.prototype.escapeHtml = function(str) {
        if(!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if(m === '&') return '&amp;';
            if(m === '<') return '&lt;';
            if(m === '>') return '&gt;';
            return m;
        });
    };
    
    // ==================== ELEMENTS TOOL ====================
    function ElementsTool(hirako) {
        this.hirako = hirako;
    }
    
    ElementsTool.prototype.show = function(container) {
        this.container = container;
        this.render();
        this.bindEvents();
    };
    
    ElementsTool.prototype.hide = function() {};
    ElementsTool.prototype.destroy = function() {};
    
    ElementsTool.prototype.render = function() {
        this.container.innerHTML = 
            '<div style="margin-bottom:5px;">' +
            '<button id="hirako-refresh-dom" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">🔄 Refresh</button>' +
            '<span style="margin-left:10px;color:#4ecdc4;">Total elements: ' + document.querySelectorAll('*').length + '</span>' +
            '</div>' +
            '<div id="hirako-dom-tree" style="background:#0a0a0f;height:200px;overflow:auto;padding:5px;font-size:11px;border-radius:5px;font-family:monospace;">' +
            this.generateDOMTree(document.body, 0) +
            '</div>';
    };
    
    ElementsTool.prototype.bindEvents = function() {
        var self = this;
        document.getElementById('hirako-refresh-dom').onclick = function() {
            document.getElementById('hirako-dom-tree').innerHTML = self.generateDOMTree(document.body, 0);
        };
    };
    
    ElementsTool.prototype.generateDOMTree = function(node, level) {
        if(node.nodeType === 1 && !node.id?.includes('hirako')) {
            var indent = '  '.repeat(level);
            var tag = node.tagName.toLowerCase();
            var id = node.id ? '#' + node.id : '';
            var cls = node.className ? '.' + node.className.toString().split(' ')[0] : '';
            var html = indent + '<span style="color:#ff6b6b;">&lt;' + tag + id + cls + '&gt;</span>\n';
            
            for(var i = 0; i < node.children.length; i++) {
                if(!node.children[i].id?.includes('hirako')) {
                    html += this.generateDOMTree(node.children[i], level + 1);
                }
            }
            
            if(node.children.length === 0 && node.textContent.trim()) {
                var text = node.textContent.trim().substring(0, 50);
                if(text) html += indent + '  ' + '<span style="color:#4ecdc4;">"' + this.escapeHtml(text) + '"</span>\n';
            }
            
            html += indent + '<span style="color:#ff6b6b;">&lt;/' + tag + '&gt;</span>\n';
            return html;
        }
        return '';
    };
    
    ElementsTool.prototype.escapeHtml = function(str) {
        if(!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if(m === '&') return '&amp;';
            if(m === '<') return '&lt;';
            if(m === '>') return '&gt;';
            return m;
        });
    };
    
    // ==================== STORAGE TOOL ====================
    function StorageTool(hirako) {
        this.hirako = hirako;
    }
    
    StorageTool.prototype.show = function(container) {
        this.container = container;
        this.render();
        this.bindEvents();
    };
    
    StorageTool.prototype.hide = function() {};
    StorageTool.prototype.destroy = function() {};
    
    StorageTool.prototype.render = function() {
        var localStorageData = this.getStorageData('local');
        var sessionStorageData = this.getStorageData('session');
        
        this.container.innerHTML = 
            '<div style="margin-bottom:10px;">' +
            '<button id="hirako-clear-all-storage" style="background:#ff6b6b;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">🗑 Clear All Storage</button>' +
            '</div>' +
            '<div style="background:#0a0a0f;height:200px;overflow:auto;padding:5px;font-size:10px;border-radius:5px;">' +
            '<b>💾 Local Storage:</b><br>' +
            this.renderTable(localStorageData) +
            '<hr>' +
            '<b>💿 Session Storage:</b><br>' +
            this.renderTable(sessionStorageData) +
            '<hr>' +
            '<b>🍪 Cookies:</b><br>' +
            '<pre style="color:#4ecdc4;">' + this.escapeHtml(document.cookie || '(empty)') + '</pre>' +
            '</div>';
    };
    
    StorageTool.prototype.getStorageData = function(type) {
        var storage = type === 'local' ? localStorage : sessionStorage;
        var data = [];
        try {
            for(var i = 0; i < storage.length; i++) {
                var key = storage.key(i);
                data.push({ key: key, value: storage.getItem(key) });
            }
        } catch(e) {}
        return data;
    };
    
    StorageTool.prototype.renderTable = function(data) {
        if(!data.length) return '<i>Empty</i>';
        
        var html = '<table style="width:100%;border-collapse:collapse;">';
        for(var i = 0; i < data.length; i++) {
            html += '<tr>' +
                '<td style="color:#ffa500;padding:2px 5px;">' + this.escapeHtml(data[i].key) + '</td>' +
                '<td style="color:#4ecdc4;padding:2px 5px;">' + this.escapeHtml(data[i].value.substring(0, 100)) + '</td>' +
                '</tr>';
        }
        html += '</table>';
        return html;
    };
    
    StorageTool.prototype.bindEvents = function() {
        var self = this;
        document.getElementById('hirako-clear-all-storage').onclick = function() {
            if(confirm('Clear all storage?')) {
                localStorage.clear();
                sessionStorage.clear();
                self.render();
            }
        };
    };
    
    StorageTool.prototype.escapeHtml = function(str) {
        if(!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if(m === '&') return '&amp;';
            if(m === '<') return '&lt;';
            if(m === '>') return '&gt;';
            return m;
        });
    };
    
    // ==================== INFO TOOL ====================
    function InfoTool(hirako) {
        this.hirako = hirako;
    }
    
    InfoTool.prototype.show = function(container) {
        this.container = container;
        this.render();
    };
    
    InfoTool.prototype.hide = function() {};
    InfoTool.prototype.destroy = function() {};
    
    InfoTool.prototype.render = function() {
        var ua = navigator.userAgent;
        var screen = window.screen;
        var perf = performance.memory || null;
        
        var info = '<div style="background:#0a0a0f;padding:10px;border-radius:5px;font-size:11px;">';
        info += '<b>🔧 System Information:</b><br><br>';
        info += '🌐 User Agent: <span style="color:#4ecdc4;">' + this.escapeHtml(ua.substring(0, 200)) + '</span><br>';
        info += '📱 Screen: <span style="color:#4ecdc4;">' + screen.width + 'x' + screen.height + '</span><br>';
        info += '👁️ Viewport: <span style="color:#4ecdc4;">' + window.innerWidth + 'x' + window.innerHeight + '</span><br>';
        info += '🔍 Pixel Ratio: <span style="color:#4ecdc4;">' + window.devicePixelRatio + '</span><br>';
        info += '📄 URL: <span style="color:#4ecdc4;word-break:break-all;">' + this.escapeHtml(location.href) + '</span><br>';
        info += '⏰ Time: <span style="color:#4ecdc4;">' + new Date().toLocaleString() + '</span><br>';
        info += '💾 Memory: <span style="color:#4ecdc4;">' + (perf ? Math.round(perf.usedJSHeapSize / 1048576) + ' MB' : 'N/A') + '</span><br>';
        info += '📊 DOM Elements: <span style="color:#4ecdc4;">' + document.querySelectorAll('*').length + '</span><br>';
        info += '</div>';
        
        this.container.innerHTML = info;
    };
    
    InfoTool.prototype.escapeHtml = function(str) {
        if(!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if(m === '&') return '&amp;';
            if(m === '<') return '&lt;';
            if(m === '>') return '&gt;';
            return m;
        });
    };
    
    // ==================== START HIRAKO ====================
    window.Hirako = HIRAKO;
    HIRAKO.init();
    
})();
