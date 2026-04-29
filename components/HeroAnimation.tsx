import React, { useEffect, useState, useRef } from 'react';
import './HeroAnimation.css';

export const HeroAnimation: React.FC = () => {
  const [curScene, setCurScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ts, setTs] = useState(1499);
  const totalScenes = 5;
  const ivRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTs(prev => prev > 0 ? prev - 1 : 1500);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const next = () => {
    setCurScene(prev => (prev + 1) % totalScenes);
  };

  useEffect(() => {
    if (playing) { ivRef.current = setInterval(next, 4500); } 
    else { if (ivRef.current) clearInterval(ivRef.current); }
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, [playing]);

  const m = Math.floor(ts / 60);
  const s = ts % 60;
  const timerStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const rs = Math.max(0, ts - 360);
  const roomStr = `${String(Math.floor(rs / 60)).padStart(2, '0')}:${String(rs % 60).padStart(2, '0')}`;

  return (
    <div className="trailer" id="trailer" onClick={next}>
      <div className="bg-gradient"></div>
      <div className="stars" id="stars"><StarsLayer /></div>
      <div className="orb" style={{width:'280px', height:'280px', background:'radial-gradient(circle,rgba(21,138,242,0.08),transparent)', top:'-80px', right:'-60px', animationDuration:'9s'}}></div>
      <div className="orb" style={{width:'200px', height:'200px', background:'radial-gradient(circle,rgba(139,92,246,0.07),transparent)', bottom:'-60px', left:'-40px', animationDuration:'11s', animationDirection:'reverse'}}></div>
      <div className="orb" style={{width:'150px', height:'150px', background:'radial-gradient(circle,rgba(6,182,212,0.06),transparent)', bottom:'80px', right:'20px', animationDuration:'7s'}}></div>

      <div className="logo-wrap">
        <div className="logo-svg-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 400 400"><g fillRule="evenodd"><path d="M95.1 21.889c-3.468.078-5.9.293-5.9.522 0 .215-1.243.389-2.776.389-1.527 0-2.888.18-3.024.4s-.867.4-1.624.4-1.376.18-1.376.4-.619.4-1.376.4-1.488.18-1.624.4-.597.4-1.024.4-.776.18-.776.4-.452.4-1.005.4-1.363.18-1.8.4l-1.59.8c-.437.22-1.067.4-1.4.4s-.605.18-.605.4-.36.4-.8.4-.8.18-.8.4-.36.4-.8.4-.8.18-.8.4-.36.4-.8.4-.8.18-.8.4-.32.4-.712.4-.971.36-1.288.8-.771.8-1.009.8c-.666 0-2.584.963-2.588 1.3-.002.165-.239.3-.528.3-.288 0-.873.32-1.3.711-.426.391-1.405 1.147-2.175 1.681-.77.533-1.49 1.081-1.6 1.218s-.515.365-.9.507-.7.534-.7.87a.61.61 0 0 1-.604.613c-.789 0-9.796 9.007-9.796 9.796a.61.61 0 0 1-.613.604c-.336 0-.73.315-.875.7s-.769 1.177-1.387 1.76c-.619.584-1.125 1.269-1.125 1.522s-.539 1.037-1.198 1.74-1.199 1.503-1.2 1.778-.182.5-.402.5-.4.278-.4.617-.36 1.003-.8 1.475-.8 1.235-.8 1.695-.36 1.096-.8 1.413-.804.942-.809 1.388c-.005.447-.361 1.262-.791 1.812s-.786 1.405-.791 1.9-.144.901-.309.903c-.447.005-1.3 2.023-1.3 3.077 0 .506-.18.92-.4.92s-.4.439-.4.976-.18 1.088-.4 1.224-.4.957-.4 1.824-.18 1.576-.4 1.576-.4.529-.4 1.176-.18 1.288-.4 1.424-.4 1.461-.4 2.944-.168 2.867-.372 3.076c-1.304 1.331-1.301 220.215.004 221.56.202.209.368 1.413.368 2.676s.18 2.408.4 2.544.4.867.4 1.624.18 1.376.4 1.376.4.72.4 1.6.18 1.6.4 1.6.4.439.4.976.18 1.088.4 1.224.4.58.4.986.346 1.43.77 2.276a49 49 0 0 1 1.297 2.838c.291.715.664 1.3.831 1.3s.302.416.302.925c0 .508.36 1.311.8 1.783s.8 1.136.8 1.475.18.617.4.617.4.36.4.8.18.8.4.8.4.225.401.5c0 .275.54 1.13 1.199 1.9s1.199 1.625 1.199 1.9c.001.275.151.5.333.5s.588.495.9 1.1 1.063 1.577 1.668 2.16 1.1 1.232 1.1 1.44c0 .496 8.224 8.9 8.709 8.9.205 0 .903.507 1.551 1.126.648.62 1.485 1.244 1.859 1.388.375.143.681.537.681.873 0 .337.32.613.712.613s.971.36 1.288.8.831.8 1.141.8.856.316 1.212.703 1.142.957 1.747 1.267c.605.311 1.1.715 1.1.898 0 .182.36.332.8.332s.801.135.803.3c.004.359 1.941 1.3 2.677 1.3.286 0 .521.135.523.3.004.359 1.941 1.3 2.677 1.3.286 0 .52.18.52.4s.458.4 1.017.4 1.403.36 1.875.8 1.354.8 1.96.8 1.212.18 1.348.4.597.4 1.024.4.776.18.776.4.709.4 1.576.4 1.688.18 1.824.4.867.4 1.624.4 1.376.18 1.376.4c0 .229 1.2.4 2.8.4 1.54 0 2.8.167 2.8.372 0 .802 10.826.895 108.4.93 94.808.034 107.6-.079 107.6-.953 0-.192 1.339-.349 2.976-.349s3.088-.18 3.224-.4.676-.4 1.2-.4 1.064-.18 1.2-.4.957-.4 1.824-.4 1.576-.18 1.576-.4.54-.4 1.2-.4 1.2-.18 1.2-.4.54-.4 1.2-.4 1.2-.18 1.2-.4.36-.4.8-.4.8-.18.8-.4.328-.4.73-.4c.729 0 10.031-4.545 10.449-5.105.122-.163.716-.551 1.321-.863s1.1-.717 1.1-.9c0-.182.248-.332.552-.332.303 0 1.293-.72 2.2-1.6s1.846-1.6 2.088-1.6c.241 0 .916-.506 1.5-1.125.583-.618 1.375-1.242 1.76-1.387s.7-.518.7-.829.36-.66.8-.775.8-.496.8-.847c0-.37.335-.637.8-.637q.8 0 .8-.8t.8-.8.8-.8c0-.452.267-.8.613-.8.336 0 .715-.267.84-.593.125-.327.929-1.339 1.787-2.25s1.56-1.823 1.56-2.028.539-.948 1.198-1.651 1.199-1.503 1.2-1.778.137-.501.302-.503c.335-.004 1.3-1.92 1.3-2.581 0-.233.36-.648.8-.923s.8-.819.8-1.208c0-.39.36-.968.8-1.285s.8-.994.8-1.505.36-1.315.8-1.787.8-1.275.8-1.783c0-.509.18-.925.4-.925s.4-.36.4-.8.18-.8.4-.8.4-.54.4-1.2.18-1.2.4-1.2.4-.439.4-.976.18-1.088.4-1.224.4-.777.4-1.424.18-1.176.4-1.176.4-.9.4-2 .18-2 .4-2 .4-.619.4-1.376.18-1.488.4-1.624.4-1.756.4-3.6.18-3.464.4-3.6c.554-.343.554-212.857 0-213.2-.22-.136-.4-1.846-.4-3.8s-.18-3.664-.4-3.8-.4-.777-.4-1.424-.18-1.176-.4-1.176-.4-.722-.4-1.605-.158-1.918-.351-2.3c-.536-1.062-1.249-3.471-1.249-4.223 0-.37-.18-.672-.4-.672s-.4-.439-.4-.976-.18-1.088-.4-1.224-.4-.597-.4-1.024-.18-.776-.4-.776-.404-.405-.409-.9-.361-1.35-.791-1.9-.786-1.281-.791-1.625c-.005-.343-.369-1.011-.809-1.483s-.8-1.049-.8-1.281c0-.41-.795-2.007-1.201-2.411-.11-.11-.455-.695-.767-1.3s-.717-1.1-.9-1.1c-.182 0-.332-.264-.332-.586s-.36-.779-.8-1.014-.8-.692-.8-1.014-.18-.586-.4-.586-.4-.226-.4-.502-.72-1.267-1.6-2.201-1.601-1.833-1.602-1.998c-.004-.471-3.402-3.938-4.137-4.22-.363-.14-.661-.53-.661-.866 0-.346-.348-.613-.8-.613q-.8 0-.8-.8c0-.444-.267-.8-.6-.8-.329 0-1.341-.72-2.248-1.6s-1.808-1.6-2.004-1.6-.92-.54-1.611-1.2-1.499-1.2-1.796-1.2c-.298 0-.541-.138-.541-.306s-.72-.75-1.6-1.294-1.6-1.126-1.6-1.294-.36-.306-.8-.306-.8-.18-.8-.4-.36-.4-.8-.4-.8-.18-.8-.4-.278-.4-.617-.4-1.003-.36-1.475-.8-1.275-.8-1.783-.8c-.509 0-.925-.136-.925-.302 0-.167-.585-.542-1.3-.834-2.75-1.123-3.322-1.368-3.995-1.711-.382-.194-1.147-.353-1.7-.353s-1.005-.18-1.005-.4-.349-.4-.776-.4-.888-.18-1.024-.4-.867-.4-1.624-.4-1.376-.18-1.376-.4-.709-.4-1.576-.4-1.688-.18-1.824-.4-1.392-.4-2.79-.4c-1.679 0-2.6-.17-2.71-.5-.155-.465-189.393-.838-208.4-.411" fill="#158af2"/><path d="M144.999 63.096c-2.055 3.524-2.324 4.036-3 5.704-.312.77-1.282 2.66-2.157 4.2-2.744 4.829-14.251 28.101-15.064 30.463-.426 1.24-1.239 3.083-1.806 4.096s-2.259 4.451-3.761 7.641c-1.501 3.19-4.263 8.95-6.136 12.8s-3.944 8.35-4.602 10-2.035 4.8-3.06 7a478 478 0 0 0-2.215 4.8c-.331.754-1.732 3.777-5.19 11.2a661 661 0 0 0-6.025 13.4c-2.411 5.561-6.915 15.487-7.804 17.2-.845 1.627-3.083 6.507-6.236 13.6-.636 1.43-1.333 2.913-1.549 3.295-1.936 3.415-1.286 3.531 21.159 3.798 10.781.128 19.837.378 20.125.557.665.414.536 7.166-.279 14.55-.316 2.86-.936 9.16-1.379 14l-1.63 17.8c-1.78 19.424-2.371 26.002-2.786 31-.237 2.86-.598 6.91-.801 9s-.57 6.41-.814 9.6-.605 7.42-.802 9.4c-.738 7.423-.97 21.528-.351 21.321.922-.307 6.958-12.98 10.821-22.721 1.091-2.75 2.679-6.53 3.528-8.4s1.757-4.12 2.017-5c.797-2.699 2.69-7.529 5.131-13.091 1.281-2.92 2.735-6.389 3.23-7.709.494-1.32 1.622-4.11 2.506-6.2 3.201-7.57 2.977-7.013 6.122-15.2 1.543-4.017 9.257-22.541 11.577-27.8 1.487-3.371 1.575-3.579 3.194-7.6.797-1.98 1.447-3.761 1.444-3.959s.991-2.717 2.21-5.6 2.552-6.051 2.961-7.041c1.573-3.804 2.941-7.047 3.459-8.2 2.656-5.911 7.582-18.364 8.387-21.2.374-1.32.991-3.12 1.372-4 2.468-5.709 4.633-5.161-21.309-5.4-11.927-.11-21.911-.346-22.186-.524-.805-.521-.596-4.404.675-12.548.647-4.14 1.451-9.508 1.787-11.928.858-6.165 1.851-12.661 4.403-28.8 1.217-7.7 2.323-15.08 2.457-16.4.234-2.298 2.714-18.455 3.992-26 .728-4.302.979-13.453.374-13.664-.227-.079-1.122 1.073-1.989 2.56m16.374 8.055c-1.319.805-2.399 3.728-3.418 9.249-.264 1.43-1.192 5.21-2.063 8.4-5.711 20.925-6.155 23.339-4.43 24.079.88.377 16.454.492 68.738.504l67.6.017 3.158-.915c12.888-3.733 18.699-10.035 25.976-28.172 4.295-10.706 4.506-11.728 2.625-12.735-2.564-1.372-155.957-1.786-158.186-.427m29.484 99.65c-.958.205-1.948.543-2.2.753-1.046.87-12.415 25.945-14.076 31.046-.501 1.54-1.58 4.408-2.398 6.374-1.175 2.826-1.41 3.788-1.125 4.6l.361 1.026 27.013.103 27.013.103 2.178-1.103c2.978-1.509 4.611-3.841 7.619-10.879 1.369-3.203 3.269-7.509 4.221-9.568.952-2.06 2.167-4.94 2.699-6.4.532-1.461 1.871-4.69 2.975-7.176 3.308-7.446 3.159-8.171-1.78-8.612-4.809-.429-50.645-.662-52.5-.267M157.6 271.179c-5.033.748-5.478 1.29-10.372 12.621-1.14 2.64-2.768 6.33-3.618 8.2s-1.671 3.85-1.826 4.4c-.154.55-1.358 3.61-2.676 6.8-7.308 17.687-7.176 17.219-5.064 17.955 2.688.938 111.074.614 113.621-.339 4.432-1.658 8.661-7.551 10.529-14.674.298-1.132 1.119-3.378 1.827-4.99a133 133 0 0 0 2.195-5.342c.499-1.325 2.455-6.215 4.347-10.865 4.936-12.133 4.937-12.505.037-13.336-3.318-.562-105.399-.965-109-.43" fill="#f7fbfb"/></g></svg>
        </div>
        <div className="logo-texts">
          <div className="logo-main">EkagraZone</div>
          <div className="logo-cursive">focus. master. win.</div>
        </div>
      </div>

      <div className="counter" id="counter">{String(curScene + 1).padStart(2, '0')} / {String(totalScenes).padStart(2, '0')}</div>

      <div className={`scene ${curScene === 0 ? 'active' : ''}`} id="s0">
        <div className="fade-el badge">The Study App for Serious Students</div>
        <div className="scene-title-wrap fade-el">
          <div className="hero-title">Unleash Your<br/><span className="cursive">Peak.</span></div>
        </div>
        <div className="fade-el hero-sub">Built for JEE · NEET · BITSAT · UGEE aspirants who refuse to settle.</div>
        <div className="fade-el hero-tagline">"Study smarter, not harder."</div>
      </div>

      <div className={`scene ${curScene === 1 ? 'active' : ''}`} id="s1">
        <div className="fade-el badge">Feature 01 · Focus Timer</div>
        <div className="scene-title-wrap fade-el">
          <div className="hero-title">Stay in the <span className="cyan">Zone.</span></div>
        </div>
        <div className="mockup fade-el">
          <div className="app-window">
            <div className="window-bar">
              <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
              <div className="wtitle">focus · pomodoro · physics</div>
            </div>
            <div className="wbody">
              <div className="mode-pills">
                <div className="pill pill-active">Pomodoro</div>
                <div className="pill pill-idle">Short Break</div>
                <div className="pill pill-idle">Stopwatch</div>
              </div>
              <div className="timer-time" id="timerEl">{timerStr}</div>
              <div className="timer-sub">Deep Work · Session 2</div>
              <div className="bar-track"><div className="bar-fill" style={{width:'65%'}}></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`scene ${curScene === 2 ? 'active' : ''}`} id="s2">
        <div className="fade-el badge">Feature 02 · Syllabus Tracker</div>
        <div className="scene-title-wrap fade-el">
          <div className="hero-title">Master Every <span className="cyan">Chapter.</span></div>
        </div>
        <div className="mockup fade-el">
          <div className="app-window">
            <div className="window-bar">
              <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
              <div className="wtitle">syllabus · JEE Physics · 62% done</div>
            </div>
            <div className="wbody">
              <div className="syl-row"><div className="sdot s-done">✓</div><div className="sname">Newton's Laws of Motion</div><div className="spct">100%</div></div>
              <div className="syl-row"><div className="sdot s-done">✓</div><div className="sname">Work, Energy & Power</div><div className="spct">100%</div></div>
              <div className="syl-row"><div className="sdot s-prog"></div><div className="sname">Rotational Motion</div><div className="spct">60%</div></div>
              <div className="syl-row"><div className="sdot s-rev"></div><div className="sname">Gravitation</div><div className="spct">40%</div></div>
              <div className="syl-row"><div className="sdot s-none"></div><div className="sname">Thermodynamics</div><div className="spct">0%</div></div>
              <div className="syl-row"><div className="sdot s-none"></div><div className="sname">Electrostatics</div><div className="spct">0%</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`scene ${curScene === 3 ? 'active' : ''}`} id="s3">
        <div className="fade-el badge">Feature 03 · Smart Kanban</div>
        <div className="scene-title-wrap fade-el">
          <div className="hero-title">Plan <span className="cyan">Smarter.</span></div>
        </div>
        <div className="mockup fade-el">
          <div className="app-window">
            <div className="window-bar">
              <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
              <div className="wtitle">plan · today's tasks</div>
            </div>
            <div className="wbody">
              <div className="kanban-cols">
                <div className="kcol">
                  <div className="ctitle">To Do</div>
                  <div className="tcard"><div className="ttitle">Solve integration PYQs</div><div className="ttag tag-h">High</div></div>
                  <div className="tcard"><div className="ttitle">Revise p-block</div><div className="ttag tag-m">Med</div></div>
                </div>
                <div className="kcol">
                  <div className="ctitle">Doing</div>
                  <div className="tcard"><div className="ttitle">Rotational motion numericals</div><div className="ttag tag-h">High</div></div>
                </div>
                <div className="kcol">
                  <div className="ctitle">Done</div>
                  <div className="tcard"><div className="ttitle">Bohr's model notes</div><div className="ttag tag-d">Done</div></div>
                  <div className="tcard"><div className="ttitle">Mole concept revision</div><div className="ttag tag-d">Done</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`scene ${curScene === 4 ? 'active' : ''}`} id="s4">
        <div className="fade-el badge">Feature 04 · Study Rooms</div>
        <div className="scene-title-wrap fade-el">
          <div className="hero-title">Study <span className="cyan">Together.</span></div>
        </div>
        <div className="mockup fade-el">
          <div className="app-window">
            <div className="window-bar">
              <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
              <div className="wtitle">study room · ZEN123 · 3 members</div>
            </div>
            <div className="wbody">
              <div className="room-time" id="roomEl">{roomStr}</div>
              <div className="room-mode">Pomodoro · Round 2 of 4</div>
              <div className="prog-bar"><div className="prog-fill"></div></div>
              <div className="member-row">
                <div className="avatar" style={{background:'#06b6d4'}}>A<div className="online-dot od-cyan"></div></div>
                <div className="mname">Abhyuday</div><div className="mstatus ms-focus">Focusing</div>
              </div>
              <div className="member-row">
                <div className="avatar" style={{background:'#8b5cf6'}}>R<div className="online-dot od-cyan"></div></div>
                <div className="mname">Rohan</div><div className="mstatus ms-focus">Focusing</div>
              </div>
              <div className="member-row">
                <div className="avatar" style={{background:'#10b981'}}>P<div className="online-dot od-green"></div></div>
                <div className="mname">Priya</div><div className="mstatus ms-break">On Break</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="nav-dots" id="navDots">
        {Array.from({length: totalScenes}).map((_, i) => (
          <div 
            key={i} 
            className={`ndot ${curScene === i ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurScene(i);
              setPlaying(false);
            }}
          />
        ))}
      </div>
      <div 
        className="ctrl-btn" 
        onClick={(e) => { e.stopPropagation(); setPlaying(!playing); }}
      >
        {playing ? '⏸' : '▶'}
      </div>
    </div>
  );
};

const StarsLayer = React.memo(() => {
  const starsRender = [];
  for (let i = 0; i < 90; i++) {
    const sz = Math.random() * 2 + 0.4;
    starsRender.push(
      <div
        key={`star-${i}`}
        className="star"
        style={{ width:`${sz}px`, height:`${sz}px`, left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, animationDuration:`${2+Math.random()*5}s`, animationDelay:`${Math.random()*5}s` }}
      />
    );
  }
  for(let i=0;i<3;i++){
    starsRender.push(
      <div
        key={`meteor-${i}`} className="meteor"
        style={{ left:`${20+Math.random()*60}%`, animationDuration:`${3+Math.random()*4}s`, animationDelay:`${i*3+Math.random()*3}s`, transform:'rotate(15deg)' }}
      />
    );
  }
  return <>{starsRender}</>;
});
