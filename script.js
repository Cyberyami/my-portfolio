document.addEventListener('DOMContentLoaded', function(){
  initSmoothScroll();

  generateAsciiPattern();
  initAsciiTrail();
  initInteractiveTerminal();
  initBitmapConverter();
  initProjectsPage();
});

function initProjectsPage(){
  var app = document.getElementById('projectsApp');
  if(!app) return;

  var listView = document.getElementById('projectsListView');
  var detailView = document.getElementById('projectsDetailView');
  var backBtn = document.getElementById('projectBackBtn');

  var titleEl = document.getElementById('projectTitle');
  var leadEl = document.getElementById('projectLead');
  var codeEl = document.getElementById('projectCode');
  var mediaEl = document.getElementById('projectMedia');
  var roadmapEl = document.getElementById('projectRoadmap');
  var blogEl = document.getElementById('projectBlog');
  var primaryLink = document.getElementById('projectPrimaryLink');

  if(!listView || !detailView || !backBtn || !titleEl || !leadEl || !codeEl || !roadmapEl || !blogEl) return;

  var projects = {
    'bitmap-converter': {
      title: 'Bitmap Converter',
      lead: 'Drag & drop upload, selectable algorithm, adjustable pixel size and threshold, plus PNG export.',
      images: [
        {src: 'img/img.png', alt: 'Bitmap Converter preview image'},
        {src: 'img/img.png', alt: 'Bitmap Converter preview image (2)'}
      ],
      code: "// Example: apply dithering to ImageData\nconst algo = 'floyd';\nconst threshold = 128;\nconst outData = window.DitherEngine.apply(imgData, algo, { threshold });",
      roadmap: ['Add palette options (2–4 colors)', 'Batch export (ZIP)', 'Presets for common styles'],
      blog: ['Why dithering still looks great in 2025', 'Picking the right algorithm for line art vs photos'],
      primaryLink: { href: 'bitmap.html', label: 'Open tool' }
    },
    'portfolio-terminal': {
      title: 'Portfolio Terminal',
      lead: 'A minimal terminal UI that outputs “commands” as animated lines.',
      images: [
        {src: 'img/img.png', alt: 'Portfolio preview image'},
        {src: 'img/img.png', alt: 'Portfolio preview image (2)'}
      ],
      code: "// Example: command output typing\nfunction typeOutput(container, lines, index) {\n  if (index >= lines.length) return;\n  const line = document.createElement('div');\n  line.className = 'output-line';\n  line.textContent = lines[index];\n  container.appendChild(line);\n  setTimeout(() => typeOutput(container, lines, index + 1), 50);\n}",
      roadmap: ['Add a dedicated projects command (later)', 'Command history + keyboard input', 'More “apps” inside the terminal'],
      blog: ['Design notes: terminal UI without frameworks', 'Keeping the vibe consistent across pages'],
      primaryLink: { href: 'index.html', label: 'Open page' }
    },
    'dither-engine': {
      title: 'Dither Engine',
      lead: 'A lightweight collection of dithering kernels and ordered-matrix patterns.',
      images: [],
      code: "// Example: ordered dither (conceptual)\nconst bayer4 = [\n  [ 0,  8,  2, 10],\n  [12,  4, 14,  6],\n  [ 3, 11,  1,  9],\n  [15,  7, 13,  5],\n];",
      roadmap: ['Better performance for large images', 'Unit tests for kernels', 'Optional Web Worker mode'],
      blog: ['Error diffusion vs ordered dither: tradeoffs'],
      primaryLink: null
    }
  };

  function setHidden(el, hidden){
    if(!el) return;
    if(hidden) el.setAttribute('hidden','');
    else el.removeAttribute('hidden');
  }

  function clearList(el){
    while(el && el.firstChild) el.removeChild(el.firstChild);
  }

  function renderList(listEl, items){
    clearList(listEl);
    (items || []).forEach(function(text){
      var li = document.createElement('li');
      li.textContent = text;
      listEl.appendChild(li);
    });
  }

  function renderMedia(items){
    if(!mediaEl) return;
    clearList(mediaEl);
    if(!items || !items.length){
      setHidden(mediaEl, true);
      return;
    }
    items.forEach(function(img){
      var image = document.createElement('img');
      image.className = 'project-img';
      image.src = img.src;
      image.alt = img.alt || '';
      mediaEl.appendChild(image);
    });
    setHidden(mediaEl, false);
  }

  function showList(){
    setHidden(detailView, true);
    setHidden(listView, false);
  }

  function showDetail(slug){
    var project = projects[slug];
    if(!project){
      showList();
      return;
    }

    titleEl.textContent = project.title;
    leadEl.textContent = project.lead || '';
    codeEl.textContent = project.code || '';
    renderMedia(project.images);
    renderList(roadmapEl, project.roadmap);
    renderList(blogEl, project.blog);

    if(primaryLink && project.primaryLink && project.primaryLink.href){
      primaryLink.href = project.primaryLink.href;
      primaryLink.textContent = project.primaryLink.label || 'Open';
      setHidden(primaryLink, false);
    }else if(primaryLink){
      setHidden(primaryLink, true);
    }

    setHidden(listView, true);
    setHidden(detailView, false);
  }

  function getSlugFromHash(){
    var raw = (window.location.hash || '').replace(/^#/, '');
    return raw;
  }

  function clearHash(){
    try{
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }catch(err){
      window.location.hash = '';
    }
  }

  var initial = getSlugFromHash();
  if(initial) showDetail(initial);
  else showList();

  app.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('[data-project-link]') : null;
    if(!a) return;
    var slug = a.getAttribute('data-project-link');
    if(!slug) return;
    e.preventDefault();
    window.location.hash = slug;
  });

  window.addEventListener('hashchange', function(){
    var slug = getSlugFromHash();
    if(slug) showDetail(slug);
    else showList();
  });

  backBtn.addEventListener('click', function(){
    clearHash();
    showList();
  });
}

function generateAsciiPattern() {
  var container = document.getElementById('asciiPattern');
  if (!container) return;
  
  container.innerHTML = '';
  
  var chars = ['·', '•', '∘', '○', '+', '*', '✦', '✧', '◦', '⋆', '˙'];
  var animations = ['twinkle', 'float', 'pulse', 'drift'];
  var numDots = 80;
  
  for (var i = 0; i < numDots; i++) {
    var dot = document.createElement('span');
    dot.className = 'ascii-dot';
    dot.textContent = chars[Math.floor(Math.random() * chars.length)];
    dot.style.left = (Math.random() * 100) + '%';
    dot.style.top = (Math.random() * 100) + '%';
    
    var anim = animations[Math.floor(Math.random() * animations.length)];
    dot.classList.add(anim);
    dot.style.animationDelay = (Math.random() * 5) + 's';
    dot.style.animationDuration = (3 + Math.random() * 5) + 's';
    
    container.appendChild(dot);
  }
}

function initBitmapConverter(){
  var uploadArea = document.getElementById('uploadArea');
  var imageInput = document.getElementById('imageInput');
  var srcCanvas = document.getElementById('srcCanvas');
  var outCanvas = document.getElementById('outCanvas');
  var statusEl = document.getElementById('bitmapStatus');
  var algorithmSelect = document.getElementById('algorithmSelect');
  var scaleInput = document.getElementById('scaleInput');
  var scaleValue = document.getElementById('scaleValue');
  var thresholdInput = document.getElementById('thresholdInput');
  var thresholdValue = document.getElementById('thresholdValue');
  var resetBtn = document.getElementById('resetBtn');
  var downloadBtn = document.getElementById('downloadBtn');

  if(!uploadArea || !imageInput || !srcCanvas || !outCanvas){
    if(statusEl) statusEl.textContent = 'Bitmap UI elements not found on this page.';
    console.warn('initBitmapConverter: missing elements', {uploadArea, imageInput, srcCanvas, outCanvas});
    return;
  }
  if(statusEl) statusEl.textContent = 'Ready — choose an image.';

  var img = new Image();
  var originalImage = null;

  uploadArea.addEventListener('dragover', function(e){ e.preventDefault(); uploadArea.classList.add('drag'); });
  uploadArea.addEventListener('dragleave', function(e){ e.preventDefault(); uploadArea.classList.remove('drag'); });
  uploadArea.addEventListener('drop', function(e){
    e.preventDefault(); uploadArea.classList.remove('drag');
    if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]){
      handleFile(e.dataTransfer.files[0]);
    }
  });

  imageInput.addEventListener('change', function(e){
    if(this.files && this.files[0]) handleFile(this.files[0]);
  });

  function syncSliderLabels(){
    if(scaleValue && scaleInput) scaleValue.textContent = String(scaleInput.value);
    if(thresholdValue && thresholdInput) thresholdValue.textContent = String(thresholdInput.value);
  }

  if(scaleInput) scaleInput.addEventListener('input', syncSliderLabels);
  if(thresholdInput) thresholdInput.addEventListener('input', syncSliderLabels);
  syncSliderLabels();

  var chooseFileBtn = document.getElementById('chooseFileBtn');
  if(chooseFileBtn){
    chooseFileBtn.addEventListener('click', function(e){
      e.stopPropagation();
      try{ imageInput.click(); }catch(err){}
    });
  }

  function handleFile(file){
    var reader = new FileReader();
    reader.onload = function(ev){
      img = new Image();
      img.onload = function(){
        originalImage = img;
        drawSourcePreview(img, srcCanvas);
        scheduleApply();
        if(statusEl) statusEl.textContent = 'Loaded: ' + file.name + ' (' + originalImage.width + 'x' + originalImage.height + ')';
      };
      img.src = ev.target.result;
    };
    reader.onerror = function(err){ if(statusEl) statusEl.textContent = 'File read error'; };
    reader.readAsDataURL(file);
  }

  function drawSourcePreview(image, canvas){
    var maxW = 420;
    var ratio = Math.min(1, maxW / image.width);
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image, 0,0, canvas.width, canvas.height);
  }

  function drawOriginalToOut(image){
    var ctx = outCanvas.getContext('2d');
    outCanvas.width = Math.min(600, image.width);
    outCanvas.height = Math.round(image.height * (outCanvas.width / image.width));
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0,0,outCanvas.width,outCanvas.height);
    ctx.drawImage(image,0,0,outCanvas.width,outCanvas.height);
  }

  function applyDither(){
    if(!originalImage) return;
    var pixelSize = Math.max(1, parseInt(scaleInput.value) || 1);
    var smallW = Math.max(1, Math.floor(originalImage.width / pixelSize));
    var smallH = Math.max(1, Math.floor(originalImage.height / pixelSize));
    var small = document.createElement('canvas');
    small.width = smallW; small.height = smallH;
    var sctx = small.getContext('2d');
    sctx.imageSmoothingEnabled = false;
    sctx.clearRect(0,0,smallW,smallH);
    sctx.drawImage(originalImage, 0,0, smallW, smallH);

    var imgData = sctx.getImageData(0,0,smallW,smallH);
    var algo = algorithmSelect.value || 'nearest';
    var threshold = parseInt(thresholdInput.value) || 128;
    var outData = window.DitherEngine.apply(imgData, algo, {threshold:threshold});

    var temp = document.createElement('canvas');
    temp.width = smallW; temp.height = smallH;
    var tctx = temp.getContext('2d');
    tctx.putImageData(outData, 0,0);

    var outW = smallW * pixelSize;
    var outH = smallH * pixelSize;
    outCanvas.width = outW;
    outCanvas.height = outH;
    var octx = outCanvas.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.clearRect(0,0,outW,outH);
    octx.drawImage(temp, 0,0, outW, outH);
  }

  var applyTimer = null;
  function scheduleApply(){
    if(!originalImage) return;
    if(applyTimer) clearTimeout(applyTimer);
    applyTimer = setTimeout(function(){
      applyTimer = null;
      applyDither();
    }, 40);
  }

  algorithmSelect && algorithmSelect.addEventListener('change', function(){ scheduleApply(); });
  scaleInput && scaleInput.addEventListener('input', function(){ scheduleApply(); });
  thresholdInput && thresholdInput.addEventListener('input', function(){ scheduleApply(); });

  resetBtn && resetBtn.addEventListener('click', function(){
    if(originalImage) drawOriginalToOut(originalImage);
  });
  downloadBtn && downloadBtn.addEventListener('click', function(){
    if(!outCanvas) return;
    var url = outCanvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = url; a.download = 'dithered.png';
    document.body.appendChild(a); a.click(); a.remove();
  });
}

function initAsciiTrail() {
  var chars = ['.', ':', '*', '+', '#', '@'];
  var trailLength = 12;
  var trail = [];
  var lastParticleTime = 0;
  var particleDelay = 40;
  var isMoving = false;
  var moveTimeout;
  
  document.addEventListener('mousemove', function(e) {
    isMoving = true;
    clearTimeout(moveTimeout);
    
    moveTimeout = setTimeout(function() {
      isMoving = false;
    }, 100);
    
    if (isMoving && (Date.now() - lastParticleTime) > particleDelay) {
      createTrailParticle(e.clientX, e.clientY);
      lastParticleTime = Date.now();
    }
  });
  
  function createTrailParticle(x, y) {
    var particle = document.createElement('div');
    particle.className = 'ascii-particle';
    particle.textContent = chars[Math.floor(Math.random() * chars.length)];
    
    var offsetX = (Math.random() - 0.5) * 30;
    var offsetY = (Math.random() - 0.5) * 30;
    
    particle.style.left = (x + offsetX) + 'px';
    particle.style.top = (y + offsetY) + 'px';
    
    document.body.appendChild(particle);
    
    trail.push({
      element: particle,
      birthTime: Date.now()
    });
    
    if (trail.length > trailLength) {
      var oldParticle = trail.shift();
      oldParticle.element.remove();
    }
    
    setTimeout(function() {
      particle.style.opacity = '0';
    }, 10);
    
    setTimeout(function() {
      if (particle.parentNode) {
        particle.remove();
      }
    }, 600);
  }
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      var targetId = this.getAttribute('href');
      var target = document.querySelector(targetId);
      if (target) {
        smoothScrollTo(target, 1000);
      }
    });
  });
}

function smoothScrollTo(target, duration) {
  var startPosition = window.pageYOffset;
  var targetPosition = target.getBoundingClientRect().top + startPosition;
  var startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    var timeElapsed = currentTime - startTime;
    var progress = Math.min(timeElapsed / duration, 1);
    
    var ease = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    window.scrollTo(0, startPosition + (targetPosition - startPosition) * ease);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }
  
  requestAnimationFrame(animation);
}

function initInteractiveTerminal() {
  var cmdBtns = document.querySelectorAll('.cmd-btn');
  var dynamicOutput = document.getElementById('dynamicOutput');
  var cursor = document.getElementById('cursor');
  var newTerminalWrap = document.getElementById('newTerminalWrap');
  var newTerminal = document.getElementById('newTerminal');
  var newCloseBtn = document.getElementById('newCloseBtn');
  
  if (!cmdBtns.length || !dynamicOutput) return;

  if(newTerminalWrap && newTerminal && newCloseBtn){
    newCloseBtn.addEventListener('click', function(){
      newTerminal.classList.add('closing');
      setTimeout(function(){
        newTerminalWrap.style.display = 'none';
        newTerminal.classList.remove('closing');
      }, 300);
    });
  }
  
  function getUptime() {
    var now = new Date();
    var start = new Date('2024-01-01');
    var diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diff + ' days';
  }
  
  function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  }
  
  function getDate() {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }

  var commands = {
    neofetch: {
      output: [
        '                                                ',
        '    ████████╗██╗   ██╗██████╗ ███████╗          typedef@portfolio',
        '    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝          -----------------',
        '       ██║    ╚████╔╝ ██████╔╝█████╗            OS: PortfolioOS 1.0',
        '       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝            Host: ' + navigator.platform,
        '       ██║      ██║   ██║     ███████╗          Uptime: ' + getUptime(),
        '       ╚═╝      ╚═╝   ╚═╝     ╚══════╝          Shell: terminal.js',
        '                                                Resolution: ' + window.innerWidth + 'x' + window.innerHeight,
        '    ██████╗ ███████╗███████╗                    Theme: Cyberpunk Dark',
        '    ██╔══██╗██╔════╝██╔════╝                    Font: Handjet Mono',
        '    ██║  ██║█████╗  █████╗                      Browser: ' + navigator.userAgent.split(' ').pop(),
        '    ██║  ██║██╔══╝  ██╔══╝                      Time: ' + getCurrentTime(),
        '    ██████╔╝███████╗██║                         Date: ' + getDate(),
        '    ╚═════╝ ╚══════╝╚═╝                         ',
        '                                                ',
        '    ● ● ● ● ● ● ● ●                             ',
        ''
      ]
    },
    about: {
      output: [
        '┌─────────────────────────────────────────────┐',
        '│  ABOUT ME                                   │',
        '└─────────────────────────────────────────────┘',
        '',
        'Hello! I\'m Hakkı Onur Hürmüzlü, 22 years old Software Engineer Student from Turkiye.',
        '',
        '',
        'I love coding and creating projects that make a difference. My interests include web development,',
        'mobile apps, and diving into the world of AI and machine learning. I enjoy collaborating on open-source',
        'projects and continuously learning new technologies to enhance my skills.',
      ]
    },
    skills: {
      output: [
        '┌─────────────────────────────────────────────┐',
        '│  SKILLS                                     │',
        '└─────────────────────────────────────────────┘',
        '',
        '  Languages:',
        '  ├── Python',
        '  ├── C / C++',
        '  ├── JavaScript',
        '  └── Dart',
        '',
        '  AI / ML:',
        '  ├── Computer Vision (OpenCV: ROI overlays, preprocessing pipelines)',
        '  ├── Deep Learning (TensorFlow/Keras: model training + inference)',
        '  ├── Object Detection (YOLOv8: dataset prep, training, evaluation)',
        '  └── Prompt Engineering (LLM prompting for ideation + structured outputs)',

        '',
        '  Web Development:',
        '  ├── HTML / CSS',
        '  ├── Tailwind / GSAP (UI & Animations)',
        '  └── Next.js / React',
        '',
        '  Mobile:',
        '  └── Flutter + Firebase',
        '',
        '  Backend / Databases:',
        '  ├── Node.js',
        '  ├── Express',
        '  └── Firestore / SQL',
        '',
        '  Tools:',
        '  ├── Git',
        '  ├── Linux',
        '  └── VS Code'
      ]
    },
    projects: {
      output: [
        '┌─────────────────────────────────────────────┐',
        '│  PROJECTS                                   │',
        '└─────────────────────────────────────────────┘',
        '',
        '  [01] Portfolio Terminal',
        '  └── This very website! Pure HTML/CSS/JS',
        '',
        '  [02] Project Alpha',
        '  └── A cool thing I\'m working on',
        '',
        '  [03] Secret Project',
        '  └── Coming soon... 👀',
        '',
        '  → More on GitHub: github.com/typedef'
      ]
    },
    important: {
      output: [
        '┌─────────────────────────────────────────────┐',
        '│  IMPORTANT                                  │',
        '└─────────────────────────────────────────────┘',
        '',
        'The truest guide is knowledge, science. ',
        'To seek guidance outside of knowledge ',
        'and science is negligence, ignorance, and deviation.',
        '— Mustafa Kemal Atatürk',
      ]
      },
  };
  
  cmdBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var cmd = btn.getAttribute('data-cmd');
      executeCommand(cmd);
    });
  });
  
  function executeCommand(cmd) {
    if (cmd === 'clear') {
      dynamicOutput.innerHTML = '';
      return;
    }
    
    var cmdData = commands[cmd];
    if (!cmdData) return;
    
    var cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-line';
    cmdLine.innerHTML = '<span class="prompt">typedef@portfolio:~$</span><span class="command typing-anim">' + cmd + '</span>';
    dynamicOutput.appendChild(cmdLine);
    
    setTimeout(function() {
      var outputDiv = document.createElement('div');
      outputDiv.className = 'terminal-output animate-in';
      dynamicOutput.appendChild(outputDiv);
      
      typeOutput(outputDiv, cmdData.output, 0);
    }, 300);

    if(cmd === 'important' && newTerminalWrap && newTerminal){
      newTerminalWrap.style.display = 'flex';
      newTerminal.classList.add('opening');
      setTimeout(function(){
        newTerminal.classList.remove('opening');
      }, 400);
    }
    
    scrollToBottom();
  }
  
  function typeOutput(container, lines, index) {
    if (index >= lines.length) return;
    
    var lineDiv = document.createElement('div');
    lineDiv.className = 'output-line';
    lineDiv.textContent = lines[index];
    container.appendChild(lineDiv);
    
    scrollToBottom();
    
    setTimeout(function() {
      typeOutput(container, lines, index + 1);
    }, 50);
  }
  
  function scrollToBottom() {
    var outputScroll = document.querySelector('.terminal-output-scroll');
    if (outputScroll) {
      requestAnimationFrame(function() {
        outputScroll.scrollTop = outputScroll.scrollHeight;
      });
    }
  }
  
  setInterval(function() {
    if (cursor) {
      cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }
  }, 500);
}
