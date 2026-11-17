(() => {
  'use strict';
  if (!window.gsap) return;
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const timeline = gsap.timeline({defaults:{duration:.65,ease:'power3.out'}});
    timeline.from('.hero-content > *',{opacity:0,y:16,stagger:.09},.1)
      .from('.hero-art img',{scale:1.025,duration:1.2},0)
      .from('.hero-bottom',{opacity:0,duration:.5},.5);
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        gsap.fromTo(entry.target,{opacity:.5,y:14},{opacity:1,y:0,duration:.55,ease:'power2.out',clearProps:'opacity,transform'});
        reveal.unobserve(entry.target);
      });
    },{threshold:.08});
    document.querySelectorAll('.section-top,.project-grid,.episode-layout,.about-section,.work-contact').forEach(el => reveal.observe(el));
    const panel = document.getElementById('clip-grid');
    const clips = new MutationObserver(() => {
      if (panel.getBoundingClientRect().top < innerHeight && panel.getBoundingClientRect().bottom > 0)
        gsap.fromTo(panel,{opacity:.65,y:6},{opacity:1,y:0,duration:.23,overwrite:true,clearProps:'opacity,transform'});
    });
    clips.observe(panel,{childList:true});
    const dialog = document.getElementById('player-dialog');
    const player = new MutationObserver(() => {
      if (dialog.open) gsap.fromTo(dialog.querySelector('.player-shell'),{opacity:.5,y:12},{opacity:1,y:0,duration:.28,ease:'power2.out',overwrite:true,clearProps:'opacity,transform'});
    });
    player.observe(dialog,{attributes:true,attributeFilter:['open']});
    return () => { reveal.disconnect();clips.disconnect();player.disconnect(); };
  });
})();
