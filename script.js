document.addEventListener('DOMContentLoaded', function(){
  var closeBtn = document.getElementById('closeBtn');
  var term = document.getElementById('terminal');
  var fileIcon = document.getElementById('fileIcon');
  
  initSmoothScroll();
  
  if(closeBtn && term && fileIcon){
    closeBtn.addEventListener('click', function(){
      term.classList.add('closing');
      setTimeout(function(){
        term.style.display = 'none';
        fileIcon.style.display = 'flex';
      }, 300);
    });
    
    fileIcon.addEventListener('click', function(){
      fileIcon.style.display = 'none';
      term.style.display = 'block';
      term.classList.remove('closing');
    });
  }

  var newFileIcon = document.getElementById('newFileIcon');
  var newTerminalWrap = document.getElementById('newTerminalWrap');
  var newTerminal = document.getElementById('newTerminal');
  var newCloseBtn = document.getElementById('newCloseBtn');

  if(newFileIcon && newTerminalWrap && newTerminal && newCloseBtn){
    newFileIcon.addEventListener('click', function(){
      newFileIcon.classList.add('hiding');
      setTimeout(function(){
        newFileIcon.style.display = 'none';
        newFileIcon.classList.remove('hiding');
        newTerminalWrap.style.display = 'flex';
        newTerminal.classList.add('opening');
        setTimeout(function(){
          newTerminal.classList.remove('opening');
        }, 400);
      }, 300);
    });

    newCloseBtn.addEventListener('click', function(){
      newTerminal.classList.add('closing');
      setTimeout(function(){
        newTerminalWrap.style.display = 'none';
        newTerminal.classList.remove('closing');
        newFileIcon.style.display = 'flex';
        newFileIcon.classList.add('showing');
        setTimeout(function(){
          newFileIcon.classList.remove('showing');
        }, 400);
      }, 300);
    });
  }

  generateAsciiPattern();
  initAsciiTrail();
  initInteractiveTerminal();
});

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
  
  if (!cmdBtns.length || !dynamicOutput) return;
  
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
    whoami: {
      output: [
        '╔══════════════════════════════════════════════╗',
        '║  TYPEDEF (Hakkı Onur) -  Software Engineer   ║',
        '╚══════════════════════════════════════════════╝',
        '',
        '→ Passionate about building cool stuff',
        '→ Love clean code and minimal design',
        '→ Currently exploring: Artificial Intelligence',
        '→ Based in: Turkiye, Ankara'
      ]
    },
    about: {
      output: [
        '┌─────────────────────────────────────────────┐',
        '│  ABOUT ME                                   │',
        '└─────────────────────────────────────────────┘',
        '',
        'I\'m a developer who loves turning ideas into',
        'reality through code. My journey started with',
        'curiosity and evolved into a passion.',
        '',
        '• Coffee-driven development 🟫',
        '• Always learning, always building'
      ]
    },
    skills: {
      output: [
        '┌─────────────────────────────────────────────┐',
        '│  SKILLS                                     │',
        '└─────────────────────────────────────────────┘',
        '',
        '  Languages:',
        '  ├── JavaScript',
        '  ├── C / C++',
        '  ├── Python',
        '  └── Dart',
        '',
        '  Web Development:',
        '  ├── HTML / CSS',
        '  ├── Tailwind / GSAP (UI & Animations)',
        '  └── Next.js / React',
        '',
        '  Mobile:',
        '  └── Flutter + Firebase',
        '',
        '  AI / ML:',
        '  ├── TensorFlow',
        '  ├── Keras',
        '  ├── OpenCV',
        '  └── Prompt Engineering',
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
    }
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
      outputScroll.scrollTop = outputScroll.scrollHeight;
    }
  }
  
  setInterval(function() {
    if (cursor) {
      cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }
  }, 500);
}
