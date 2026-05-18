javascript:(function(){
    // Hirako - Advanced Mobile Inspector v1.0
    var Hirako = {
        version: '1.0.0',
        active: false,
        panel: null,
        elements: {},
        
        // Main initialization
        init: function() {
            if(this.active) return this.show();
            this.createPanel();
            this.attachEvents();
            this.active = true;
            this.log('Hirako v' + this.version + ' siap digunakan!');
        },
        
        // Create UI Panel
        createPanel: function() {
            var panel = document.createElement('div');
            panel.id = 'hirako-panel';
            panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1e1e2e;color:#fff;z-index:999999;font-family:monospace;font-size:12px;border-top:3px solid #ff6b6b;box-shadow:0 -2px 10px rgba(0,0,0,0.3);transition:all 0.3s ease;';
            panel.innerHTML = `
                <div style="display:flex;background:#2a2a3a;padding:8px;border-bottom:1px solid #3a3a4a;">
                    <div style="flex:1;display:flex;gap:10px;">
                        <button data-tab="inspect" class="hirako-tab active" style="background:#ff6b6b;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🔍 Inspect</button>
                        <button data-tab="console" class="hirako-tab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">📝 Console</button>
                        <button data-tab="elements" class="hirako-tab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">📄 Elements</button>
                        <button data-tab="network" class="hirako-tab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🌐 Network</button>
                        <button data-tab="storage" class="hirako-tab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">💾 Storage</button>
                        <button data-tab="performance" class="hirako-tab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">⚡ Perf</button>
                    </div>
                    <div>
                        <button id="hirako-close" style="background:#ff6b6b;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">✖ Close</button>
                    </div>
                </div>
                <div id="hirako-content" style="height:250px;overflow:auto;padding:10px;background:#1e1e2e;"></div>
                <div style="background:#2a2a3a;padding:5px;font-size:10px;border-top:1px solid #3a3a4a;">
                    <span>🎯 Mode: <span id="hirako-mode">Inspect</span></span>
                    <span style="margin-left:15px;">⚡ Hirako v1.0</span>
                </div>
            `;
            document.body.appendChild(panel);
            this.panel = panel;
            
            // Tabs
            document.querySelectorAll('.hirako-tab').forEach(tab => {
                tab.onclick = () => this.switchTab(tab.dataset.tab);
            });
            document.getElementById('hirako-close').onclick = () => this.destroy();
        },
        
        // Switch tabs
        switchTab: function(tabName) {
            document.querySelectorAll('.hirako-tab').forEach(tab => {
                tab.style.background = '#3a3a4a';
            });
            document.querySelector(`[data-tab="${tabName}"]`).style.background = '#ff6b6b';
            document.getElementById('hirako-mode').innerText = tabName.charAt(0).toUpperCase() + tabName.slice(1);
            
            switch(tabName) {
                case 'inspect': this.showInspectTab(); break;
                case 'console': this.showConsoleTab(); break;
                case 'elements': this.showElementsTab(); break;
                case 'network': this.showNetworkTab(); break;
                case 'storage': this.showStorageTab(); break;
                case 'performance': this.showPerformanceTab(); break;
            }
        },
        
        // Inspect Tab
        showInspectTab: function() {
            var content = document.getElementById('hirako-content');
            content.innerHTML = `
                <div style="margin-bottom:10px;">
                    <button id="hirako-select" style="background:#ff6b6b;color:#fff;border:none;padding:8px;border-radius:5px;margin-right:5px;cursor:pointer;">🎯 Pilih Elemen</button>
                    <button id="hirako-highlight" style="background:#4a6bff;color:#fff;border:none;padding:8px;border-radius:5px;margin-right:5px;cursor:pointer;">✨ Highlight Semua</button>
                    <button id="hirako-clear" style="background:#6b6b6b;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">🗑 Clear</button>
                </div>
                <div id="hirako-inspector-result" style="background:#2a2a3a;padding:10px;border-radius:5px;font-size:11px;word-break:break-all;">
                    <i>Klik "Pilih Elemen" lalu tap elemen di halaman</i>
                </div>
                <div id="hirako-styles" style="margin-top:10px;background:#2a2a3a;padding:10px;border-radius:5px;display:none;">
                    <b>🎨 CSS Styles</b>
                    <div id="hirako-css-content" style="font-size:11px;margin-top:5px;"></div>
                </div>
            `;
            
            document.getElementById('hirako-select').onclick = () => this.enableElementPicker();
            document.getElementById('hirako-highlight').onclick = () => this.highlightAllElements();
            document.getElementById('hirako-clear').onclick = () => {
                document.getElementById('hirako-inspector-result').innerHTML = '<i>Siap untuk inspect elemen...</i>';
                document.getElementById('hirako-styles').style.display = 'none';
            };
        },
        
        // Element picker
        enableElementPicker: function() {
            var overlay = document.createElement('div');
            overlay.id = 'hirako-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,107,107,0.1);z-index:1000000;cursor:crosshair;';
            document.body.appendChild(overlay);
            
            var tooltip = document.createElement('div');
            tooltip.id = 'hirako-tooltip';
            tooltip.style.cssText = 'position:fixed;background:#ff6b6b;color:#fff;padding:5px 10px;border-radius:5px;font-size:12px;z-index:1000001;pointer-events:none;';
            document.body.appendChild(tooltip);
            
            var picker = (e) => {
                e.preventDefault();
                e.stopPropagation();
                var el = e.target;
                this.showElementInfo(el);
                overlay.remove();
                tooltip.remove();
                document.removeEventListener('mouseover', hover);
                document.removeEventListener('click', picker);
            };
            
            var hover = (e) => {
                var el = e.target;
                tooltip.innerHTML = el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : '');
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
                e.target.style.outline = '2px solid #ff6b6b';
                
                setTimeout(() => {
                    if(e.target.style.outline) e.target.style.outline = '';
                }, 100);
            };
            
            document.addEventListener('mouseover', hover);
            document.addEventListener('click', picker);
        },
        
        // Show element info
        showElementInfo: function(el) {
            var rect = el.getBoundingClientRect();
            var styles = window.getComputedStyle(el);
            var info = `
                <b>📦 Element:</b> ${el.tagName}<br>
                <b>🆔 ID:</b> ${el.id || '-'}<br>
                <b>📝 Class:</b> ${el.className || '-'}<br>
                <b>📐 Size:</b> ${Math.round(rect.width)}x${Math.round(rect.height)}px<br>
                <b>📍 Position:</b> (${Math.round(rect.left)}, ${Math.round(rect.top)})<br>
                <b>👶 Children:</b> ${el.children.length}<br>
                <b>📄 Inner HTML:</b> <span style="color:#ffa500;">${el.innerHTML.substring(0, 100)}${el.innerHTML.length > 100 ? '...' : ''}</span><br>
                <b>🔗 Outer HTML:</b> <span style="color:#4ecdc4;">${el.outerHTML.substring(0, 100)}${el.outerHTML.length > 100 ? '...' : ''}</span><br>
                <button id="hirako-view-styles" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;margin-top:5px;cursor:pointer;">🎨 Lihat CSS</button>
                <button id="hirako-edit-html" style="background:#ffa500;color:#fff;border:none;padding:5px;border-radius:3px;margin-top:5px;margin-left:5px;cursor:pointer;">✏️ Edit HTML</button>
            `;
            
            document.getElementById('hirako-inspector-result').innerHTML = info;
            
            document.getElementById('hirako-view-styles').onclick = () => {
                var css = '';
                for(var i = 0; i < styles.length; i++) {
                    var prop = styles[i];
                    var val = styles.getPropertyValue(prop);
                    if(val && val !== 'normal' && val !== 'auto' && val !== 'none') {
                        css += `${prop}: ${val};\n`;
                    }
                }
                document.getElementById('hirako-css-content').innerHTML = `<pre style="margin:0;color:#4ecdc4;">${css.substring(0, 1000)}</pre>`;
                document.getElementById('hirako-styles').style.display = 'block';
            };
            
            document.getElementById('hirako-edit-html').onclick = () => {
                var newHtml = prompt('Edit HTML:', el.outerHTML);
                if(newHtml) {
                    el.outerHTML = newHtml;
                    this.showElementInfo(el);
                    this.log('HTML element updated!');
                }
            };
        },
        
        // Highlight all elements
        highlightAllElements: function() {
            var elements = document.querySelectorAll('*');
            var count = 0;
            elements.forEach(el => {
                if(el !== this.panel && !el.id?.includes('hirako')) {
                    el.style.outline = '1px solid #ff6b6b';
                    count++;
                }
            });
            this.log(`✨ ${count} elemen telah di-highlight`);
            setTimeout(() => {
                elements.forEach(el => {
                    if(el.style.outline === '1px solid #ff6b6b') el.style.outline = '';
                });
            }, 2000);
        },
        
        // Console Tab with log capture
        consoleLogs: [],
        originalConsole: {log: null, error: null, warn: null},
        
        showConsoleTab: function() {
            var content = document.getElementById('hirako-content');
            content.innerHTML = `
                <div style="margin-bottom:10px;">
                    <button id="hirako-clear-console" style="background:#ff6b6b;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">Clear Console</button>
                    <button id="hirako-run-js" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;margin-left:5px;cursor:pointer;">▶ Run JS</button>
                </div>
                <div id="hirako-console-output" style="background:#0a0a0f;height:180px;overflow:auto;padding:5px;font-size:10px;border-radius:5px;"></div>
                <div style="margin-top:5px;">
                    <input type="text" id="hirako-js-input" placeholder="JavaScript code..." style="width:70%;background:#2a2a3a;color:#fff;border:1px solid #ff6b6b;padding:5px;border-radius:3px;">
                    <button id="hirako-execute" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">Execute</button>
                </div>
            `;
            
            this.captureConsole();
            this.displayConsoleLogs();
            
            document.getElementById('hirako-clear-console').onclick = () => {
                this.consoleLogs = [];
                this.displayConsoleLogs();
            };
            
            document.getElementById('hirako-run-js').onclick = () => {
                var code = document.getElementById('hirako-js-input').value;
                if(code) this.executeJS(code);
            };
            
            document.getElementById('hirako-execute').onclick = () => {
                var code = document.getElementById('hirako-js-input').value;
                if(code) this.executeJS(code);
            };
        },
        
        captureConsole: function() {
            var self = this;
            if(!this.originalConsole.log) {
                this.originalConsole.log = console.log;
                this.originalConsole.error = console.error;
                this.originalConsole.warn = console.warn;
                
                console.log = function() {
                    self.consoleLogs.push(['📝 LOG', new Date().toLocaleTimeString(), ...arguments]);
                    self.originalConsole.log.apply(console, arguments);
                    self.displayConsoleLogs();
                };
                
                console.error = function() {
                    self.consoleLogs.push(['❌ ERROR', new Date().toLocaleTimeString(), ...arguments]);
                    self.originalConsole.error.apply(console, arguments);
                    self.displayConsoleLogs();
                };
                
                console.warn = function() {
                    self.consoleLogs.push(['⚠️ WARN', new Date().toLocaleTimeString(), ...arguments]);
                    self.originalConsole.warn.apply(console, arguments);
                    self.displayConsoleLogs();
                };
            }
        },
        
        displayConsoleLogs: function() {
            var output = document.getElementById('hirako-console-output');
            if(output) {
                output.innerHTML = this.consoleLogs.map(log => {
                    var color = log[0].includes('ERROR') ? '#ff6b6b' : (log[0].includes('WARN') ? '#ffa500' : '#4ecdc4');
                    return `<div style="border-bottom:1px solid #2a2a3a;padding:3px;"><span style="color:${color};">${log.join(' ')}</span></div>`;
                }).join('') || '<i>No logs yet...</i>';
                output.scrollTop = output.scrollHeight;
            }
        },
        
        executeJS: function(code) {
            try {
                var result = eval(code);
                this.consoleLogs.push(['▶ EXEC', new Date().toLocaleTimeString(), 'Result:', result]);
                this.displayConsoleLogs();
                this.log(`Code executed: ${code.substring(0, 50)}`);
            } catch(e) {
                this.consoleLogs.push(['❌ ERROR', new Date().toLocaleTimeString(), e.message]);
                this.displayConsoleLogs();
            }
        },
        
        // Elements Tab - DOM Tree Viewer
        showElementsTab: function() {
            var content = document.getElementById('hirako-content');
            var tree = this.generateDOMTree(document.body, 0);
            content.innerHTML = `
                <div style="margin-bottom:5px;">
                    <button id="hirako-refresh-tree" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">🔄 Refresh</button>
                    <span style="margin-left:10px;color:#4ecdc4;">Total elements: ${document.querySelectorAll('*').length}</span>
                </div>
                <div id="hirako-dom-tree" style="background:#0a0a0f;height:200px;overflow:auto;padding:5px;font-size:11px;border-radius:5px;">${tree}</div>
            `;
            
            document.getElementById('hirako-refresh-tree').onclick = () => {
                var newTree = this.generateDOMTree(document.body, 0);
                document.getElementById('hirako-dom-tree').innerHTML = newTree;
            };
        },
        
        generateDOMTree: function(node, level) {
            if(node.nodeType === Node.ELEMENT_NODE && !node.id?.includes('hirako')) {
                var indent = '  '.repeat(level);
                var tag = node.tagName.toLowerCase();
                var id = node.id ? '#' + node.id : '';
                var cls = node.className ? '.' + node.className.toString().split(' ')[0] : '';
                var content = indent + `<span style="color:#ff6b6b;">&lt;${tag}${id}${cls}&gt;</span>\n`;
                
                for(var i = 0; i < node.children.length; i++) {
                    if(!node.children[i].id?.includes('hirako')) {
                        content += this.generateDOMTree(node.children[i], level + 1);
                    }
                }
                
                if(node.children.length === 0 && node.textContent.trim()) {
                    var text = node.textContent.trim().substring(0, 50);
                    if(text) content += indent + '  ' + `<span style="color:#4ecdc4;">"${text}"</span>\n`;
                }
                
                content += indent + `<span style="color:#ff6b6b;">&lt;/${tag}&gt;</span>\n`;
                return content;
            }
            return '';
        },
        
        // Network Tab - Monitor network requests
        networkRequests: [],
        
        showNetworkTab: function() {
            var content = document.getElementById('hirako-content');
            content.innerHTML = `
                <div style="margin-bottom:10px;">
                    <button id="hirako-start-network" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">▶ Start Monitoring</button>
                    <button id="hirako-clear-network" style="background:#6b6b6b;color:#fff;border:none;padding:5px;border-radius:3px;margin-left:5px;cursor:pointer;">Clear</button>
                </div>
                <div id="hirako-network-list" style="background:#0a0a0f;height:200px;overflow:auto;padding:5px;font-size:10px;border-radius:5px;">
                    <i>Klik "Start Monitoring" untuk melihat network requests</i>
                </div>
            `;
            
            document.getElementById('hirako-start-network').onclick = () => this.monitorNetwork();
            document.getElementById('hirako-clear-network').onclick = () => {
                this.networkRequests = [];
                this.displayNetworkRequests();
            };
        },
        
        monitorNetwork: function() {
            var self = this;
            if(window.fetch) {
                var originalFetch = window.fetch;
                window.fetch = function() {
                    var url = arguments[0];
                    var startTime = performance.now();
                    self.networkRequests.push(['📡 REQ', new Date().toLocaleTimeString(), url]);
                    self.displayNetworkRequests();
                    
                    return originalFetch.apply(this, arguments).then(response => {
                        var endTime = performance.now();
                        self.networkRequests.push(['✅ RES', new Date().toLocaleTimeString(), url, `${Math.round(endTime - startTime)}ms`]);
                        self.displayNetworkRequests();
                        return response;
                    });
                };
            }
            
            if(window.XMLHttpRequest) {
                var originalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function() {
                    this._url = arguments[1];
                    this._method = arguments[0];
                    var startTime = performance.now();
                    self.networkRequests.push(['📡 XHR', new Date().toLocaleTimeString(), this._method, this._url]);
                    self.displayNetworkRequests();
                    
                    this.addEventListener('load', function() {
                        var endTime = performance.now();
                        self.networkRequests.push(['✅ XHR Done', new Date().toLocaleTimeString(), this._url, `${Math.round(endTime - startTime)}ms`, `Status: ${this.status}`]);
                        self.displayNetworkRequests();
                    });
                    
                    return originalOpen.apply(this, arguments);
                };
            }
            
            this.log('🌐 Network monitoring aktif!');
        },
        
        displayNetworkRequests: function() {
            var container = document.getElementById('hirako-network-list');
            if(container) {
                container.innerHTML = this.networkRequests.map(req => {
                    var color = req[0].includes('✅') ? '#4ecdc4' : '#ffa500';
                    return `<div style="border-bottom:1px solid #2a2a3a;padding:3px;"><span style="color:${color};">${req.join(' ')}</span></div>`;
                }).join('') || '<i>No network requests captured...</i>';
            }
        },
        
        // Storage Tab
        showStorageTab: function() {
            var content = document.getElementById('hirako-content');
            var localStorage = JSON.stringify(window.localStorage, null, 2);
            var sessionStorage = JSON.stringify(window.sessionStorage, null, 2);
            var cookies = document.cookie;
            
            content.innerHTML = `
                <div style="margin-bottom:10px;">
                    <button id="hirako-clear-storage" style="background:#ff6b6b;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">🗑 Clear All Storage</button>
                </div>
                <div style="background:#0a0a0f;height:200px;overflow:auto;padding:5px;font-size:10px;border-radius:5px;">
                    <b>💾 Local Storage:</b><br>
                    <pre style="color:#4ecdc4;">${localStorage || '(empty)'}</pre>
                    <hr>
                    <b>💿 Session Storage:</b><br>
                    <pre style="color:#4ecdc4;">${sessionStorage || '(empty)'}</pre>
                    <hr>
                    <b>🍪 Cookies:</b><br>
                    <pre style="color:#4ecdc4;">${cookies || '(empty)'}</pre>
                </div>
            `;
            
            document.getElementById('hirako-clear-storage').onclick = () => {
                if(confirm('Clear all storage?')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    this.log('Storage cleared!');
                    this.showStorageTab();
                }
            };
        },
        
        // Performance Tab
        showPerformanceTab: function() {
            var timing = window.performance.timing;
            var loadTime = timing.loadEventEnd - timing.navigationStart;
            var domTime = timing.domComplete - timing.domInteractive;
            var requestTime = timing.responseEnd - timing.requestStart;
            
            var content = document.getElementById('hirako-content');
            content.innerHTML = `
                <div style="background:#0a0a0f;padding:10px;border-radius:5px;font-size:11px;">
                    <b>⚡ Performance Metrics:</b><br><br>
                    🚀 Page Load: <span style="color:#4ecdc4;">${loadTime}ms</span><br>
                    📄 DOM Ready: <span style="color:#4ecdc4;">${domTime}ms</span><br>
                    🌐 Network Request: <span style="color:#4ecdc4;">${requestTime}ms</span><br>
                    🎯 Memory Used: <span style="color:#4ecdc4;">${Math.round(performance.memory?.usedJSHeapSize / 1048576) || 'N/A'} MB</span><br>
                    📊 Total Elements: <span style="color:#4ecdc4;">${document.querySelectorAll('*').length}</span><br>
                    💾 DOM Size: <span style="color:#4ecdc4;">${document.documentElement.outerHTML.length.toLocaleString()} bytes</span><br>
                    <br>
                    <button id="hirako-gc" style="background:#ff6b6b;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">🧹 Run GC (if available)</button>
                </div>
            `;
            
            document.getElementById('hirako-gc').onclick = () => {
                if(window.gc) {
                    window.gc();
                    this.log('Garbage collection triggered');
                } else {
                    this.log('GC not exposed. Run Chrome with --js-flags="--expose-gc"');
                }
            };
        },
        
        // Utility functions
        log: function(msg) {
            if(this.consoleLogs) {
                this.consoleLogs.push(['📢 HIRAKO', new Date().toLocaleTimeString(), msg]);
                this.displayConsoleLogs();
            }
        },
        
        attachEvents: function() {
            // Add resize handler for panel
            window.addEventListener('resize', () => {
                if(this.panel) {
                    // Maintain panel position
                }
            });
        },
        
        show: function() {
            if(this.panel) this.panel.style.display = 'block';
        },
        
        destroy: function() {
            if(this.panel) this.panel.remove();
            this.active = false;
            
            // Restore console
            if(this.originalConsole.log) {
                console.log = this.originalConsole.log;
                console.error = this.originalConsole.error;
                console.warn = this.originalConsole.warn;
            }
        }
    };
    
    // Start Hirako
    Hirako.init();
    
    // Make globally accessible
    window.Hirako = Hirako;
})();
