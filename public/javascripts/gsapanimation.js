gsap.from("#title span ", {
    duration: 1.5,
    opacity: 0,
    y:-100,
    stagger: 0.3,  // Adds a 0.1 second delay between each letter's animation
    ease: "back.out(1.7)"  // Easing for a smooth entry
  });

  gsap.from(".slogan", {
    duration: 5,
    opacity: 0,
  });
